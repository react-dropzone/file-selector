import {expect, test} from "@playwright/test";
import {fixture, openFixture, readResult} from "./helpers";

test.beforeEach(async ({page}) => {
  await openFixture(page);
});

test('reads a flat FileList from <input type="file">', async ({page}) => {
  await page.locator("#input").setInputFiles([fixture("files/hello.json"), fixture("files/notes.txt")]);

  const files = await readResult(page);
  expect(files.every(f => f.isFile)).toBe(true);
  expect(files.map(f => f.name).sort()).toEqual(["hello.json", "notes.txt"]);
  expect(files.map(f => f.path).sort()).toEqual(["./hello.json", "./notes.txt"]);
  // The input path never resolves a FileSystemHandle.
  expect(files.every(f => !f.hasHandle)).toBe(true);
});

test("keeps webkitRelativePath from <input webkitdirectory>", async ({page}) => {
  await page.locator("#input-dir").setInputFiles(fixture("tree"));

  const files = await readResult(page);
  expect(files.map(f => f.name).sort()).toEqual(["ping.json", "pong.json"]);
  expect(files.map(f => f.path).sort()).toEqual(["tree/nested/pong.json", "tree/ping.json"]);
});
