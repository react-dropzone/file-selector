import {UnexpectedObjectError} from "./error";
import {type FileWithPath, toFileWithPath, withMimeType} from "./file";
import {DEFAULT_MIME_TYPES} from "./mime-default";

const FILES_TO_IGNORE = [
  // Thumbnail cache files for macOS and Windows
  ".DS_Store", // macOs
  "Thumbs.db" // Windows
];

export interface FromEventOptions {
  /**
   * Extension-to-MIME lookup used to set `type` on files the browser left typeless.
   * Defaults to a small built-in set of common types ({@link DEFAULT_MIME_TYPES}).
   *
   * The full extension-to-MIME table (~1,200 entries) is not bundled into the main entry;
   * import it from the `file-selector/mime` subpath when broader coverage is needed:
   *
   * ```ts
   * import {fromEvent} from 'file-selector';
   * import {COMMON_MIME_TYPES} from 'file-selector/mime';
   * await fromEvent(evt, {mimeTypes: COMMON_MIME_TYPES});
   * ```
   *
   * See https://github.com/react-dropzone/file-selector/issues/127
   */
  mimeTypes?: Map<string, string>;
}

/**
 * Convert a DragEvent's DataTrasfer object to a list of File objects
 * NOTE: If some of the items are folders,
 * everything will be flattened and placed in the same list but the paths will be kept as a {path} property.
 *
 * EXPERIMENTAL: A list of https://developer.mozilla.org/en-US/docs/Web/API/FileSystemHandle objects can also be passed as an arg
 * and a list of File objects will be returned.
 *
 * @param evt
 * @param options
 */
export async function fromEvent(
  evt: Event | any,
  {mimeTypes = DEFAULT_MIME_TYPES}: FromEventOptions = {}
): Promise<(FileWithPath | DataTransferItem)[]> {
  const items = await getFilesOrItems(evt);
  // Guess a MIME type from the file extension once, over the final flat list, for any file the
  // browser left typeless. DataTransferItems (returned for non-'drop' drag events) pass through as-is.
  return items.map(item => (item instanceof File ? withMimeType(item, mimeTypes) : item));
}

async function getFilesOrItems(evt: Event | any): Promise<(FileWithPath | DataTransferItem)[]> {
  if (isObject<DragEvent>(evt) && isDataTransfer(evt.dataTransfer)) {
    return getDataTransferFiles(evt.dataTransfer, evt.type);
  } else if (isChangeEvt(evt)) {
    return getInputFiles(evt);
  } else if (Array.isArray(evt) && evt.every(item => "getFile" in item && typeof item.getFile === "function")) {
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

function getInputFiles(evt: Event) {
  return fromList<FileWithPath>((evt.target as HTMLInputElement).files).map(file => toFileWithPath(file));
}

// Ee expect each handle to be https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle
async function getFsHandleFiles(handles: any[]) {
  const files = await Promise.all(handles.map(h => h.getFile()));
  return files.map(file => toFileWithPath(file));
}

async function getDataTransferFiles(dt: DataTransfer, type: string) {
  const items = fromList<DataTransferItem>(dt.items).filter(item => item.kind === "file");
  // According to https://html.spec.whatwg.org/multipage/dnd.html#dndevents,
  // only 'dragstart' and 'drop' has access to the data (source node)
  if (type !== "drop") {
    return items;
  }
  const files = await Promise.all(items.map(toFilePromises));
  return noIgnoredFiles(flatten<FileWithPath>(files));
}

function noIgnoredFiles(files: FileWithPath[]) {
  return files.filter(file => FILES_TO_IGNORE.indexOf(file.name) === -1);
}

// https://developer.mozilla.org/en-US/docs/Web/API/FileList
// https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItemList
function fromList<T>(items: DataTransferItemList | FileList | null): T[] {
  // {items} can be null, e.g. an <input type="file"> with no selection
  if (items === null) {
    return [];
  }
  return Array.from(items as unknown as ArrayLike<T>);
}

// https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem
async function toFilePromises(item: DataTransferItem) {
  if (typeof item.webkitGetAsEntry !== "function") {
    return fromDataTransferItem(item);
  }

  const entry = item.webkitGetAsEntry();

  // Safari supports dropping an image node from a different window and can be retrieved using
  // the DataTransferItem.getAsFile() API
  // NOTE: FileSystemEntry.file() throws if trying to get the file
  if (entry?.isDirectory) {
    // Prefer the File System Access API for directory traversal where it's available.
    // The legacy Entry API (FileSystemDirectoryReader.readEntries) throws on some platforms,
    // e.g. dragging a folder from Windows Explorer into a Chromium browser, which would
    // otherwise reject the entire drop and lose every file.
    // See https://github.com/react-dropzone/file-selector/issues/130
    const handle = await getFsHandle(item);
    if (handle?.kind === "directory") {
      return fromDirHandle(handle, `/${handle.name}`);
    }
    return fromDirEntry(entry) as any;
  }

  return fromDataTransferItem(item, entry);
}

function flatten<T>(items: any[]): T[] {
  const result: T[] = [];
  for (const item of items) {
    if (Array.isArray(item)) {
      result.push(...flatten<T>(item));
    } else {
      result.push(item);
    }
  }
  return result;
}

async function fromDataTransferItem(item: DataTransferItem, entry?: FileSystemEntry | null) {
  // Read the File synchronously, before awaiting anything. A DataTransferItem's accessors are
  // only valid during the synchronous part of the drop event; awaiting `getAsFileSystemHandle()`
  // (which resolves on a later task) neuters the item in Chromium, after which `getAsFile()`
  // returns `null`. Capturing it up front lets us recover the drop when no handle is available.
  // See https://github.com/react-dropzone/react-dropzone/issues/1435
  const syncFile = item.getAsFile();

  const h = await getFsHandle(item);
  if (h !== null && h !== undefined) {
    // Hand back the File we captured synchronously from the DataTransferItem when we have it,
    // rather than `handle.getFile()`. Both wrap the same dropped file, but only the original
    // preserves the File object identity that Electron's `webUtils.getPathForFile()` needs to
    // resolve an on-disk path; a File from `FileSystemFileHandle.getFile()` loses it
    // (electron/electron#33647), which broke drag-and-drop path access in Electron.
    // See https://github.com/react-dropzone/react-dropzone/issues/1411
    // `syncFile` is only null in rare cases (e.g. a cross-window drop where getAsFile() returned
    // null), so fall back to the handle's File there. Either way, attach the durable handle.
    const file = syncFile ?? (await h.getFile());
    file.handle = h;
    return toFileWithPath(file);
  }
  // No usable handle. `h` is `null` when Chromium has no backing handle for the item (e.g. a file
  // dragged out of an archive — see the issue above) and `undefined` when the File System Access
  // API is unavailable or we're not in a secure context (see
  // https://github.com/react-dropzone/file-selector/issues/120). In both cases fall back to the
  // File we captured synchronously rather than throwing or re-reading a now-neutered item.
  if (!syncFile) {
    throw new UnexpectedObjectError(item);
  }
  return toFileWithPath(syncFile, entry?.fullPath ?? undefined);
}

// Resolve the https://developer.mozilla.org/en-US/docs/Web/API/FileSystemHandle for a dropped item.
// Returns `undefined` when the File System Access API isn't available or we're not in a secure context.
//
// We check for a secure context because, due to a bug in Chrome (as far as we know),
// the browser crashes when calling this API (yet to be confirmed as a consistent behaviour).
// See:
// - https://issues.chromium.org/issues/40186242
// - https://github.com/react-dropzone/react-dropzone/issues/1397
async function getFsHandle(item: DataTransferItem) {
  if (globalThis.isSecureContext && typeof (item as any).getAsFileSystemHandle === "function") {
    return (item as any).getAsFileSystemHandle();
  }
  return undefined;
}

// Traverse a directory recursively using the File System Access API, returning a flat list of files.
// https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryHandle
async function fromDirHandle(handle: any, path: string): Promise<FileWithPath[]> {
  const files: FileWithPath[] = [];
  for await (const child of handle.values()) {
    const childPath = `${path}/${child.name}`;
    if (child.kind === "directory") {
      files.push(...(await fromDirHandle(child, childPath)));
    } else {
      const file = await child.getFile();
      files.push(toFileWithPath(file, childPath, child));
    }
  }
  return files;
}

// https://developer.mozilla.org/en-US/docs/Web/API/FileSystemEntry
async function fromEntry(entry: any) {
  return entry.isDirectory ? fromDirEntry(entry) : fromFileEntry(entry);
}

// https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryEntry
function fromDirEntry(entry: any) {
  const reader = entry.createReader();

  return new Promise<FileArray[]>((resolve, reject) => {
    const entries: Promise<FileValue[]>[] = [];

    function readEntries() {
      // https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryEntry/createReader
      // https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryReader/readEntries
      reader.readEntries(
        async (batch: any[]) => {
          if (!batch.length) {
            // Done reading directory
            try {
              const files = await Promise.all(entries);
              resolve(files);
            } catch (err) {
              reject(err);
            }
          } else {
            const items = Promise.all(batch.map(fromEntry));
            entries.push(items);

            // Continue reading
            readEntries();
          }
        },
        (err: any) => {
          reject(err);
        }
      );
    }

    readEntries();
  });
}

// https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileEntry
async function fromFileEntry(entry: any) {
  return new Promise<FileWithPath>((resolve, reject) => {
    entry.file(
      (file: FileWithPath) => {
        const fwp = toFileWithPath(file, entry.fullPath);
        resolve(fwp);
      },
      (err: any) => {
        reject(err);
      }
    );
  });
}

// Infinite type recursion
// https://github.com/Microsoft/TypeScript/issues/3496#issuecomment-128553540
interface FileArray extends Array<FileValue> {}
type FileValue = FileWithPath | FileArray[];
