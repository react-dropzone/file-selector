import {FileWithPath, toFileWithPath} from './file';


const FILES_TO_IGNORE = [
    '.DS_Store', // macOs
    'Thumbs.db'  // Windows
];


/**
 * Convert a DragEvent's DataTrasfer object to a list of File objects
 * NOTE: If some of the items are folders,
 * everything will be flattened and placed in the same list but the paths will be kept as a {path} property.
 * @param evt
 */
export async function fromEvent(evt: Event): Promise<Array<FileWithPath | DataTransferItem>> {
    return isDragEvt(evt) && evt.dataTransfer
        ? getDataTransferFiles(evt.dataTransfer, evt.type)
        : getInputFiles(evt);
}

function isDragEvt(value: any): value is DragEvent {
    return !!value.dataTransfer;
}

function getInputFiles(evt: Event) {
    const files = isInput(evt.target)
        ? evt.target.files
            ? Array.from(evt.target.files)
            : []
        : [];
    return files.map(file => toFileWithPath(file));
}

function isInput(value: EventTarget | null): value is HTMLInputElement {
    return value !== null;
}

async function getDataTransferFiles(dt: DataTransfer, type: string) {
    const items = Array.from(dt.items)
        .filter(item => item.kind === 'file');
    // According to https://html.spec.whatwg.org/multipage/dnd.html#dndevents,
    // only 'dragstart' and 'drop' has access to the data (source node),
    // hence return the DataTransferItem for other event types
    if (type === 'drop') {
        const files = await Promise.all(items.map(item => toFilePromises(item)));
        return flatten<FileWithPath>(files)
            .filter(file => !FILES_TO_IGNORE.includes(file.name));
    }
    return items;
}

// https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem
function toFilePromises(item: DataTransferItem) {
    if (typeof item.webkitGetAsEntry !== 'function') {
        return fromDataTransferItem(item);
    }

    const entry = item.webkitGetAsEntry();

    // Safari supports dropping an image node from a different window and can be retrieved using
    // the DataTransferItem.getAsFile() API
    // NOTE: FileSystemEntry.file() throws if trying to get the file
    if (entry && entry.isDirectory) {
        return fromDirEntry(entry) as any;
    }

    return fromDataTransferItem(item);
}

function flatten<T>(items: any[]): T[] {
    return items.reduce((acc, files) => [
        ...acc,
        ...(Array.isArray(files) ? flatten(files) : [files])
    ], []);
}

function fromDataTransferItem(item: DataTransferItem) {
    const file = item.getAsFile();
    if (!file) {
        return Promise.reject(`${item} is not a File`);
    }
    const fwp = toFileWithPath(file);
    return Promise.resolve(fwp);
}

// https://developer.mozilla.org/en-US/docs/Web/API/FileSystemEntry
async function fromEntry(entry: any) {
    return entry.isDirectory ? fromDirEntry(entry) : fromFileEntry(entry);
}

// https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryEntry
function fromDirEntry(entry: any) {
    const reader = entry.createReader();

    return new Promise<FileArray[]>((resolve, reject) => {
        const entries: Array<Promise<FileValue[]>> = [];
        let empty = true;

        function readEntries() {
            // https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryEntry/createReader
            // https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryReader/readEntries
            reader.readEntries(async (batch: any[]) => {
                if (!batch.length) {
                    // Done reading directory
                    try {
                        const files = await Promise.all(entries);
                        if (empty) {
                            files.push([createEmptyDirFile(entry)]);
                        }
                        resolve(files);
                    } catch (err) {
                        reject(err);
                    }
                } else {
                    const items = Promise.all(batch.map(fromEntry));
                    entries.push(items);

                    // Continue reading
                    empty = false;
                    readEntries();
                }
            }, (err: any) => {
                reject(err);
            });
        }

        readEntries();
    });
}

function createEmptyDirFile(entry: any) {
    const file = new File([], entry.name);
    const fwp = toFileWithPath(file, entry.fullPath  + '/');
    return fwp;
}

// https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileEntry
async function fromFileEntry(entry: any) {
    return new Promise<FileWithPath>((resolve, reject) => {
        entry.file((file: File) => {
            const fwp = toFileWithPath(file, entry.fullPath);
            resolve(fwp);
        }, (err: any) => {
            reject(err);
        });
    });
}

// Infinite type recursion
// https://github.com/Microsoft/TypeScript/issues/3496#issuecomment-128553540
interface FileArray extends Array<FileValue> {}
type FileValue = FileWithPath
    | FileArray[];
