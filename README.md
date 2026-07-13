<p align="center">
  <img src="https://raw.githubusercontent.com/react-dropzone/.github/main/brand/assets/logo.png" alt="file-selector logo" width="120" />
</p>

# file-selector

> A small package for converting a [DragEvent](https://developer.mozilla.org/en-US/docs/Web/API/DragEvent) or [file input](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file) to a list of File objects.

📖 **[Documentation & live playground →](https://react-dropzone.github.io/file-selector/)**

[![npm](https://img.shields.io/npm/v/file-selector.svg?style=flat-square)](https://www.npmjs.com/package/file-selector)
![Tests](https://img.shields.io/github/actions/workflow/status/react-dropzone/file-selector/test.yml?branch=main&style=flat-square&label=tests)
[![coverage](https://img.shields.io/coveralls/github/react-dropzone/file-selector/main?style=flat-square)](https://coveralls.io/github/react-dropzone/file-selector?branch=main)
[![Open Collective Backers](https://img.shields.io/opencollective/backers/react-dropzone.svg?style=flat-square)](#backers)
[![Open Collective Sponsors](https://img.shields.io/opencollective/sponsors/react-dropzone.svg?style=flat-square)](#sponsors)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg?style=flat-square)](https://github.com/react-dropzone/.github/blob/main/CODE_OF_CONDUCT.md)

# Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Browser Support](#browser-support)
- [Contribute](#contribute)
- [Credits](#credits)
- [Support](#support)
- [License](#license)

## Installation

You can install this package from [NPM](https://www.npmjs.com):

```bash
npm add file-selector
```

### CDN

For CDN usage, load the ESM build directly from a CDN such as [esm.sh](https://esm.sh) or [jsDelivr](https://www.jsdelivr.com/package/npm/file-selector):

```html
<script type="module">
  import {fromEvent} from "https://esm.sh/file-selector";

  document.addEventListener("drop", async evt => {
    const files = await fromEvent(evt);
    console.log(files);
  });
</script>
```

## Usage

### ES6

Convert a [DragEvent](https://developer.mozilla.org/en-US/docs/Web/API/DragEvent) to File objects:

```ts
import {fromEvent} from "file-selector";
document.addEventListener("drop", async evt => {
  const files = await fromEvent(evt);
  console.log(files);
});
```

Convert a [change event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event) for an input type file to File objects:

```ts
import {fromEvent} from "file-selector";
const input = document.getElementById("myInput");
input.addEventListener("change", async evt => {
  const files = await fromEvent(evt);
  console.log(files);
});
```

Convert [FileSystemFileHandle](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle) items to File objects:

```ts
import {fromEvent} from "file-selector";

// Open file picker
const handles = await window.showOpenFilePicker({multiple: true});
// Get the files
const files = await fromEvent(handles);
console.log(files);
```

**NOTE** The above is experimental and subject to change.

### CommonJS

Convert a `DragEvent` to File objects:

```ts
const {fromEvent} = require("file-selector");
document.addEventListener("drop", async evt => {
  const files = await fromEvent(evt);
  console.log(files);
});
```

### MIME types

When the browser doesn't set a File's `type`, `fromEvent` infers one from the file extension. By default it uses a small built-in table of the most common types, keeping the bundle lean.

If you need broader coverage, import the full extension-to-MIME table from the `file-selector/mime` subpath and pass it via the `mimeTypes` option. Because it's a separate entry point, the full table (~1,200 entries) is only included in your bundle when you import it:

```ts
import {fromEvent} from "file-selector";
import {COMMON_MIME_TYPES} from "file-selector/mime";

const files = await fromEvent(evt, {mimeTypes: COMMON_MIME_TYPES});
```

You can also pass your own `Map<extension, mimeType>` to restrict or extend the lookup:

```ts
const files = await fromEvent(evt, {mimeTypes: new Map([["dwg", "image/vnd.dwg"]])});
```

## Browser Support

Most browser support basic File selection with drag 'n' drop or file input:

- [File API](https://developer.mozilla.org/en-US/docs/Web/API/File#Browser_compatibility)
- [Drag Event](https://developer.mozilla.org/en-US/docs/Web/API/DragEvent#Browser_compatibility)
- [DataTransfer](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer#Browser_compatibility)
- [`<input type="file">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#Browser_compatibility)

For folder drop we use the [FileSystem API](https://developer.mozilla.org/en-US/docs/Web/API/FileSystem) which has very limited support:

- [DataTransferItem.getAsFile()](https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem/getAsFile#Browser_compatibility)
- [DataTransferItem.webkitGetAsEntry()](https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem/webkitGetAsEntry#Browser_compatibility)
- [FileSystemEntry](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemEntry#Browser_compatibility)
- [FileSystemFileEntry.file()](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileEntry/file#Browser_compatibility)
- [FileSystemDirectoryEntry.createReader()](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryEntry/createReader#Browser_compatibility)
- [FileSystemDirectoryReader.readEntries()](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryReader/readEntries#Browser_compatibility)

## Contribute

Checkout the organization [CONTRIBUTING.md](https://github.com/react-dropzone/.github/blob/main/CONTRIBUTING.md).

### Development

Development requires [Node.js](https://nodejs.org) >= 20. Install the dependencies with:

```bash
npm install
```

The project is built with [tsdown](https://tsdown.dev) (Rolldown), type-checked with [TypeScript](https://www.typescriptlang.org), tested with [Vitest](https://vitest.dev) and linted/formatted with [oxlint](https://oxc.rs) and [oxfmt](https://oxc.rs).

| Command                   | Description                                                                      |
| ------------------------- | -------------------------------------------------------------------------------- |
| `npm test`                | Run the test suite in watch mode.                                                |
| `npm run test:cov`        | Run the tests once with coverage (runs type-check, lint and format check first). |
| `npm run type-check`      | Type-check the sources without emitting.                                         |
| `npm run lint`            | Lint the sources (oxlint).                                                       |
| `npm run lint:fix`        | Apply safe lint fixes.                                                           |
| `npm run lint:type-aware` | Type-aware lint via tsgolint (alpha).                                            |
| `npm run format`          | Format the sources (oxfmt).                                                      |
| `npm run format:check`    | Check formatting without writing.                                                |
| `npm run build`           | Build the outputs into `dist/`.                                                  |
| `npm run dev`             | Build in watch mode.                                                             |
| `npm run docs:dev`        | Run the [Vocs](https://vocs.dev) docs site locally.                              |
| `npm run docs:build`      | Build the docs site into `site/`.                                                |
| `npm run docs:preview`    | Preview the built docs site.                                                     |
| `npm run hooks:install`   | Install the git hooks (`prek install`).                                          |
| `npm run hooks:run`       | Run every git hook over the whole repo.                                          |

The build emits into `dist/`:

- `dist/index.js` — ES module
- `dist/index.cjs` — CommonJS module
- `dist/index.d.ts` — TypeScript declarations

### Git hooks

Git hooks are managed with [prek](https://github.com/j178/prek), a fast Rust drop-in for the [pre-commit](https://pre-commit.com) framework (configured in [`.pre-commit-config.yaml`](.pre-commit-config.yaml)). On commit they format and lint the staged files with oxfmt/oxlint, and check the message against [Conventional Commits](https://www.conventionalcommits.org) — the same convention [semantic-release](https://semantic-release.gitbook.io) uses to cut releases.

prek is a standalone binary, so install it once (e.g. `uv tool install prek`, `brew install prek`, or see the [install docs](https://github.com/j178/prek#installation)). `npm install` then wires up the hooks automatically; run `npm run hooks:install` to (re)install them by hand. The hooks are optional — CI enforces the same lint, format and commit checks — but they catch issues before you push.

## Credits

- [html5-file-selector](https://github.com/quarklemotion/html5-file-selector)

## Support

### Backers

Support us with a monthly donation and help us continue our activities. [[Become a backer](https://opencollective.com/react-dropzone#backer)]

<a href="https://opencollective.com/react-dropzone#backers" target="_blank"><img src="https://opencollective.com/react-dropzone/backers.svg?width=890"></a>

### Sponsors

Become a sponsor and get your logo on our README on Github with a link to your site. [[Become a sponsor](https://opencollective.com/react-dropzone#sponsor)]

<a href="https://opencollective.com/react-dropzone#sponsors" target="_blank"><img src="https://opencollective.com/react-dropzone/sponsors.svg?width=890"></a>

## License

MIT
