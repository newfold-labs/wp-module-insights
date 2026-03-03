import { test, expect } from '@playwright/test';
import { wordpress, auth } from '../helpers/index.mjs';

const SCANS_ENDPOINT = '**/wp-json/newfold-insights/v1/performance-scans**';
const INSIGHTS_PAGE = '/wp-admin/tools.php?page=nfd-insights';
const SCORE_SELECTOR = '.nfd-text-xl.nfd-font-semibold.nfd-text-gray-900';

function buildScan(id, score) {
    return {
        id,
        performanceScore: score,
        accessibilityScore: score,
        bestPracticesScore: score,
        seoScore: score,
        createdAt: '2026-03-03T10:00:00Z',
        updatedAt: '2026-03-03T10:00:00Z',
        status: 'completed',
    };
}

function mockScans(page, scans) {
    return page.route(SCANS_ENDPOINT, (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(scans),
        });
    });
}

async function navigateAndWait(page) {
    await page.goto(INSIGHTS_PAGE);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#nfd-insights-app');
}

test.describe('Insights Caching Logic', () => {

    test.beforeEach(async ({ page }) => {
        page.on('console', (msg) => {
            if (['error', 'warning'].includes(msg.type())) {
                console.log(`[BROWSER ${msg.type().toUpperCase()}]`, msg.text());
            }
        });
        page.on('pageerror', (err) => console.log('[PAGE ERROR]', err.message));

        await wordpress.wpCli('option delete nfd_insights_scans_results || true');
        await wordpress.wpCli('transient delete nfd_insights_scan_results || true');
        await wordpress.wpCli(
            'eval \'set_transient("nfd_site_capabilities", ["canScanPerformance" => true], 4 * HOUR_IN_SECONDS);\''
        );
        await auth.loginToWordPress(page);
    });

    test('Active transient returns cached data — UI renders stored scores', async ({ page }) => {
        await mockScans(page, [buildScan('cache_hit', 0.72)]);
        await navigateAndWait(page);

        const scoreEl = page.locator(SCORE_SELECTOR).first();
        await expect(scoreEl).toContainText('72', { timeout: 15000 });
    });

    test('API failure — UI handles gracefully without fatal errors', async ({ page }) => {
        await page.route(SCANS_ENDPOINT, (route) => {
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ code: 'server_error', message: 'API failure' }),
            });
        });

        await navigateAndWait(page);
        await expect(page.locator('body')).not.toContainText('Fatal error');
    });

    test('force_refresh bypasses cache — UI shows fresh data after reload', async ({ page }) => {
        await mockScans(page, [buildScan('stale_scan', 0.11)]);
        await navigateAndWait(page);

        const scoreEl = page.locator(SCORE_SELECTOR).first();
        await expect(scoreEl).toContainText('11', { timeout: 15000 });

        await page.unroute(SCANS_ENDPOINT);
        await mockScans(page, [buildScan('fresh_scan', 0.93)]);

        await page.goto('/wp-admin/index.php');
        await Promise.all([
            page.waitForResponse((r) => r.url().includes('performance-scans'), { timeout: 20000 }),
            page.goto(INSIGHTS_PAGE),
        ]);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('#nfd-insights-app');

        await expect(scoreEl).toContainText('93', { timeout: 15000 });
    });

    test('Full lifecycle: cached data served first, then refreshed data after expiry', async ({ page }) => {
        await mockScans(page, [buildScan('lifecycle_scan', 0.42)]);
        await navigateAndWait(page);

        const scoreEl = page.locator(SCORE_SELECTOR).first();
        await expect(scoreEl).toContainText('42', { timeout: 15000 });

        await page.unroute(SCANS_ENDPOINT);
        await mockScans(page, [buildScan('refreshed_scan', 0.77)]);

        await page.goto('/wp-admin/index.php');
        await Promise.all([
            page.waitForResponse((r) => r.url().includes('performance-scans') && r.status() === 200, { timeout: 20000 }),
            page.goto(INSIGHTS_PAGE),
        ]);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('#nfd-insights-app');

        await expect(scoreEl).toContainText('77', { timeout: 15000 });
    });

});
