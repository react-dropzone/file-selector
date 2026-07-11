import {defineConfig} from '@rslib/core';

export default defineConfig({
    source: {
        entry: {
            index: './src/index.ts'
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
