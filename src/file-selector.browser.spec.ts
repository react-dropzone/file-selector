import {userEvent} from 'vitest/browser';
import type {FileWithPath} from './file';
import {fromEvent} from './file-selector';

// E2E tests that run in a real browser (Playwright/Chromium) via Vitest browser mode.
// Unlike the jsdom unit suite (file-selector.spec.ts), these drive real <input> elements
// and assert against the browser's genuine FileList / webkitRelativePath, which jsdom cannot produce.
//
// Fixtures live in <root>/fixtures. userEvent.upload resolves string paths relative to the
// project root (and Vite's fs.strict forbids escaping it), so they are referenced as ./fixtures/*.

// Resolves with the real DOM event the browser dispatches once the input's files are set.
function onceEvent(target: EventTarget, type: string): Promise<Event> {
    return new Promise(resolve => target.addEventListener(type, resolve, {once: true}));
}

function fileInput(configure?: (input: HTMLInputElement) => void): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'file';
    // A unique id keeps the generated element locator unambiguous across tests.
    input.id = `file-input-${Math.random().toString(36).slice(2)}`;
    configure?.(input);
    document.body.append(input);
    return input;
}

afterEach(() => {
    document.body.replaceChildren();
});

it('reads a real FileList from an <input type="file"> selection', async () => {
    const input = fileInput(el => {
        el.multiple = true;
    });

    const changed = onceEvent(input, 'change');
    await userEvent.upload(input, ['./fixtures/files/hello.json', './fixtures/files/notes.txt']);
    const evt = await changed;

    const files = (await fromEvent(evt)) as FileWithPath[];
    expect(files).toHaveLength(2);
    expect(files.every(file => file instanceof File)).toBe(true);

    const byName = Object.fromEntries(files.map(file => [file.name, file]));
    expect(byName['hello.json'].type).toBe('application/json');
    expect(byName['hello.json'].path).toBe('./hello.json');
    expect(byName['hello.json'].relativePath).toBe('./hello.json');
    expect(byName['notes.txt'].type).toBe('text/plain');
    expect(byName['notes.txt'].path).toBe('./notes.txt');
});

it('keeps webkitRelativePath when a directory is selected via <input webkitdirectory>', async () => {
    const input = fileInput(el => {
        el.webkitdirectory = true;
    });

    const changed = onceEvent(input, 'change');
    await userEvent.upload(input, ['./fixtures/tree']);
    const evt = await changed;

    const files = (await fromEvent(evt)) as FileWithPath[];

    const names = files.map(file => file.name).sort();
    expect(names).toEqual(['deep.json', 'ping.json', 'pong.json']);
    expect(files.every(file => file instanceof File)).toBe(true);

    const paths = files.map(file => file.path).sort();
    expect(paths).toEqual(['tree/nested/deep.json', 'tree/ping.json', 'tree/pong.json']);
    // The input code path never sets a FileSystemHandle.
    expect(files.every(file => file.handle === undefined)).toBe(true);
});
