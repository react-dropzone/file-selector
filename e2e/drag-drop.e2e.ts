import {expect, test} from '@playwright/test';
import {cdpDrop, fixture, openFixture, readResult} from './helpers';

test.beforeEach(async ({page}) => {
    await openFixture(page);
});

test('drops a flat set of files and returns them', async ({page}) => {
    await cdpDrop(page, [fixture('files/hello.json'), fixture('files/notes.txt')]);

    const files = await readResult(page);
    expect(files.every(f => f.isFile)).toBe(true);
    expect(files.map(f => f.name).sort()).toEqual(['hello.json', 'notes.txt']);
    expect(files.map(f => f.path).sort()).toEqual(['./hello.json', './notes.txt']);
    // Secure context + Chromium => the File System Access path attaches a handle to each file.
    expect(files.every(f => f.hasHandle)).toBe(true);
});

test('drops a directory and flattens it recursively', async ({page}) => {
    await cdpDrop(page, [fixture('tree')]);

    const files = await readResult(page);
    // Traversed via getAsFileSystemHandle: paths rooted at the folder name, handles preserved.
    expect(files.map(f => f.name).sort()).toEqual(['ping.json', 'pong.json']);
    expect(files.map(f => f.path).sort()).toEqual(['/tree/nested/pong.json', '/tree/ping.json']);
    expect(files.every(f => f.hasHandle)).toBe(true);
});
