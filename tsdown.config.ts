import {defineConfig} from 'tsdown';

export default defineConfig({
    entry: {
        index: './src/index.ts'
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
    hash: false
});
