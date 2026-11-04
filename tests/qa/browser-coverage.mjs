import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

export async function captureBrowserCoverage(browser, page) {
    if (process.env.QA_BROWSER_COVERAGE !== '1') return;
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    const close = browser.close.bind(browser);
    browser.close = async (...args) => {
        try {
            const entries = await page.coverage.stopJSCoverage();
            // Only application source, never third-party bundles or browser state.
            const application = entries.filter(entry => {
                const pathname = new URL(entry.url).pathname;
                return pathname.startsWith('/src/') && /\.[cm]?[jt]sx?$/.test(pathname);
            });
            await mkdir('coverage/browser-v8', { recursive: true });
            await writeFile(`coverage/browser-v8/${randomUUID()}.json`, JSON.stringify(application));
        } finally { await close(...args); }
    };
}
