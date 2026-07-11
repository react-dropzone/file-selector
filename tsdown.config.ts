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
    dts: {tsconfig: './tsconfig.build.json'},
    target: 'es2020',
    sourcemap: true,
    fixedExtension: false,
    hash: false
});
