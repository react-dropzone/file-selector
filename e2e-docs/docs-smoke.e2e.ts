import {expect, test} from "@playwright/test";

// Routes (carrying the /file-selector basePath) that must survive client-side hydration, not
// merely return 200 HTML. A dependency bump can white-screen these while the SSR'd markup still
// looks fine to a plain HTTP probe: waku beta.9 dropped the router `unstable_events` API that
// vocs' ScrollRestoration calls `.on()` on, throwing during hydration and blanking the page.
const routes = ["/file-selector/", "/file-selector/getting-started", "/file-selector/api"];

for (const route of routes) {
  test(`docs page hydrates without errors: ${route}`, async ({page}) => {
    const errors: string[] = [];
    // Uncaught exceptions thrown during hydration - the failure mode above.
    page.on("pageerror", err => errors.push(`pageerror: ${err.message}`));

    await page.goto(route, {waitUntil: "networkidle"});

    // Primary, precise signal: no uncaught exception escaped during hydration.
    expect(errors, `unexpected errors on ${route}:\n${errors.join("\n")}`).toEqual([]);

    // Secondary blank-screen guard: the app unmounts to an empty page when hydration throws,
    // so the main content region must exist and be non-empty afterwards.
    const content = page.locator("#vocs-content");
    await expect(content).toBeVisible();
    await expect(content).not.toBeEmpty();
  });
}
