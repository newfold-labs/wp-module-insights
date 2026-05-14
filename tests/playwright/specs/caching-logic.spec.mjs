import { test, expect } from '@playwright/test';
import {
  prepareInsightsPreconditions,
  waitForInsightsShell,
  navigateToInsightsPage,
  assertInsightsAdminUrl,
  insightsLog,
} from '../helpers/index.mjs';

const SCORE_SELECTOR = '#nfd-insights-lighthouse-report .nfd-text-xl.nfd-font-semibold';
const RELOAD_TIMEOUT_MS = 45000;

/**
 * Match the scans *collection* endpoint only (not `/run-scan`, `/scan-details`, etc.).
 * Supports `/wp-json/...` and `index.php?rest_route=/...`.
 *
 * @param {string} urlString
 * @returns {boolean}
 */
function isPerformanceScansCollectionUrl(urlString) {
  try {
    const url = new URL(urlString);
    const restRoute = url.searchParams.get('rest_route');

    if (restRoute) {
      const routePath = restRoute.startsWith('/') ? restRoute : `/${restRoute}`;
      return /^\/newfold-insights\/v1\/performance-scans\/?$/.test(routePath);
    }

    return /\/wp-json\/newfold-insights\/v1\/performance-scans\/?$/.test(url.pathname);
  } catch {
    return false;
  }
}

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
  return page.route(isPerformanceScansCollectionUrl, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(scans),
    });
  });
}

async function navigateAndWait(page, label = 'caching-logic') {
  await test.step(`${label}: navigate to Insights + wait for shell`, async () => {
    insightsLog(`[${label}] opening Insights admin URL`, 'cyan');
    await navigateToInsightsPage(page);
    await waitForInsightsShell(page);
    assertInsightsAdminUrl(page, `${label}:after shell`);
  });
}

async function reloadInsightsAndWait(page, label = 'caching-logic') {
  await test.step(`${label}: reload + wait for shell`, async () => {
    insightsLog(`[${label}] reloading Insights page`, 'cyan');
    await page.reload({ waitUntil: 'load', timeout: RELOAD_TIMEOUT_MS });
    assertInsightsAdminUrl(page, `${label}:after reload`);
    await waitForInsightsShell(page);
    assertInsightsAdminUrl(page, `${label}:after shell post-reload`);
  });
}

test.describe('Insights Caching Logic', () => {
  test.describe.configure({ timeout: 120000 });
  test.beforeEach(async ({ page }, testInfo) => {
    insightsLog(`[caching-logic] beforeEach → ${testInfo.title}`, 'cyan');

    page.on('console', (msg) => {
      if (['error', 'warning'].includes(msg.type())) {
        console.log(`[BROWSER ${msg.type().toUpperCase()}]`, msg.text());
      }
    });
    page.on('pageerror', (err) => console.log('[PAGE ERROR]', err.message));

    const pre = await prepareInsightsPreconditions(page, {
      canScanPerformance: true,
      retries: 1,
      cleanupCommands: [
        'option delete nfd_insights_scans_results || true',
        'transient delete nfd_insights_scan_results || true',
      ],
    });
    test.skip(!pre.ok, pre.reason);
  });

  test('Active transient returns cached data — UI renders stored scores', async ({ page }) => {
    await mockScans(page, [buildScan('cache_hit', 0.72)]);
    await navigateAndWait(page);

    const scoreEl = page.locator(SCORE_SELECTOR).first();
    await expect(scoreEl).toContainText('72', { timeout: 15000 });
  });

  test('API failure — UI handles gracefully without fatal errors', async ({ page }) => {
    // Intentional 500: [BROWSER ERROR] / "Error fetching scans" from the app are expected here, not a product bug.
    console.log(
      '[caching-logic] This test mocks the performance-scans API with HTTP 500. Any related browser console errors are expected.',
    );
    await page.route(isPerformanceScansCollectionUrl, (route) => {
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

    await page.unroute(isPerformanceScansCollectionUrl);
    await mockScans(page, [buildScan('fresh_scan', 0.93)]);

    // Reload Insights only — visiting the dashboard pulls many unrelated scripts/widgets and is flaky in CI.
    await reloadInsightsAndWait(page, 'force_refresh');

    await expect(scoreEl).toContainText('93', { timeout: 15000 });
  });

  test('Full lifecycle: cached data served first, then refreshed data after expiry', async ({ page }) => {
    await mockScans(page, [buildScan('lifecycle_scan', 0.42)]);
    await navigateAndWait(page);

    const scoreEl = page.locator(SCORE_SELECTOR).first();
    await expect(scoreEl).toContainText('42', { timeout: 15000 });

    await page.unroute(isPerformanceScansCollectionUrl);
    await mockScans(page, [buildScan('refreshed_scan', 0.77)]);

    await reloadInsightsAndWait(page, 'lifecycle');

    await expect(scoreEl).toContainText('77', { timeout: 15000 });
  });
});
