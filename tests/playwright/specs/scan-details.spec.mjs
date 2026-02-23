import { test, expect } from '@playwright/test';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import {
    auth,
    wordpress,
    waitForInsightsPage,
} from '../helpers/index.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

test.describe('Scan Details Page', () => {

    test.beforeEach(async ({ page }) => {
        // Set capabilities transient to allow performance scans
        await wordpress.wpCli('eval \'set_transient("nfd_site_capabilities", ["canScanPerformance" => true], 4 * HOUR_IN_SECONDS);\'');

        // Ensure NFD_INSIGHTS_DEBUG is defined via mu-plugin to guarantee fixture usage
        await wordpress.wpCli('eval \'file_put_contents(WPMU_PLUGIN_DIR . "/nfd-test-debug.php", "<?php define(\\"NFD_INSIGHTS_DEBUG\\", true);");\'');

        // Clean up cache
        await wordpress.wpCli('option delete nfd_insights_last_scan || true');
        await wordpress.wpCli('transient delete nfd_insights_last_scan_result || true');

        // login to WordPress
        await auth.loginToWordPress(page);
    });

    test('Scan Result Details page loads and displays correct information', async ({ page }) => {
        const fixturePath = join(__dirname, '../../fixtures/scans.json');
        const fixtureData = await readFile(fixturePath, 'utf8');

        // Map the scans REST API endpoint to return our fixture
        await page.route('**/wp-json/newfold-insights/v1/performance-scans*', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: fixtureData
            });
        });

        // Always intercept and fulfill the result.json to guarantee stable tests
        await page.route('**/wp-content/uploads/result.json', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    audits: {
                        "color-contrast": {
                            id: "color-contrast",
                            title: "Mocked Background and foreground colors",
                            score: 0,
                            details: {
                                type: "table",
                                headings: [{ key: "node", valueType: "text", label: "Failing Elements" }],
                                items: [{ node: "Mocked failing element" }]
                            }
                        }
                    }
                })
            });
        });

        // Navigate to the details page specifically testing the scan ID 999
        await page.goto('/wp-admin/tools.php?page=nfd-insights&scan-result=999');
        await waitForInsightsPage(page);

        // Verify the main header is present
        await expect(page.locator('h1.nfd-text-2xl')).toContainText('Scan Result Details');

        // Verify the descriptive paragraph
        await expect(page.locator('p.nfd-text-gray-600')).toContainText('Below is a detailed breakdown');

        // Verify the Diagnostics section title
        await expect(page.locator('h2')).toContainText('Diagnostics');

        // Check if an Accordion element has rendered
        // The accordion button has flex and text formatting, usually containing "—" or a score
        const firstAccordion = page.locator('button.nfd-w-full').filter({ hasText: /—|Mocked/ }).first();
        await expect(firstAccordion).toBeVisible({ timeout: 10000 });

        // Open the accordion
        await firstAccordion.click();

        // Check if the table inside the accordion content renders correctly
        const contentTable = page.locator('.nfd-accordion-content table').first();
        await expect(contentTable).toBeVisible();

        // Check that there is at least one table row with content
        const tableRows = contentTable.locator('tbody tr');
        await expect(tableRows.first()).toBeVisible();
    });
});
