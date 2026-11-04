import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

export async function captureBrowserCoverage(browser, page) {
    if (process.env.QA_BROWSER_COVERAGE !== '1') return;
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    const persist = async () => {
            const entries = await page.coverage.stopJSCoverage();
            // Only application source, never third-party bundles or browser state.
            const application = entries.filter(entry => {
                const pathname = new URL(entry.url).pathname;
                return (pathname.startsWith('/src/') || pathname.startsWith('/assets/')) && /\.[cm]?[jt]sx?$/.test(pathname);
            });
            // Chromium may discard script sources after full-page navigation.
            // The production asset URL includes its build hash; retain the exact
            // served source so the report can be converted offline after QA stops.
            for (const entry of application) {
                if (entry.source !== undefined) continue;
                const response = await page.request.get(entry.url);
                if (!response.ok()) throw new Error(`Cannot read covered script: ${new URL(entry.url).pathname}`);
                entry.source = await response.text();
            }
            await mkdir('coverage/browser-v8', { recursive: true });
            await writeFile(`coverage/browser-v8/${randomUUID()}.json`, JSON.stringify(application));
    };
    // A full navigation destroys the old JavaScript context. Flush its counters
    // before navigating so coverage includes every visited page, not just the last.
    for (const method of ['goto', 'reload']) {
        const navigate = page[method].bind(page);
        page[method] = async (...args) => {
            await persist();
            await page.coverage.startJSCoverage({ resetOnNavigation: false });
            return navigate(...args);
        };
    }
    const close = browser.close.bind(browser);
    browser.close = async (...args) => {
        try { await persist(); }
        finally { await close(...args); }
    };
}
