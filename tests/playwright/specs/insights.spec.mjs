import { test, expect } from '@playwright/test';
import {
    auth,
    wordpress,
    navigateToInsightsPage,
    waitForInsightsPage,
} from '../helpers/index.mjs';

test.describe('Insights Module', () => {

    test.beforeEach(async ({ page }) => {
        // Set capabilities transient to allow performance scans
        // Value is an array with canScanPerformance: true
        await wordpress.wpCli('eval \'set_transient("nfd_site_capabilities", ["canScanPerformance" => true], 4 * HOUR_IN_SECONDS);\'');

        // login to WordPress
        await auth.loginToWordPress(page);
    });

    test('App loads without errors', async ({ page }) => {
        await navigateToInsightsPage(page);
        await waitForInsightsPage(page);

        // Verify the page loaded (no fatal errors)
        await expect(page.locator('body')).not.toContainText('Fatal error');
        await expect(page.locator('body')).not.toContainText('Error:');

        // Verify the app root element exists
        await expect(page.locator('#nfd-insights-app')).toBeVisible();
    });

    test('Insights page title is visible', async ({ page }) => {
        await navigateToInsightsPage(page);
        await waitForInsightsPage(page);

        // Verify title
        // Note: usage might vary depending on actual UI implementation, 
        // but checking for "Insights" text is a good start
        await expect(page.locator('#nfd-insights-app')).toContainText('Insights');
    });

    test('Insights page is not visible in Tools submenu when capability is disabled', async ({ page }) => {
        // Disable capability
        await wordpress.wpCli('eval \'set_transient("nfd_site_capabilities", ["canScanPerformance" => false], 4 * HOUR_IN_SECONDS);\'');

        // Go to Tools page (or reload if already there, but explicitly going there is safer)
        await page.goto('/wp-admin/tools.php');
        await page.waitForLoadState('networkidle');

        // Check that the Insights link is NOT visible in the menu
        const insightsLink = page.locator('#adminmenu a[href*="page=nfd-insights"]');
        await expect(insightsLink).toBeHidden();
    });

});
