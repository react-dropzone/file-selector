import {expect, test} from "@playwright/test";
import {cdpDrop, fixture, openFixture, readResult} from "./helpers";

test.beforeEach(async ({page}) => {
  await openFixture(page);
});

test("drops a flat set of files and returns them", async ({page}) => {
  await cdpDrop(page, [fixture("files/hello.json"), fixture("files/notes.txt")]);

  const files = await readResult(page);
  expect(files.every(f => f.isFile)).toBe(true);
  expect(files.map(f => f.name).sort()).toEqual(["hello.json", "notes.txt"]);
  expect(files.map(f => f.path).sort()).toEqual(["./hello.json", "./notes.txt"]);
  // Secure context + Chromium => the File System Access path attaches a handle to each file.
  expect(files.every(f => f.hasHandle)).toBe(true);
});

test("drops a single file and returns it", async ({page}) => {
  await cdpDrop(page, [fixture("files/hello.json")]);

  const files = await readResult(page);
  expect(files.map(f => f.name)).toEqual(["hello.json"]);
  expect(files.map(f => f.path)).toEqual(["./hello.json"]);
  expect(files[0].isFile).toBe(true);
  expect(files[0].hasHandle).toBe(true);
});

test("the returned File stays readable after the drop (issue #1411)", async ({page}) => {
  // The handle branch now hands back the File captured from getAsFile() rather than
  // handle.getFile(). Reading its contents *after* the drop event resolved proves that File is a
  // durable, readable snapshot — the property Electron's webUtils.getPathForFile() relies on, and
  // what regressed when v1.x started returning the handle's File instead.
  // https://github.com/react-dropzone/react-dropzone/issues/1411
  await cdpDrop(page, [fixture("files/hello.json")]);

  const files = await readResult(page);
  expect(files[0].hasHandle).toBe(true);
  expect(files[0].content).toBe('{"hello": true}\n');
});

test("drops a directory and flattens it recursively", async ({page}) => {
  await cdpDrop(page, [fixture("tree")]);

  const files = await readResult(page);
  // Traversed via getAsFileSystemHandle: paths rooted at the folder name, handles preserved.
  expect(files.map(f => f.name).sort()).toEqual(["ping.json", "pong.json"]);
  expect(files.map(f => f.path).sort()).toEqual(["/tree/nested/pong.json", "/tree/ping.json"]);
  expect(files.every(f => f.hasHandle)).toBe(true);
});

test("drops files alongside a directory and flattens everything", async ({page}) => {
  // Exercises the plain-file path and directory traversal in a single drop.
  await cdpDrop(page, [fixture("files/hello.json"), fixture("tree")]);

  const files = await readResult(page);
  expect(files.map(f => f.name).sort()).toEqual(["hello.json", "ping.json", "pong.json"]);
  expect(files.map(f => f.path).sort()).toEqual(["./hello.json", "/tree/nested/pong.json", "/tree/ping.json"]);
});

test("recovers the dropped file when getAsFileSystemHandle resolves to null (issue #1435)", async ({page}) => {
  // Chromium hands back a null FileSystemHandle for items with no backing handle, e.g. a file
  // dragged out of a Windows archive. Reproduce that on a *real* drag by stubbing only the handle
  // API to resolve null on a later task. This keeps the genuine neuter timing: getAsFile() only
  // still works if file-selector captured it synchronously, before awaiting the handle.
  // https://github.com/react-dropzone/react-dropzone/issues/1435
  await page.evaluate(() => {
    const proto = (globalThis as unknown as {DataTransferItem: {prototype: any}}).DataTransferItem.prototype;
    proto.getAsFileSystemHandle = () => new Promise(resolve => setTimeout(() => resolve(null), 0));
  });

  await cdpDrop(page, [fixture("files/hello.json")]);

  const files = await readResult(page);
  expect(files.map(f => f.name)).toEqual(["hello.json"]);
  // No handle available => the file came from the synchronously-captured getAsFile() fallback.
  expect(files[0].hasHandle).toBe(false);
});
