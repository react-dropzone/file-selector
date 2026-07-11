import {defineConfig} from '@rslib/core';

export default defineConfig({
    source: {
        entry: {
            index: './src/index.ts',
            // Full extension-to-MIME table shipped as a separate `file-selector/mime` entry so it
            // stays out of the main bundle. See https://github.com/react-dropzone/file-selector/issues/127
            mime: './src/mime.ts',
            // The small default MIME map, shared by `index` and `mime`. Declared as its own entry so
            // it emits a stable `dist/mime-default.js` (imported by both) instead of a hashed chunk.
            'mime-default': './src/mime-default.ts'
        },
        // Use a build-only tsconfig that excludes *.spec.ts so declaration
        // files are not emitted for the tests.
        tsconfigPath: './tsconfig.build.json'
    },
    lib: [
        {
            // ESM build + type declarations (dist/index.js, dist/index.d.ts)
            format: 'esm',
            syntax: 'es2020',
            dts: true
        },
        {
            // CommonJS build (dist/index.cjs)
            format: 'cjs',
            syntax: 'es2020'
        }
    ],
    output: {
        target: 'web',
        sourceMap: true
    }
});
