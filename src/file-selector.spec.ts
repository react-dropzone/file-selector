import type {FileWithPath} from "./file";
import {fromEvent} from "./file-selector";

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
    {ping: true},
    {
      type: "application/json"
    }
  );
  const evt = inputEvtFromFiles(mockFile);

  const files = await fromEvent(evt);
  expect(files).toHaveLength(1);
  expect(files.every(file => file instanceof File)).toBe(true);

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
    {ping: true},
    {
      type: "application/json"
    }
  );

  const files = await fromEvent([mockHandle]);
  expect(files).toHaveLength(1);
  expect(files.every(file => file instanceof File)).toBe(true);

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

it("should return files from DataTransfer {items} if the passed event is a DragEvent", async () => {
  const name = "test.json";
  const mockFile = createFile(
    name,
    {ping: true},
    {
      type: "application/json"
    }
  );
  const item = dataTransferItemFromFile(mockFile);
  const evt = dragEvtFromFilesAndItems([], [item]);

  const files = await fromEvent(evt);
  expect(files).toHaveLength(1);
  expect(files.every(file => file instanceof File)).toBe(true);

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
    {ping: true},
    {
      type: "application/json"
    }
  );

  const file = fileSystemFileEntryFromFile(mockFile);
  file.fullPath = fullPath;
  const item = dataTransferItemFromEntry(file, mockFile);
  const evt = dragEvtFromFilesAndItems([], [item]);

  const files = await fromEvent(evt);
  expect(files).toHaveLength(1);
  expect(files.every(file => file instanceof File)).toBe(true);

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
    {ping: true},
    {
      type: "application/json"
    }
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
    createFile("ping.json", {ping: true}),
    createFile("pong.json", {pong: true}),
    createFile("foo.json", {foo: true}),
    createFile("bar.json", {bar: true}),
    createFile("john.json", {john: true}),
    createFile("jane.json", {jane: true})
  ]);
  const [f1, f2, f3, f4, f5, f6] = mockFiles;
  const [f7, f8] = [createFile(".DS_Store", {macOs: true}), createFile("Thumbs.db", {windows: true})];
  const evt = dragEvtFromItems([
    dataTransferItemFromEntry(fileSystemFileEntryFromFile(f1), f1),
    dataTransferItemFromEntry(fileSystemFileEntryFromFile(f2), f2),
    dataTransferItemFromEntry(
      fileSystemDirEntryFromFile(
        [
          fileSystemFileEntryFromFile(f3),
          fileSystemDirEntryFromFile([fileSystemFileEntryFromFile(f4)]),
          fileSystemFileEntryFromFile(f5)
        ],
        2
      )
    ),
    dataTransferItemFromEntry(fileSystemFileEntryFromFile(f6), f6),
    dataTransferItemFromEntry(fileSystemFileEntryFromFile(f7), f7),
    dataTransferItemFromEntry(fileSystemFileEntryFromFile(f8), f8)
  ]);

  const items = await fromEvent(evt);
  const files = sortFiles(items as FileWithPath[]);
  expect(files).toHaveLength(6);
  expect(files.every(file => file instanceof File)).toBe(true);
  expect(files.every(file => typeof file.path === "string")).toBe(true);
  expect(files).toEqual(mockFiles);
});

it("reads directories via getAsFileSystemHandle when the legacy readEntries API throws (issue #130)", async () => {
  const mockFiles = sortFiles([createFile("ping.json", {ping: true}), createFile("pong.json", {pong: true})]);
  const [f1, f2] = mockFiles;

  // Simulate Windows/Chromium: the legacy Entry API throws on readEntries()...
  const throwingEntry = fileSystemDirEntryThatThrows();
  // ...but the File System Access API traverses the same directory successfully.
  const handle = fsDirectoryHandle("root", [fsFileHandle(f1), fsFileHandle(f2)]);
  const evt = dragEvtFromItems([dataTransferItemFromDir(throwingEntry, handle)]);

  const items = await fromEvent(evt);
  const files = sortFiles(items as FileWithPath[]);
  expect(files).toHaveLength(2);
  expect(files.every(file => file instanceof File)).toBe(true);
  expect(files.map(file => file.name)).toEqual(["ping.json", "pong.json"]);
  expect(files.map(file => file.path)).toEqual(["/root/ping.json", "/root/pong.json"]);
});

it("reads a tree of directories via getAsFileSystemHandle and keeps nested paths and handles", async () => {
  const f1 = createFile("foo.json", {foo: true});
  const f2 = createFile("bar.json", {bar: true});
  const f3 = createFile("baz.json", {baz: true});
  const ignored = createFile(".DS_Store", {macOs: true});

  const handle = fsDirectoryHandle("root", [
    fsFileHandle(f1),
    fsDirectoryHandle("nested", [fsFileHandle(f2), fsFileHandle(ignored)]),
    fsFileHandle(f3)
  ]);
  const evt = dragEvtFromItems([dataTransferItemFromDir(fileSystemDirEntryThatThrows(), handle)]);

  const items = await fromEvent(evt);
  const files = sortFiles(items as FileWithPath[]);
  // The macOS thumbnail cache file is filtered out.
  expect(files).toHaveLength(3);
  expect(files.map(file => file.path).sort()).toEqual(["/root/baz.json", "/root/foo.json", "/root/nested/bar.json"]);
  expect(files.every(file => typeof (file as any).handle?.getFile === "function")).toBe(true);
});

it("falls back to the legacy readEntries API for directories when not in a secure context", async () => {
  const mockFiles = sortFiles([createFile("ping.json", {ping: true}), createFile("pong.json", {pong: true})]);
  const [f1, f2] = mockFiles;

  const entry = fileSystemDirEntryFromFile([fileSystemFileEntryFromFile(f1), fileSystemFileEntryFromFile(f2)], 2);
  // A directory handle would be preferred, but it must be ignored outside a secure context.
  const handle = fsDirectoryHandle("root", [fsFileHandle(createFile("should-not-appear.json", {}))]);
  const evt = dragEvtFromItems([dataTransferItemFromDir(entry, handle)]);

  window.isSecureContext = false;

  const items = await fromEvent(evt);
  const files = sortFiles(items as FileWithPath[]);
  expect(files).toHaveLength(2);
  expect(files.map(file => file.name)).toEqual(["ping.json", "pong.json"]);

  window.isSecureContext = true;
});

it('returns the DataTransfer {items} if the DragEvent {type} is not "drop"', async () => {
  const name = "test.json";
  const mockFile = createFile(
    name,
    {ping: true},
    {
      type: "application/json"
    }
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
    {ping: true},
    {
      type: "application/json"
    }
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
    {ping: true},
    {
      type: "text/plain"
    }
  );
  const evt = dragEvtFromItems([dataTransferItemFromFile(mockFile)]);
  const items = await fromEvent(evt);
  expect(items).toHaveLength(0);
});

it("should throw if reading dir entries fails", async () => {
  const mockFiles = sortFiles([createFile("ping.json", {ping: true}), createFile("pong.json", {pong: true})]);
  const [f1, f2] = mockFiles;
  const evt = dragEvtFromItems([
    dataTransferItemFromEntry(
      fileSystemDirEntryFromFile([fileSystemFileEntryFromFile(f1), fileSystemFileEntryFromFile(f2)], 1, 1)
    )
  ]);

  await expect(fromEvent(evt)).rejects.toThrow();
});

it("should throw if reading file entry fails", async () => {
  const mockFiles = sortFiles([createFile("ping.json", {ping: true}), createFile("pong.json", {pong: true})]);
  const [f1, f2] = mockFiles;
  const evt = dragEvtFromItems([
    dataTransferItemFromEntry(
      fileSystemDirEntryFromFile([fileSystemFileEntryFromFile(f1), fileSystemFileEntryFromFile(f2, "Oops :(")], 1, 1)
    )
  ]);

  await expect(fromEvent(evt)).rejects.toThrow();
});

it("should throw if DataTransferItem is not a File", async () => {
  const item = dataTransferItem(null, "file");
  const evt = dragEvtFromFilesAndItems([], [item]);

  await expect(fromEvent(evt)).rejects.toThrow();
});

it("should use getAsFileSystemHandle when available", async () => {
  const name = "test.json";
  const [f, h] = createFileSystemFileHandle(
    name,
    {ping: true},
    {
      type: "application/json"
    }
  );
  const evt = dragEvtFromItems([dataTransferItemWithFsHandle(f, h)]);
  const files = await fromEvent(evt);
  expect(files).toHaveLength(1);
  expect(files.every(file => file instanceof File)).toBe(true);

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
    {ping: false},
    {
      type: "application/json"
    }
  );
  const [_, h] = createFileSystemFileHandle(
    "test.sec.json",
    {ping: true},
    {
      type: "application/json"
    }
  );
  const evt = dragEvtFromItems([dataTransferItemWithFsHandle(f1, h)]);

  window.isSecureContext = false;

  const files = await fromEvent(evt);
  expect(files).toHaveLength(1);
  expect(files.every(file => file instanceof File)).toBe(true);

  const [file] = files as FileWithPath[];

  expect(file.name).toBe(f1.name);
  expect(file.type).toBe(f1.type);
  expect(file.size).toBe(f1.size);
  expect(file.lastModified).toBe(f1.lastModified);
  expect(file.path).toBe(`./${f1Name}`);

  window.isSecureContext = true;
});

it("should reject when getAsFileSystemHandle resolves to null", async () => {
  const evt = dragEvtFromItems([dataTransferItemWithFsHandle(null, null)]);
  await expect(fromEvent(evt)).rejects.toThrow("DataTransferItem is not a file");
});

it("should fallback to getAsFile when getAsFileSystemHandle resolves to undefined", async () => {
  const name = "test.nosec.json";
  const mockFile = createFile(
    name,
    {ping: false},
    {
      type: "application/json"
    }
  );
  const evt = dragEvtFromItems([dataTransferItemWithFsHandle(mockFile, undefined)]);

  const files = await fromEvent(evt);
  expect(files).toHaveLength(1);
  expect(files.every(file => file instanceof File)).toBe(true);

  const [file] = files as FileWithPath[];

  expect(file.name).toBe(mockFile.name);
  expect(file.type).toBe(mockFile.type);
  expect(file.size).toBe(mockFile.size);
  expect(file.lastModified).toBe(mockFile.lastModified);
  expect(file.path).toBe(`./${name}`);
});

it("falls back to getAsFile when getAsFileSystemHandle resolves to null (issue #1435)", async () => {
  // Chromium returns a null FileSystemHandle for items with no backing handle, e.g. a file
  // dragged out of a Windows archive. The item still has a File via getAsFile(), so the drop
  // must not be lost. See https://github.com/react-dropzone/react-dropzone/issues/1435
  const name = "from-archive.txt";
  const mockFile = createFile(name, {ping: true}, {type: "text/plain"});
  const evt = dragEvtFromItems([dataTransferItemWithFsHandle(mockFile, null)]);

  const files = await fromEvent(evt);
  expect(files).toHaveLength(1);
  expect(files.every(file => file instanceof File)).toBe(true);

  const [file] = files as FileWithPath[];
  expect(file.name).toBe(name);
  expect(file.path).toBe(`./${name}`);
});

it("reads getAsFile() synchronously so awaiting getAsFileSystemHandle can't neuter it (issue #1435)", async () => {
  // Faithful to real Chromium: getAsFileSystemHandle() resolves on a *later task*, and by the
  // time it resolves the DataTransferItem has been neutered so getAsFile() returns null. The
  // File must be captured synchronously (before the await) or the drop is silently lost.
  const name = "neutered.txt";
  const mockFile = createFile(name, {ping: true}, {type: "text/plain"});
  const evt = dragEvtFromItems([dataTransferItemThatNeutersAfterHandleAwait(mockFile)]);

  const files = await fromEvent(evt);
  expect(files).toHaveLength(1);
  expect((files[0] as FileWithPath).name).toBe(name);
});

it("returns the original getAsFile() File (not handle.getFile()) so Electron's webUtils.getPathForFile keeps resolving a path (issue #1411)", async () => {
  // In Electron, webUtils.getPathForFile() only resolves an on-disk path from the *original* File
  // the drop produced (what DataTransferItem.getAsFile() returns). A File from
  // FileSystemFileHandle.getFile() loses that path (electron/electron#33647), so when a handle is
  // available we must still hand back the original File, with the handle attached.
  // See https://github.com/react-dropzone/react-dropzone/issues/1411
  const name = "dropped.json";
  const originalFile = createFile(name, {ping: true}, {type: "application/json"});
  const handleFile = createFile(name, {ping: true}, {type: "application/json"});
  const h = {
    getFile() {
      return Promise.resolve(handleFile);
    }
  } as any;
  const evt = dragEvtFromItems([dataTransferItemWithFsHandle(originalFile, h)]);

  const files = await fromEvent(evt);
  expect(files).toHaveLength(1);

  const [file] = files as FileWithPath[];
  // Object identity is preserved: the returned File is the one from getAsFile(), not the handle's.
  expect(file).toBe(originalFile);
  expect(file).not.toBe(handleFile);
  // The durable handle is still attached.
  expect((file as any).handle).toBe(h);
});

it("falls back to handle.getFile() when getAsFile() returns null (e.g. a cross-window drop)", async () => {
  // No original File to preserve, so the handle's File is the only source. It still carries the
  // durable handle.
  const name = "cross-window.json";
  const handleFile = createFile(name, {ping: true}, {type: "application/json"});
  const h = {
    getFile() {
      return Promise.resolve(handleFile);
    }
  } as any;
  const evt = dragEvtFromItems([dataTransferItemWithFsHandle(null, h)]);

  const files = await fromEvent(evt);
  expect(files).toHaveLength(1);

  const [file] = files as FileWithPath[];
  expect(file).toBe(handleFile);
  expect((file as any).handle).toBe(h);
});

it("guesses the {type} from the extension using the built-in defaults", async () => {
  const mockFile = createFile("test.png", {ping: true}); // typeless File
  const evt = inputEvtFromFiles(mockFile);

  const [file] = (await fromEvent(evt)) as FileWithPath[];
  expect(file.type).toBe("image/png");
});

it("does not guess the {type} for extensions outside the built-in defaults", async () => {
  const mockFile = createFile("test.3mf", {ping: true}); // uncommon, not in DEFAULT_MIME_TYPES
  const evt = inputEvtFromFiles(mockFile);

  const [file] = (await fromEvent(evt)) as FileWithPath[];
  expect(file.type).toBe("");
});

it("guesses the {type} from a custom {mimeTypes} lookup when provided", async () => {
  const mockFile = createFile("test.3mf", {ping: true}); // typeless File
  const evt = inputEvtFromFiles(mockFile);

  const [file] = (await fromEvent(evt, {mimeTypes: new Map([["3mf", "model/3mf"]])})) as FileWithPath[];
  expect(file.type).toBe("model/3mf");
});

it("does not overwrite a {type} already set by the browser", async () => {
  const mockFile = createFile("test.png", {ping: true}, {type: "application/octet-stream"});
  const evt = inputEvtFromFiles(mockFile);

  const [file] = (await fromEvent(evt)) as FileWithPath[];
  expect(file.type).toBe("application/octet-stream");
});

function dragEvtFromItems(items: DataTransferItem | DataTransferItem[], type: string = "drop"): DragEvent {
  return {
    type,
    dataTransfer: {
      items: Array.isArray(items) ? items : [items]
    }
  } as any;
}

function dragEvtFromFilesAndItems(files: File[], items: DataTransferItem[], type: string = "drop"): DragEvent {
  return {
    type,
    dataTransfer: {files, items}
  } as any;
}

function dataTransferItemFromFile(file: File): DataTransferItem {
  return {
    kind: "file",
    type: file.type,
    getAsFile() {
      return file;
    },
    getAsString() {}
  } as any;
}

function dataTransferItem(file?: any, kind?: string, type: string = ""): DataTransferItem {
  return {
    kind,
    type,
    getAsFile() {
      return file;
    }
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
    }
  } as any;
}

function dataTransferItemFromEntry(entry: FileEntry | DirEntry, file?: File): DataTransferItem {
  return {
    kind: "file",
    getAsFile() {
      return file;
    },
    webkitGetAsEntry: () => {
      return entry;
    }
  } as any;
}

function dataTransferItemWithFsHandle(file?: File | null, h?: FileSystemFileHandle | null): DataTransferItem {
  return {
    kind: "file",
    getAsFile() {
      return file;
    },
    getAsFileSystemHandle() {
      return Promise.resolve(h);
    }
  } as any;
}

// Models a Chromium file item (e.g. dragged out of an archive) that exposes no FileSystemHandle
// and neuters once the getAsFileSystemHandle() promise resolves on a later task, mirroring the
// behaviour measured in a real browser: getAsFile() only works synchronously, and
// getAsFileSystemHandle() resolves to null after a macrotask.
function dataTransferItemThatNeutersAfterHandleAwait(file: File): DataTransferItem {
  let neutered = false;
  return {
    kind: "file",
    getAsFile() {
      return neutered ? null : file;
    },
    getAsFileSystemHandle() {
      return new Promise(resolve =>
        setTimeout(() => {
          neutered = true;
          resolve(null);
        }, 0)
      );
    }
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
    }
  };
}

function fileSystemDirEntryFromFile(files: FileOrDirEntry[], batchSize: number = 1, throwAfter: number = 0): DirEntry {
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
        }
      };
    }
  };
}

function dataTransferItemFromDir(entry: DirEntry, handle: any): DataTransferItem {
  return {
    kind: "file",
    getAsFile() {
      return null;
    },
    webkitGetAsEntry: () => entry,
    getAsFileSystemHandle: () => Promise.resolve(handle)
  } as any;
}

// A directory entry whose legacy readEntries() throws, mimicking Windows/Chromium (see issue #130).
function fileSystemDirEntryThatThrows(): DirEntry {
  return {
    isDirectory: true,
    isFile: false,
    createReader: () => ({
      readEntries() {
        throw new DOMException("A URI supplied to the API was malformed", "EncodingError");
      }
    })
  } as any;
}

// https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryHandle
function fsDirectoryHandle(name: string, children: FsHandle[]): FsHandle {
  return {
    kind: "directory",
    name,
    async *values() {
      for (const child of children) {
        yield child;
      }
    }
  };
}

// https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle
function fsFileHandle(file: File): FsHandle {
  return {
    kind: "file",
    name: file.name,
    getFile() {
      return Promise.resolve(file);
    }
  };
}

function inputEvtFromFiles(...files: File[]): Event {
  const input = document.createElement("input");
  if (files.length) {
    Object.defineProperty(input, "files", {
      value: files
    });
  }
  return new Proxy(new CustomEvent("input"), {
    get(t, p, _rcvr) {
      if (p === "target") {
        return input;
      }
      return (t as any)[p];
    }
  });
}

function createFile<T>(name: string, data: T, options?: FilePropertyBag) {
  const json = JSON.stringify(data);
  const file = new File([json], name, options);
  return file;
}

function createFileSystemFileHandle<T>(name: string, data: T, options?: FilePropertyBag): [File, FileSystemFileHandle] {
  const file = createFile(name, data, options);
  return [
    file,
    {
      getFile() {
        return Promise.resolve(file);
      }
    }
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
  readEntries(cb: (entries: FileOrDirEntry[]) => void, errCb: (err: any) => void): void;
}

// A minimal stand-in for FileSystemFileHandle/FileSystemDirectoryHandle.
interface FsHandle {
  kind: "file" | "directory";
  name: string;
  getFile?(): Promise<File>;
  values?(): AsyncIterableIterator<FsHandle>;
}
