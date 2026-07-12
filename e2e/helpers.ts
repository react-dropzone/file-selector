import {readFile} from "node:fs/promises";
import {extname, join} from "node:path";
import {fileURLToPath} from "node:url";
import type {Page} from "@playwright/test";

declare global {
  interface Window {
    __ready?: boolean;
    __result: SelectedFile[] | null;
    __error: string | null;
  }
}

export const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const fixture = (rel: string): string => join(ROOT, "e2e/fixtures", rel);

export interface SelectedFile {
  name: string;
  type: string;
  size: number;
  path?: string;
  relativePath?: string;
  isFile: boolean;
  hasHandle: boolean;
}

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".map": "application/json"
};

// Serve the repo from disk via request interception, so the page and built bundle load over
// http://localhost (a secure context, required by the File System Access API) with no dev server.
export async function openFixture(page: Page): Promise<void> {
  await page.route("**/*", async route => {
    const {pathname} = new URL(route.request().url());
    const rel = pathname === "/" ? "/e2e/fixture.html" : pathname;
    try {
      const body = await readFile(join(ROOT, rel));
      await route.fulfill({body, contentType: MIME[extname(rel)] ?? "application/octet-stream"});
    } catch {
      await route.fulfill({status: 404});
    }
  });
  await page.goto("http://localhost/");
  await page.waitForFunction(() => window.__ready === true);
}

export async function readResult(page: Page): Promise<SelectedFile[]> {
  await page.waitForFunction(() => window.__result !== null || window.__error !== null, undefined, {timeout: 5000});
  const err = await page.evaluate(() => window.__error);
  if (err) throw new Error(`fromEvent threw: ${err}`);
  return (await page.evaluate(() => window.__result)) ?? [];
}

// Drive a real drag through the CDP. Absolute `paths`; a directory path is what makes Chromium
// build the webkitGetAsEntry / getAsFileSystemHandle objects the recursion relies on.
export async function cdpDrop(page: Page, paths: string[]): Promise<void> {
  const client = await page.context().newCDPSession(page);
  const box = await page.locator("#drop").boundingBox();
  if (!box) throw new Error("drop target not found");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const data = {
    items: paths.map(() => ({mimeType: "application/octet-stream", data: ""})),
    files: paths,
    dragOperationsMask: 1
  };
  await client.send("Input.dispatchDragEvent", {type: "dragEnter", x, y, data});
  await client.send("Input.dispatchDragEvent", {type: "dragOver", x, y, data});
  await client.send("Input.dispatchDragEvent", {type: "drop", x, y, data});
}
