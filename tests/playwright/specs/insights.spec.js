import { test, expect } from '@playwright/test';
import {
  captureInsightsCapabilityState,
  installInsightsRestMocks,
  loginToWordPressWithGuard,
  navigateToInsightsPage,
  prepareInsightsPreconditions,
  restoreInsightsCapabilityState,
  waitForInsightsPage,
  setInsightsCapability,
  assertInsightsAdminUrl,
  insightsLog,
} from '../helpers/index.js';

async function prepareLocalInsights(page) {
  const precondition = await prepareInsightsPreconditions(page, {
    canScanPerformance: true,
    retries: 1,
  });
  if (!precondition.ok) {
    throw new Error(precondition.reason);
  }
}

async function openToolsAdmin(page, label) {
  const response = await page.goto('wp-admin/tools.php', {
    waitUntil: 'load',
    timeout: 10000,
  });
  if (!response) {
    throw new Error(`${label}: wp-admin/tools.php returned no HTTP response`);
  }

  expect(response.ok(), `${label}: wp-admin/tools.php returned HTTP ${response.status()}`).toBe(true);

  const url = new URL(page.url());
  expect(url.pathname.endsWith('/wp-admin/tools.php'), `${label}: unexpected URL ${page.url()}`).toBe(true);
  expect(url.searchParams.get('page'), `${label}: unexpected page query in ${page.url()}`).toBeNull();
  await expect(page.locator('#adminmenu'), `${label}: WordPress admin menu is missing`).toBeVisible();
}

test.describe('Insights module smoke', { tag: '@env-local' }, () => {
  test('App loads without errors', async ({ page }) => {
    const rest = await installInsightsRestMocks(page, { collection: [] });
    await prepareLocalInsights(page);
    const beforeNavigation = rest.snapshot();

    await test.step('Navigate to Insights + wait for shell', async () => {
      await navigateToInsightsPage(page);
      await waitForInsightsPage(page);
      assertInsightsAdminUrl(page, 'insights.spec:App loads');
    });

    await expect.poll(() => rest.counts.collection).toBeGreaterThan(beforeNavigation.collection);
    expect(rest.unexpected).toEqual([]);
    await expect(page.locator('body')).not.toContainText('Fatal error');
    await expect(page.locator('body')).not.toContainText('Error:');
    await expect(page.locator('#nfd-insights-app')).toBeVisible();
  });

  test('Insights page title is visible', async ({ page }) => {
    const rest = await installInsightsRestMocks(page, { collection: [] });
    await prepareLocalInsights(page);
    const beforeNavigation = rest.snapshot();

    await test.step('Navigate to Insights + wait for shell', async () => {
      await navigateToInsightsPage(page);
      await waitForInsightsPage(page);
      assertInsightsAdminUrl(page, 'insights.spec:Insights title');
    });

    await expect.poll(() => rest.counts.collection).toBeGreaterThan(beforeNavigation.collection);
    expect(rest.unexpected).toEqual([]);
    await expect(page.locator('#nfd-insights-app')).toContainText('Insights');
  });
});

test.describe('Insights capability gating', { tag: '@env-local' }, () => {
  test.describe.configure({ mode: 'serial' });

  test('Insights page is not visible in Tools submenu when capability is disabled', async ({ page }) => {
    const rest = await installInsightsRestMocks(page, { collection: [] });
    const originalState = await captureInsightsCapabilityState();

    try {
      const loggedIn = await loginToWordPressWithGuard(page);
      expect(loggedIn).toBe(true);

      const enabled = await setInsightsCapability(true, 2);
      expect(enabled).toBe(true);

      await openToolsAdmin(page, 'capability enabled');
      const insightsLink = page.locator('#adminmenu a[href*="page=nfd-insights"]');
      await expect(insightsLink).toBeVisible();

      const disabled = await setInsightsCapability(false, 1);
      expect(disabled).toBe(true);

      await test.step('Open Tools index (expect Insights menu hidden)', async () => {
        insightsLog('Opening wp-admin/tools.php without page=nfd-insights', 'cyan');
        await openToolsAdmin(page, 'capability disabled');
        insightsLog(`Tools screen URL=${page.url()}`, 'cyan');
      });

      await expect(insightsLink).toBeHidden();
      expect(rest.unexpected).toEqual([]);
    } finally {
      try {
        await restoreInsightsCapabilityState(originalState);
      } catch (error) {
        insightsLog(`Capability restore failed: ${error?.message || error}`, 'red');
        throw error;
      }
    }
  });
});
