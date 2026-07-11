import {defineConfig} from 'tsdown';

export default defineConfig({
    entry: {
        index: './src/index.ts',
        // Full extension-to-MIME table shipped as a separate `file-selector/mime` entry so it
        // stays out of the main bundle. See https://github.com/react-dropzone/file-selector/issues/127
        mime: './src/mime.ts',
        // The small default MIME map, shared by `index` and `mime`. Declared as its own entry so
        // it emits a stable `dist/mime-default.js` (imported by both) instead of a hashed chunk.
        'mime-default': './src/mime-default.ts'
    },
    format: ['esm', 'cjs'],
    // Emit type declarations. Use a build-only tsconfig that excludes *.spec.ts so
    // declaration files are not emitted for the tests.
    dts: {tsconfig: './tsconfig.build.json'},
    target: 'es2020',
    sourcemap: true,
    // With `"type": "module"`, emit ESM as `.js` and CJS as `.cjs` (instead of tsdown's
    // default `.mjs`/`.cjs`), matching the published paths in package.json `exports`.
    fixedExtension: false,
    // Named entries only; do not append content hashes to the shared `mime-default` chunk.
    hash: false,
    unbundle: false
});
