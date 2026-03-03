import { test, expect } from '@playwright/test';
import {
    auth,
    wordpress,
    navigateToInsightsPage,
    waitForInsightsPage,
} from '../helpers/index.mjs';

test.describe('Insights Module', () => {

    test.beforeEach(async ({ page }) => {
        await wordpress.wpCli('eval \'set_transient("nfd_site_capabilities", ["canScanPerformance" => true], 4 * HOUR_IN_SECONDS);\'');
        await auth.loginToWordPress(page);
    });

    test('App loads without errors', async ({ page }) => {
        await navigateToInsightsPage(page);
        await waitForInsightsPage(page);

        await expect(page.locator('body')).not.toContainText('Fatal error');
        await expect(page.locator('body')).not.toContainText('Error:');
        await expect(page.locator('#nfd-insights-app')).toBeVisible();
    });

    test('Insights page title is visible', async ({ page }) => {
        await navigateToInsightsPage(page);
        await waitForInsightsPage(page);

        await expect(page.locator('#nfd-insights-app')).toContainText('Insights');
    });

    test('Insights page is not visible in Tools submenu when capability is disabled', async ({ page }) => {
        await wordpress.wpCli('eval \'set_transient("nfd_site_capabilities", ["canScanPerformance" => false], 4 * HOUR_IN_SECONDS);\'');

        await page.goto('/wp-admin/tools.php');
        await page.waitForLoadState('networkidle');

        const insightsLink = page.locator('#adminmenu a[href*="page=nfd-insights"]');
        await expect(insightsLink).toBeHidden();
    });

});
