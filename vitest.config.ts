import {playwright} from '@vitest/browser-playwright';
import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.spec.ts']
        },
        projects: [
            {
                test: {
                    // Fast, mocked unit tests (jsdom). See src/*.spec.ts.
                    name: 'unit',
                    globals: true,
                    environment: 'jsdom',
                    setupFiles: ['./test-setup.js'],
                    include: ['src/**/*.spec.ts'],
                    exclude: ['src/**/*.browser.spec.ts']
                }
            },
            {
                test: {
                    // Real-browser (Playwright/Chromium) e2e tests. See src/*.browser.spec.ts.
                    // These exercise the actual FileList/webkitRelativePath APIs jsdom cannot.
                    name: 'browser',
                    globals: true,
                    include: ['src/**/*.browser.spec.ts'],
                    browser: {
                        enabled: true,
                        provider: playwright(),
                        headless: true,
                        instances: [{browser: 'chromium'}]
                    }
                }
            }
        ]
    }
});
