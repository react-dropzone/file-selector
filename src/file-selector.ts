import { FileWithPath, toFileWithPath } from "./file.js";

const FILES_TO_IGNORE = [
  // Thumbnail cache files for macOS and Windows
  ".DS_Store", // macOs
  "Thumbs.db", // Windows
];

/**
 * Convert a DragEvent's DataTrasfer object to a list of File objects
 * NOTE: If some of the items are folders,
 * everything will be flattened and placed in the same list but the paths will be kept as a {path} property.
 *
 * EXPERIMENTAL: A list of https://developer.mozilla.org/en-US/docs/Web/API/FileSystemHandle objects can also be passed as an arg
 * and a list of File objects will be returned.
 *
 * @param evt
 */
export async function fromEvent(
  evt: Event | any,
): Promise<(FileWithPath | DataTransferItem)[]> {
  if (isObject<DragEvent>(evt) && isDataTransfer(evt.dataTransfer)) {
    return getDataTransferFiles(evt.dataTransfer, evt.type);
  } else if (isChangeEvt(evt)) {
    return getInputFiles(evt);
  } else if (
    Array.isArray(evt) &&
    evt.every((item) => "getFile" in item && typeof item.getFile === "function")
  ) {
    return getFsHandleFiles(evt);
  }
  return [];
}

function isDataTransfer(value: any): value is DataTransfer {
  return isObject(value);
}

function isChangeEvt(value: any): value is Event {
  return isObject<Event>(value) && isObject(value.target);
}

function isObject<T>(v: any): v is T {
  return typeof v === "object" && v !== null;
}

function getInputFiles(event: Event): FileWithPath[] {
  if (!(event.target instanceof HTMLInputElement) || !event.target.files) {
    return [];
  }

  return Array.from(event.target.files).map((file) => toFileWithPath(file));
}

// Ee expect each handle to be https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle
async function getFsHandleFiles(handles: any[]) {
  const files = await Promise.all(handles.map((h) => h.getFile()));
  return files.map((file) => toFileWithPath(file));
}

async function getDataTransferFiles(dataTransfer: DataTransfer, type: string) {
  const items = Array.from(dataTransfer.items).filter(
    (item) => item.kind === "file",
  );

  // According to https://html.spec.whatwg.org/multipage/dnd.html#dndevents,
  // only 'dragstart' and 'drop' has access to the data (source node)
  if (type !== "drop") {
    return items;
  }

  const files = await Promise.all(items.map(toFilePromises));
  return noIgnoredFiles(flatten<FileWithPath>(files));
}

function noIgnoredFiles(files: FileWithPath[]) {
  return files.filter((file) => FILES_TO_IGNORE.indexOf(file.name) === -1);
}

// https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem
function toFilePromises(item: DataTransferItem) {
  if (typeof item.webkitGetAsEntry !== "function") {
    return fromDataTransferItem(item);
  }

  const entry = item.webkitGetAsEntry();

  // Safari supports dropping an image node from a different window and can be retrieved using
  // the DataTransferItem.getAsFile() API
  // NOTE: FileSystemEntry.file() throws if trying to get the file
  if (entry && isDirectoryEntry(entry)) {
    return fromDirectoryEntry(entry);
  }

  return fromDataTransferItem(item, entry);
}

function flatten<T>(items: any[]): T[] {
  return items.reduce(
    (acc, files) => [
      ...acc,
      ...(Array.isArray(files) ? flatten(files) : [files]),
    ],
    [],
  );
}

function fromDataTransferItem(
  item: DataTransferItem,
  entry?: FileSystemEntry | null,
) {
  if (typeof (item as any).getAsFileSystemHandle === "function") {
    return (item as any).getAsFileSystemHandle().then(async (h: any) => {
      const file = await h.getFile();
      file.handle = h;
      return toFileWithPath(file);
    });
  }
  const file = item.getAsFile();
  if (!file) {
    return Promise.reject(`${item} is not a File`);
  }
  const fwp = toFileWithPath(file, entry?.fullPath ?? undefined);
  return Promise.resolve(fwp);
}

async function fromEntry(
  entry: FileSystemEntry,
): Promise<FileWithPath | FileArray[]> {
  if (isDirectoryEntry(entry)) {
    return fromDirectoryEntry(entry);
  } else if (isFileEntry(entry)) {
    return fromFileEntry(entry);
  }

  return [];
}

async function fromDirectoryEntry(
  entry: FileSystemDirectoryEntry,
): Promise<FileArray[]> {
  const reader = entry.createReader();
  const entries: Promise<FileValue[]>[] = [];

  while (true) {
    const batch = await readEntries(reader);

    if (!batch.length) {
      break;
    }

    entries.push(Promise.all(batch.map(fromEntry)));
  }

  const files = await Promise.all(entries);
  return files;
}

async function fromFileEntry(
  entry: FileSystemFileEntry,
): Promise<FileWithPath> {
  const file = await getFile(entry);
  const fileWithPath = toFileWithPath(file, entry.fullPath);

  return fileWithPath;
}

const isDirectoryEntry = (
  entry: FileSystemEntry,
): entry is FileSystemDirectoryEntry => entry.isDirectory;

const isFileEntry = (entry: FileSystemEntry): entry is FileSystemFileEntry =>
  entry.isFile;

const getFile = (entry: FileSystemFileEntry): Promise<File> =>
  new Promise((resolve, reject) => entry.file(resolve, reject));

const readEntries = (
  reader: FileSystemDirectoryReader,
): Promise<FileSystemEntry[]> =>
  new Promise((resolve, reject) => reader.readEntries(resolve, reject));

// Infinite type recursion
// https://github.com/Microsoft/TypeScript/issues/3496#issuecomment-128553540
interface FileArray extends Array<FileValue> {}
type FileValue = FileWithPath | FileArray[];
