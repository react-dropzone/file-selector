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
export async function fromEvent(evt: Event): Promise<FileWithPath[]> {
    if (isDragEvt(evt)) {
        const dt = evt.dataTransfer!;
        if (dt.items && dt.items.length) {
            return getDataTransferFiles(dt);
        } else if (dt.files && dt.files.length) {
            return fromFileList(dt.files);
        }
    } else if (evt.target instanceof HTMLInputElement && evt.target.files && evt.target.files) {
        return fromFileList(evt.target.files);
    }

    return [];
}

function isDragEvt(value: any): value is DragEvent {
    return !!value.dataTransfer;
}

async function getDataTransferFiles(dt: DataTransfer) {
    const items = Array.from(dt.items);
    const files = await Promise.all(items.map(item => toFilePromises(item)));
    return flatten<FileWithPath>(files)
        .filter(file => !FILES_TO_IGNORE.includes(file.name));
}

// https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem
function toFilePromises(item: DataTransferItem) {
    if (typeof item.webkitGetAsEntry !== 'function') {
        if (item.kind === 'file') {
            return fromDataTransferItem(item);
        }
        return [];
    }

    const entry = item.webkitGetAsEntry();
    if (entry) {
        return fromEntry(entry);
    }

    return [];
}

function flatten<T>(items: any[]): T[] {
    return items.reduce((acc, files) => [
        ...acc,
        ...(Array.isArray(files) ? flatten(files) : [files])
    ], []);
}

function fromFileList(fileList: FileList) {
    return Array.from(fileList)
        .map(file => toFileWithPath(file));
}

function fromDataTransferItem(item: DataTransferItem) {
    const file = item.getAsFile()!;
    const fwp = toFileWithPath(file);
    return Promise.resolve(fwp);
}

// https://developer.mozilla.org/en-US/docs/Web/API/FileSystemEntry
async function fromEntry(entry: any) {
    if (entry.isDirectory) {
        return fromDirEntry(entry);
    } else {
        return fromFileEntry(entry);
    }
}

// https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryEntry
function fromDirEntry(entry: any) {
    const reader = entry.createReader();

    return new Promise<FileArray[]>(resolve => {
        const entries: Array<Promise<FileValue[]>> = [];

        function readEntries() {
            // https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryEntry/createReader
            // https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryReader/readEntries
            reader.readEntries((batch: any[]) => {
                if (!batch.length) {
                    // Done reading directory
                    resolve(Promise.all(entries));
                } else {
                    const items = Promise.all(batch.map(fromEntry));
                    entries.push(items);

                    // Continue reading
                    readEntries();
                }
            }, noop);
        }

        readEntries();
    });
}

// https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileEntry
async function fromFileEntry(entry: any) {
    return new Promise<FileWithPath>(resolve => {
        entry.file((file: File) => {
            const fwp = toFileWithPath(file, entry.fullPath);
            resolve(fwp);
        });
    });
}

// tslint:disable-next-line: no-empty
function noop() {}


// Infinite type recursion
// https://github.com/Microsoft/TypeScript/issues/3496#issuecomment-128553540
interface FileArray extends Array<FileValue> {}
type FileValue = FileWithPath
    | FileArray[];
