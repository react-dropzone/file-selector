import {fromEvent} from './file-selector';


it('returns a Promise', async () => {
    const evt = new Event('test');
    expect(fromEvent(evt)).toBeInstanceOf(Promise);
});

it('should return an empty array if the passed event is not a DragEvent', async () => {
    const evt = new Event('test');
    const files = await fromEvent(evt);
    expect(files).toHaveLength(0);
});

it('should return the DataTransfer {files} if the passed event is a DragEvent', async () => {
    const name = 'test.json';
    const mockFile = createFile(name, {ping: true}, {
        type: 'application/json'
    });
    const evt = dragEvtFromFiles(mockFile);

    const files = await fromEvent(evt);
    expect(files).toHaveLength(1);

    const [file] = files;

    expect(file.name).toBe(mockFile.name);
    expect(file.type).toBe(mockFile.type);
    expect(file.size).toBe(mockFile.size);
    expect(file.lastModified).toBe(mockFile.lastModified);
    expect(file.path).toBe(name);
});

it('should return the evt {target} {files} if the passed event is an input evt', async () => {
    const name = 'test.json';
    const mockFile = createFile(name, {ping: true}, {
        type: 'application/json'
    });
    const evt = inputEvtFromFiles(mockFile);

    const files = await fromEvent(evt);
    expect(files).toHaveLength(1);

    const [file] = files;

    expect(file.name).toBe(mockFile.name);
    expect(file.type).toBe(mockFile.type);
    expect(file.size).toBe(mockFile.size);
    expect(file.lastModified).toBe(mockFile.lastModified);
    expect(file.path).toBe(name);
});

it('uses the DataTransfer {items} instead of {files} if it exists', async () => {
    const name = 'test.json';
    const mockFile = createFile(name, {ping: true}, {
        type: 'application/json'
    });
    const item = dataTransferItemFromFile(mockFile);
    const evt = dragEvtFromItems(item);

    const files = await fromEvent(evt);
    expect(files).toHaveLength(1);

    const [file] = files;

    expect(file.name).toBe(mockFile.name);
    expect(file.type).toBe(mockFile.type);
    expect(file.size).toBe(mockFile.size);
    expect(file.lastModified).toBe(mockFile.lastModified);
    expect(file.path).toBe(name);
});

it('skips DataTransfer {items} that are of kind "string"', async () => {
    const item = dataTransferItemFromStr('test');
    const evt = dragEvtFromItems(item);

    const files = await fromEvent(evt);
    expect(files).toHaveLength(0);
});

it('can read a tree of directories recursively and return a flat list of FileWithPath objects', async () => {
    const mockFiles = sortFiles([
        createFile('ping.json', {ping: true}),
        createFile('pong.json', {pong: true}),
        createFile('foo.json', {foo: true}),
        createFile('bar.json', {bar: true}),
        createFile('john.json', {john: true}),
        createFile('jane.json', {jane: true})
    ]);
    const [f1, f2, f3, f4, f5, f6] = mockFiles;
    const [f7, f8] = [
        createFile('.DS_Store', {macOs: true}),
        createFile('Thumbs.db', {windows: true})
    ];
    const entries = [
        fileSystemFileEntryFromFile(f1),
        fileSystemFileEntryFromFile(f2),
        fileSystemDirEntryFromFile([
            fileSystemFileEntryFromFile(f3),
            fileSystemDirEntryFromFile([
                fileSystemFileEntryFromFile(f4)
            ]),
            fileSystemFileEntryFromFile(f5)
        ], 2),
        fileSystemFileEntryFromFile(f6),
        fileSystemFileEntryFromFile(f7),
        fileSystemFileEntryFromFile(f8)
    ];

    const evt = dragEvtFromItems(...entries.map(dataTransferItemFromEntry));

    const files = sortFiles(await fromEvent(evt));
    expect(files).toHaveLength(6);
    expect(files.every(file => file instanceof File)).toBe(true);
    expect(files.every(file => typeof file.path === 'string')).toBe(true);
    expect(files).toEqual(mockFiles);
});


function dragEvtFromFiles(...files: File[]): DragEvent {
    return {dataTransfer: {files}} as any;
}

function dragEvtFromItems(...items: DataTransferItem[]): DragEvent {
    return {dataTransfer: {items}} as any;
}

function dataTransferItemFromFile(file: File): DataTransferItem {
    return {
        kind: 'file',
        type: file.type,
        getAsFile() {
            return file;
        },
        // tslint:disable-next-line: no-empty
        getAsString() {}
    } as any;
}

function dataTransferItemFromStr(str: string): DataTransferItem {
    return {
        kind: 'string',
        type: 'text/plain',
        getAsFile() {
            return null;
        },
        getAsString(cb: (data: string) => void) {
            return cb(str);
        }
    } as any;
}

function dataTransferItemFromEntry(entry: FileEntry | DirEntry): DataTransferItem {
    return {
        webkitGetAsEntry: () => {
            return entry;
        }
    } as any;
}

function fileSystemFileEntryFromFile(file: File): FileEntry {
    return {
        isDirectory: false,
        isFile: true,
        file(cb: (file: File) => void) {
            cb(file);
        }
    };
}

function fileSystemDirEntryFromFile(files: Array<FileEntry | DirEntry>, batchSize: number = 1): DirEntry {
    const copy = files.slice(0);
    const batches: Array<Array<FileEntry | DirEntry>> = [];

    let current = 0;
    while (copy.length) {
        const length = copy.length;
        current += batchSize;
        const batch = copy.splice(0, current > length ? length : current);
        batches.push(batch);
    }

    return {
        isDirectory: true,
        isFile: false,
        createReader: () => {
            let cbCount = 0;

            return {
                readEntries(cb) {
                    const batch = batches[cbCount];
                    cbCount++;

                    if (batch) {
                        cb(batch);
                    } else {
                        cb([]);
                    }
                }
            };
        }
    };
}

function inputEvtFromFiles(...files: File[]): Event {
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', {
        value: files
    });
    return {
        target: input
    } as any;
}

function createFile<T>(name: string, data: T, options?: FilePropertyBag) {
    const json = JSON.stringify(data);
    const file = new File([json], name, options);
    return file;
}

function sortFiles<T extends File>(files: T[]) {
    return files.slice(0)
        .sort((a, b) => a.name.localeCompare(b.name));
}


interface FileEntry extends Entry {
    file(cb: (file: File) => void): void;
}

interface DirEntry extends Entry {
    createReader(): DirReader;
}

interface Entry {
    isDirectory: boolean;
    isFile: boolean;
}

interface DirReader {
    readEntries(cb: (entries: Array<FileEntry | DirEntry>) => void): void;
}
