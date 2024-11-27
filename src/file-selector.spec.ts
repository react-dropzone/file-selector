import { FileWithPath } from "./file.js";
import { fromEvent } from "./file-selector.js";

it("returns a Promise", async () => {
  const evt = new Event("test");
  expect(fromEvent(evt)).toBeInstanceOf(Promise);
});

it("should return an empty array if the passed arg is not what we expect", async () => {
  const files = await fromEvent({});
  expect(files).toHaveLength(0);
});

it("should return an empty array if drag event", async () => {
  const files = await fromEvent({});
  expect(files).toHaveLength(0);
});

it("should return the evt {target} {files} if the passed event is an input evt", async () => {
  const name = "test.json";
  const mockFile = createFile(
    name,
    { ping: true },
    {
      type: "application/json",
    },
  );
  const evt = inputEvtFromFiles(mockFile);

  const files = await fromEvent(evt);
  expect(files).toHaveLength(1);
  expect(files.every((file) => file instanceof File)).toBe(true);

  const [file] = files as FileWithPath[];

  expect(file.name).toBe(mockFile.name);
  expect(file.type).toBe(mockFile.type);
  expect(file.size).toBe(mockFile.size);
  expect(file.lastModified).toBe(mockFile.lastModified);
  expect(file.path).toBe(`./${name}`);
});

it("should return an empty array if the evt {target} has no {files} prop", async () => {
  const evt = inputEvtFromFiles();
  const files = await fromEvent(evt);
  expect(files).toHaveLength(0);
});

it("should return files if the arg is a list of FileSystemFileHandle", async () => {
  const name = "test.json";
  const [mockFile, mockHandle] = createFileSystemFileHandle(
    name,
    { ping: true },
    {
      type: "application/json",
    },
  );

  const files = await fromEvent([mockHandle]);
  expect(files).toHaveLength(1);
  expect(files.every((file) => file instanceof File)).toBe(true);

  const [file] = files as FileWithPath[];

  expect(file.name).toBe(mockFile.name);
  expect(file.type).toBe(mockFile.type);
  expect(file.size).toBe(mockFile.size);
  expect(file.lastModified).toBe(mockFile.lastModified);
  expect(file.path).toBe(`./${name}`);
});

it("should return an empty array if the passed event is not a DragEvent", async () => {
  const evt = new Event("test");
  const files = await fromEvent(evt);
  expect(files).toHaveLength(0);
});

it("should return an empty array if the dragged item not a directory or file", async () => {
  const evt = dragEvtFromItems([
    dataTransferItemFromEntry(
      fileSystemDirEntryFromFile([
        {
          isDirectory: false,
          isFile: false,
        } as FileEntry,
      ]),
    ),
  ]);

  const files = await fromEvent(evt);
  expect(files).toHaveLength(0);
});

it("should return files from DataTransfer {items} if the passed event is a DragEvent", async () => {
  const name = "test.json";
  const mockFile = createFile(
    name,
    { ping: true },
    {
      type: "application/json",
    },
  );
  const item = dataTransferItemFromFile(mockFile);
  const evt = dragEvtFromFilesAndItems([], [item]);

  const files = await fromEvent(evt);
  expect(files).toHaveLength(1);
  expect(files.every((file) => file instanceof File)).toBe(true);

  const [file] = files as FileWithPath[];

  expect(file.name).toBe(mockFile.name);
  expect(file.type).toBe(mockFile.type);
  expect(file.size).toBe(mockFile.size);
  expect(file.lastModified).toBe(mockFile.lastModified);
  expect(file.path).toBe(`./${name}`);
});

it("should use the {fullPath} for {path} if {webkitGetAsEntry} is supported and the items are FileSystemFileEntry", async () => {
  const name = "test.json";
  const fullPath = "/testfolder/test.json";
  const mockFile = createFile(
    name,
    { ping: true },
    {
      type: "application/json",
    },
  );

  const file = fileSystemFileEntryFromFile(mockFile);
  file.fullPath = fullPath;
  const item = dataTransferItemFromEntry(file, mockFile);
  const evt = dragEvtFromFilesAndItems([], [item]);

  const files = await fromEvent(evt);
  expect(files).toHaveLength(1);
  expect(files.every((file) => file instanceof File)).toBe(true);

  const [f] = files as FileWithPath[];

  expect(f.name).toBe(mockFile.name);
  expect(f.type).toBe(mockFile.type);
  expect(f.size).toBe(mockFile.size);
  expect(f.lastModified).toBe(mockFile.lastModified);
  expect(f.path).toBe(fullPath);
});

it('skips DataTransfer {items} that are of kind "string"', async () => {
  const name = "test.json";
  const mockFile = createFile(
    name,
    { ping: true },
    {
      type: "application/json",
    },
  );
  const f = dataTransferItemFromFile(mockFile);
  const str = dataTransferItemFromStr("test");
  const evt = dragEvtFromItems([str, f]);

  const files = await fromEvent(evt);
  expect(files).toHaveLength(1);

  const [file] = files as FileWithPath[];

  expect(file.name).toBe(mockFile.name);
  expect(file.type).toBe(mockFile.type);
  expect(file.size).toBe(mockFile.size);
  expect(file.lastModified).toBe(mockFile.lastModified);
  expect(file.path).toBe(`./${name}`);
});

it("can read a tree of directories recursively and return a flat list of FileWithPath objects", async () => {
  const mockFiles = sortFiles([
    createFile("ping.json", { ping: true }),
    createFile("pong.json", { pong: true }),
    createFile("foo.json", { foo: true }),
    createFile("bar.json", { bar: true }),
    createFile("john.json", { john: true }),
    createFile("jane.json", { jane: true }),
  ]);
  const [f1, f2, f3, f4, f5, f6] = mockFiles;
  const [f7, f8] = [
    createFile(".DS_Store", { macOs: true }),
    createFile("Thumbs.db", { windows: true }),
  ];
  const evt = dragEvtFromItems([
    dataTransferItemFromEntry(fileSystemFileEntryFromFile(f1), f1),
    dataTransferItemFromEntry(fileSystemFileEntryFromFile(f2), f2),
    dataTransferItemFromEntry(
      fileSystemDirEntryFromFile(
        [
          fileSystemFileEntryFromFile(f3),
          fileSystemDirEntryFromFile([fileSystemFileEntryFromFile(f4)]),
          fileSystemFileEntryFromFile(f5),
        ],
        2,
      ),
    ),
    dataTransferItemFromEntry(fileSystemFileEntryFromFile(f6), f6),
    dataTransferItemFromEntry(fileSystemFileEntryFromFile(f7), f7),
    dataTransferItemFromEntry(fileSystemFileEntryFromFile(f8), f8),
  ]);

  const items = await fromEvent(evt);
  const files = sortFiles(items as FileWithPath[]);
  expect(files).toHaveLength(6);
  expect(files.every((file) => file instanceof File)).toBe(true);
  expect(files.every((file) => typeof file.path === "string")).toBe(true);
  expect(files).toEqual(mockFiles);
});

it('returns the DataTransfer {items} if the DragEvent {type} is not "drop"', async () => {
  const name = "test.json";
  const mockFile = createFile(
    name,
    { ping: true },
    {
      type: "application/json",
    },
  );
  const item = dataTransferItemFromFile(mockFile);
  const evt = dragEvtFromItems(item, "dragenter");

  const items = await fromEvent(evt);
  expect(items).toHaveLength(1);

  const [itm] = items as DataTransferItem[];

  expect(itm.kind).toBe(item.kind);
  expect(itm.kind).toBe("file");
});

it('filters DataTransfer {items} if the DragEvent {type} is not "drop" and DataTransferItem {kind} is "string"', async () => {
  const name = "test.json";
  const mockFile = createFile(
    name,
    { ping: true },
    {
      type: "application/json",
    },
  );
  const file = dataTransferItemFromFile(mockFile);
  const str = dataTransferItemFromStr("test");
  const evt = dragEvtFromItems([file, str], "dragenter");

  const items = await fromEvent(evt);
  expect(items).toHaveLength(1);

  const [item] = items as DataTransferItem[];

  expect(item.kind).toBe(file.kind);
  expect(item.kind).toBe("file");
});

it("filters thumbnail cache files", async () => {
  const mockFile = createFile(
    "Thumbs.db",
    { ping: true },
    {
      type: "text/plain",
    },
  );
  const item = dataTransferItemFromFile(mockFile);
  const evt = dragEvtFromFilesAndItems([], [item]);
  const items = await fromEvent(evt);
  expect(items).toHaveLength(0);
});

it("should throw if reading dir entries fails", (done) => {
  const mockFiles = sortFiles([
    createFile("ping.json", { ping: true }),
    createFile("pong.json", { pong: true }),
  ]);
  const [f1, f2] = mockFiles;
  const evt = dragEvtFromItems([
    dataTransferItemFromEntry(
      fileSystemDirEntryFromFile(
        [fileSystemFileEntryFromFile(f1), fileSystemFileEntryFromFile(f2)],
        1,
        1,
      ),
    ),
  ]);

  fromEvent(evt)
    .then(() => done.fail("Getting the files should have failed"))
    .catch(() => done());
});

it("should throw if reading file entry fails", (done) => {
  const mockFiles = sortFiles([
    createFile("ping.json", { ping: true }),
    createFile("pong.json", { pong: true }),
  ]);
  const [f1, f2] = mockFiles;
  const evt = dragEvtFromItems([
    dataTransferItemFromEntry(
      fileSystemDirEntryFromFile(
        [
          fileSystemFileEntryFromFile(f1),
          fileSystemFileEntryFromFile(f2, "Oops :("),
        ],
        1,
        1,
      ),
    ),
  ]);

  fromEvent(evt)
    .then(() => done.fail("Getting the files should have failed"))
    .catch(() => done());
});

it("should throw if DataTransferItem is not a File", (done) => {
  const item = dataTransferItem(null, "file");
  const evt = dragEvtFromFilesAndItems([], [item]);

  fromEvent(evt)
    .then(() => done.fail("Getting the files should have failed"))
    .catch(() => done());
});

it("should use getAsFileSystemHandle when available", async () => {
  const name = "test.json";
  const [f, h] = createFileSystemFileHandle(
    name,
    { ping: true },
    {
      type: "application/json",
    },
  );
  const evt = dragEvtFromItems([dataTransferItemWithFsHandle(f, h)]);
  const files = await fromEvent(evt);
  expect(files).toHaveLength(1);
  expect(files.every((file) => file instanceof File)).toBe(true);

  const [file] = files as FileWithPath[];

  expect(file.name).toBe(f.name);
  expect(file.type).toBe(f.type);
  expect(file.size).toBe(f.size);
  expect(file.lastModified).toBe(f.lastModified);
  expect(file.path).toBe(`./${name}`);
});

it("should not use getAsFileSystemHandle when not in a secure context", async () => {
  const f1Name = "test.nosec.json";
  const f1 = createFile(
    f1Name,
    { ping: false },
    {
      type: "application/json",
    },
  );
  const [, h] = createFileSystemFileHandle(
    "test.sec.json",
    { ping: true },
    {
      type: "application/json",
    },
  );
  const evt = dragEvtFromItems([dataTransferItemWithFsHandle(f1, h)]);

  globalThis.isSecureContext = false;

  const files = await fromEvent(evt);
  expect(files).toHaveLength(1);
  expect(files.every((file) => file instanceof File)).toBe(true);

  const [file] = files as FileWithPath[];

  expect(file.name).toBe(f1.name);
  expect(file.type).toBe(f1.type);
  expect(file.size).toBe(f1.size);
  expect(file.lastModified).toBe(f1.lastModified);
  expect(file.path).toBe(`./${f1Name}`);

  globalThis.isSecureContext = true;
});

it("should reject when getAsFileSystemHandle resolves to null", async () => {
  const evt = dragEvtFromItems([dataTransferItemWithFsHandle(null, null)]);
  expect(fromEvent(evt)).rejects.toThrow("[object Object] is not a File");
});

it("should fallback to getAsFile when getAsFileSystemHandle resolves to undefined", async () => {
  const name = "test.nosec.json";
  const mockFile = createFile(
    name,
    { ping: false },
    {
      type: "application/json",
    },
  );
  const evt = dragEvtFromItems([
    dataTransferItemWithFsHandle(mockFile, undefined),
  ]);

  const files = await fromEvent(evt);
  expect(files).toHaveLength(1);
  expect(files.every((file) => file instanceof File)).toBe(true);

  const [file] = files as FileWithPath[];

  expect(file.name).toBe(mockFile.name);
  expect(file.type).toBe(mockFile.type);
  expect(file.size).toBe(mockFile.size);
  expect(file.lastModified).toBe(mockFile.lastModified);
  expect(file.path).toBe(`./${name}`);
});

function dragEvtFromItems(
  items: DataTransferItem | DataTransferItem[],
  type: string = "drop",
): DragEvent {
  return {
    type,
    dataTransfer: {
      items: Array.isArray(items) ? items : [items],
    },
  } as any;
}

function dragEvtFromFilesAndItems(
  files: File[],
  items: DataTransferItem[],
  type: string = "drop",
): DragEvent {
  return {
    type,
    dataTransfer: { files, items },
  } as any;
}

function dataTransferItemFromFile(file: File): DataTransferItem {
  return {
    kind: "file",
    type: file.type,
    getAsFile() {
      return file;
    },
    getAsString() {},
  } as any;
}

function dataTransferItem(
  file?: any,
  kind?: string,
  type: string = "",
): DataTransferItem {
  return {
    kind,
    type,
    getAsFile() {
      return file;
    },
  } as any;
}

function dataTransferItemFromStr(str: string): DataTransferItem {
  return {
    kind: "string",
    type: "text/plain",
    getAsFile() {
      return null;
    },
    getAsString(cb: (data: string) => void) {
      return cb(str);
    },
  } as any;
}

function dataTransferItemFromEntry(
  entry: FileEntry | DirEntry,
  file?: File,
): DataTransferItem {
  return {
    kind: "file",
    getAsFile() {
      return file;
    },
    webkitGetAsEntry: () => {
      return entry;
    },
  } as any;
}

function dataTransferItemWithFsHandle(
  file?: File | null,
  h?: FileSystemFileHandle | null,
): DataTransferItem {
  return {
    kind: "file",
    getAsFile() {
      return file;
    },
    getAsFileSystemHandle() {
      return Promise.resolve(h);
    },
  } as any;
}

function fileSystemFileEntryFromFile(file: File, err?: any): FileEntry {
  return {
    isDirectory: false,
    isFile: true,
    file(cb, errCb) {
      if (err) {
        errCb(err);
      } else {
        cb(file);
      }
    },
  };
}

function fileSystemDirEntryFromFile(
  files: FileOrDirEntry[],
  batchSize: number = 1,
  throwAfter: number = 0,
): DirEntry {
  const copy = files.slice(0);
  const batches: FileOrDirEntry[][] = [];

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
        readEntries(cb, errCb) {
          const batch = batches[cbCount];
          cbCount++;

          if (throwAfter !== 0 && cbCount === throwAfter) {
            errCb("Failed to read files");
          }

          if (batch) {
            cb(batch);
          } else {
            cb([]);
          }
        },
      };
    },
  };
}

function inputEvtFromFiles(...files: File[]): Event {
  const input = document.createElement("input");
  if (files.length) {
    Object.defineProperty(input, "files", {
      value: files,
    });
  }
  return new Proxy(new CustomEvent("input"), {
    get(t, p) {
      if (p === "target") {
        return input;
      }
      return (t as any)[p];
    },
  });
}

function createFile<T>(name: string, data: T, options?: FilePropertyBag) {
  const json = JSON.stringify(data);
  const file = new File([json], name, options);
  return file;
}

function createFileSystemFileHandle<T>(
  name: string,
  data: T,
  options?: FilePropertyBag,
): [File, FileSystemFileHandle] {
  const file = createFile(name, data, options);
  return [
    file,
    {
      getFile() {
        return Promise.resolve(file);
      },
    },
  ];
}

function sortFiles<T extends File>(files: T[]) {
  return files.slice(0).sort((a, b) => a.name.localeCompare(b.name));
}

interface FileSystemFileHandle {
  getFile(): Promise<File | null>;
}

type FileOrDirEntry = FileEntry | DirEntry;

interface FileEntry extends Entry {
  file(cb: (file: File) => void, errCb: (err: any) => void): void;
}

interface DirEntry extends Entry {
  createReader(): DirReader;
}

interface Entry {
  isDirectory: boolean;
  isFile: boolean;
  fullPath?: string;
}

interface DirReader {
  readEntries(
    cb: (entries: FileOrDirEntry[]) => void,
    errCb: (err: any) => void,
  ): void;
}
