import { test, expect } from '@playwright/test';
import {
  installInsightsRestMocks,
  prepareInsightsPreconditions,
  waitForInsightsShell,
  navigateToInsightsPage,
  assertInsightsAdminUrl,
  insightsLog,
} from '../helpers/index.js';

const SCORE_SELECTOR = '#nfd-insights-lighthouse-report .nfd-text-xl.nfd-font-semibold';
const RELOAD_TIMEOUT_MS = 45000;

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

async function prepareLocalInsights(page) {
  const precondition = await prepareInsightsPreconditions(page, {
    canScanPerformance: true,
    retries: 1,
    cleanupCommands: [
      'option delete nfd_insights_scans_results || true',
      'transient delete nfd_insights_scan_results || true',
    ],
  });
  if (!precondition.ok) {
    throw new Error(precondition.reason);
  }
}

test.describe('Insights Caching Logic', { tag: '@env-local' }, () => {
  test.describe.configure({ timeout: 120000 });
  test.beforeEach(async ({ page }, testInfo) => {
    insightsLog(`[caching-logic] beforeEach → ${testInfo.title}`, 'cyan');

    page.on('console', (msg) => {
      if (['error', 'warning'].includes(msg.type())) {
        console.log(`[BROWSER ${msg.type().toUpperCase()}]`, msg.text());
      }
    });
    page.on('pageerror', (err) => console.log('[PAGE ERROR]', err.message));
  });

  test('Active transient returns cached data — UI renders stored scores', async ({ page }) => {
    const rest = await installInsightsRestMocks(page, {
      collection: [buildScan('cache_hit', 0.72)],
    });
    await prepareLocalInsights(page);
    const beforeNavigation = rest.snapshot();
    await navigateAndWait(page);

    await expect.poll(() => rest.counts.collection).toBeGreaterThan(beforeNavigation.collection);
    expect(rest.unexpected).toEqual([]);
    const scoreEl = page.locator(SCORE_SELECTOR).first();
    await expect(scoreEl).toContainText('72', { timeout: 15000 });
  });

  test('API failure — UI handles gracefully without fatal errors', async ({ page }) => {
    // Intentional 500: [BROWSER ERROR] / "Error fetching scans" from the app are expected here, not a product bug.
    console.log(
      '[caching-logic] This test mocks the performance-scans API with HTTP 500. Any related browser console errors are expected.',
    );
    const rest = await installInsightsRestMocks(page, {
      collection: { code: 'server_error', message: 'API failure' },
      collectionStatus: 500,
    });
    await prepareLocalInsights(page);
    const beforeNavigation = rest.snapshot();
    await navigateAndWait(page);

    await expect.poll(() => rest.counts.collection).toBeGreaterThan(beforeNavigation.collection);
    expect(rest.unexpected).toEqual([]);
    await expect(page.locator('body')).not.toContainText('Fatal error');
  });

  test('force_refresh bypasses cache — UI shows fresh data after reload', async ({ page }) => {
    const rest = await installInsightsRestMocks(page, {
      collection: [buildScan('stale_scan', 0.11)],
    });
    await prepareLocalInsights(page);
    const beforeNavigation = rest.snapshot();
    await navigateAndWait(page);

    await expect.poll(() => rest.counts.collection).toBeGreaterThan(beforeNavigation.collection);
    const scoreEl = page.locator(SCORE_SELECTOR).first();
    await expect(scoreEl).toContainText('11', { timeout: 15000 });

    rest.setCollection([buildScan('fresh_scan', 0.93)]);
    const beforeReload = rest.snapshot();

    // Reload Insights only — visiting the dashboard pulls many unrelated scripts/widgets and is flaky in CI.
    await reloadInsightsAndWait(page, 'force_refresh');

    await expect.poll(() => rest.counts.collection).toBeGreaterThan(beforeReload.collection);
    expect(rest.unexpected).toEqual([]);
    await expect(scoreEl).toContainText('93', { timeout: 15000 });
  });

  test('Full lifecycle: cached data served first, then refreshed data after expiry', async ({ page }) => {
    const rest = await installInsightsRestMocks(page, {
      collection: [buildScan('lifecycle_scan', 0.42)],
    });
    await prepareLocalInsights(page);
    const beforeNavigation = rest.snapshot();
    await navigateAndWait(page);

    await expect.poll(() => rest.counts.collection).toBeGreaterThan(beforeNavigation.collection);
    const scoreEl = page.locator(SCORE_SELECTOR).first();
    await expect(scoreEl).toContainText('42', { timeout: 15000 });

    rest.setCollection([buildScan('refreshed_scan', 0.77)]);
    const beforeReload = rest.snapshot();

    await reloadInsightsAndWait(page, 'lifecycle');

    await expect.poll(() => rest.counts.collection).toBeGreaterThan(beforeReload.collection);
    expect(rest.unexpected).toEqual([]);
    await expect(scoreEl).toContainText('77', { timeout: 15000 });
  });
});
