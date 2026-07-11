import {defineConfig} from '@playwright/test';

// End-to-end tests in real Chromium: file-input selection and CDP-driven drag-and-drop.
// The fixture page imports the built dist/index.js, so `npm run build` must run first (pretest:e2e).
export default defineConfig({
    testDir: './e2e',
    testMatch: '**/*.e2e.ts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    reporter: 'list',
    use: {
        browserName: 'chromium',
        headless: true
    }
});
