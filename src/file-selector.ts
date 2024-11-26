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
 * @param evt
 */
export async function fromEvent(
  evt: Event | any,
): Promise<(FileWithPath | DataTransferItem)[]> {
  if (isObject<DragEvent>(evt) && isDataTransfer(evt.dataTransfer)) {
    return getDataTransferFiles(evt.dataTransfer, evt.type);
  }
  return [];
}

/**
 * Retrieves files from the `change` event of a file input element.
 *
 * @param event The `change` event of a file input element to retrieve files from.
 * @throws If the event is not associated with a valid file input element.
 * @returns An array of file objects retrieved from the event.
 *
 * @example
 * ```js
 * const input = document.getElementById("myInput");
 * input.addEventListener("change", (event) => {
 *   const files = fromChangeEvent(event);
 *   console.log(files);
 * });
 * ```
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file|MDN - `<input type="file">`}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event|MDN - HTMLElement: `change` event}
 */
export function fromChangeEvent(event: Event): FileWithPath[] {
  if (!(event.target instanceof HTMLInputElement) || !event.target.files) {
    throw new Error("Event is not associated with a valid file input element.");
  }

  return Array.from(event.target.files).map((file) => toFileWithPath(file));
}

/**
 * Retrieves files from an array of `FileSystemHandle` objects from the File System API.
 *
 * @param handles The array of handles to convert.
 * @returns A promise that resolves to an array of files retrieved from the handles.
 *
 * @example
 * ```js
 * const handles = await window.showOpenFilePicker({ multiple: true });
 * const files = await fromFileHandles(handles);
 * ```
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/File_System_API|MDN - File System API}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/FileSystemHandle|MDN - `FileSystemHandle`}
 */
export function fromFileHandles(
  handles: FileSystemFileHandle[],
): Promise<FileWithPath[]> {
  return Promise.all(handles.map((handle) => fromFileHandle(handle)));
}

async function fromFileHandle(
  handle: FileSystemFileHandle,
): Promise<FileWithPath> {
  const file = await handle.getFile();
  return toFileWithPath(file);
}

function isDataTransfer(value: any): value is DataTransfer {
  return isObject(value);
}

function isObject<T>(v: any): v is T {
  return typeof v === "object" && v !== null;
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

async function fromDataTransferItem(
  item: DataTransferItem,
  entry?: FileSystemEntry | null,
): Promise<FileWithPath> {
  const fileWithPath = await fromFileSystemHandle(item, entry);
  if (fileWithPath) {
    return fileWithPath;
  }

  const file = item.getAsFile();
  if (!file) {
    throw new Error("Transferred item is not a file.");
  }
  return toFileWithPath(file, entry?.fullPath);
}

async function fromFileSystemHandle(
  item: PartialDataTransferItem,
  entry?: FileSystemEntry | null,
): Promise<File | null> {
  // Check if we're in a secure context; due to a bug in Chrome (as far as we know)
  // the browser crashes when calling this API (yet to be confirmed as a consistent behavior).
  // See:
  // - https://issues.chromium.org/issues/40186242
  // - https://github.com/react-dropzone/react-dropzone/issues/1397
  // If the browser does not support the API act as if the file could not be retrieved.
  if (
    !globalThis.isSecureContext ||
    !(typeof item.getAsFileSystemHandle === "function")
  ) {
    return null;
  }

  const handle = await item.getAsFileSystemHandle();

  // The handle can be undefined due to a browser bug, in this case we act as if the file could not be retrieved.
  // See: https://github.com/react-dropzone/file-selector/issues/120
  if (handle === undefined) {
    return null;
  }

  if (!handle || !isFileHandle(handle)) {
    throw new Error("Transferred item is not a file.");
  }

  return toFileWithPath(await handle.getFile(), entry?.fullPath, handle);
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

const isFileHandle = (
  handle: FileSystemHandle,
): handle is FileSystemFileHandle => handle.kind === "file";

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

interface PartialDataTransferItem extends DataTransferItem {
  // This method is not yet widely supported in all browsers, and is thus marked as optional.
  // See: https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem/getAsFileSystemHandle
  // Additionally, this method is known to return `undefined` in some cases due to browser bugs.
  // See: https://github.com/react-dropzone/file-selector/issues/120
  getAsFileSystemHandle?(): Promise<FileSystemHandle | null | undefined>;
}

// Infinite type recursion
// https://github.com/Microsoft/TypeScript/issues/3496#issuecomment-128553540
interface FileArray extends Array<FileValue> {}
type FileValue = FileWithPath | FileArray[];
