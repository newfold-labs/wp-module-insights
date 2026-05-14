import { test, expect } from '@playwright/test';
import {
  navigateToInsightsPage,
  waitForInsightsPage,
  prepareInsightsPreconditions,
  setInsightsCapability,
  assertInsightsAdminUrl,
  insightsLog,
} from '../helpers/index.mjs';

test.describe('Insights Module', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    insightsLog(`[insights.spec] beforeEach → ${testInfo.title}`, 'cyan');

    const pre = await prepareInsightsPreconditions(page, {
      canScanPerformance: true,
      retries: 1,
    });
    test.skip(!pre.ok, pre.reason);
  });

  test('App loads without errors', async ({ page }) => {
    await test.step('Navigate to Insights + wait for shell', async () => {
      await navigateToInsightsPage(page);
      await waitForInsightsPage(page);
      assertInsightsAdminUrl(page, 'insights.spec:App loads');
    });

    await expect(page.locator('body')).not.toContainText('Fatal error');
    await expect(page.locator('body')).not.toContainText('Error:');
    await expect(page.locator('#nfd-insights-app')).toBeVisible();
  });

  test('Insights page title is visible', async ({ page }) => {
    await test.step('Navigate to Insights + wait for shell', async () => {
      await navigateToInsightsPage(page);
      await waitForInsightsPage(page);
      assertInsightsAdminUrl(page, 'insights.spec:Insights title');
    });

    await expect(page.locator('#nfd-insights-app')).toContainText('Insights');
  });

  test('Insights page is not visible in Tools submenu when capability is disabled', async ({ page }) => {
    const disabled = await setInsightsCapability(false, 1);
    test.skip(!disabled, 'Unable to verify canScanPerformance=false after retries.');

    await test.step('Open Tools index (expect Insights menu hidden)', async () => {
      insightsLog('Opening /wp-admin/tools.php without page=nfd-insights', 'cyan');
      await page.goto('/wp-admin/tools.php', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForLoadState('load');
      const href = page.url();
      insightsLog(`Tools screen URL=${href}`, 'cyan');
      try {
        const u = new URL(href);
        if (!u.pathname.endsWith('/wp-admin/tools.php')) {
          insightsLog(`Unexpected pathname (wanted …/wp-admin/tools.php): ${u.pathname}`, 'yellow');
        }
        if (u.searchParams.get('page')) {
          insightsLog(`Note: tools URL has page query param page=${u.searchParams.get('page')}`, 'yellow');
        }
      } catch {
        insightsLog(`Could not parse URL: ${href}`, 'yellow');
      }
    });

    const insightsLink = page.locator('#adminmenu a[href*="page=nfd-insights"]');
    await expect(insightsLink).toBeHidden();
  });
});
