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
        await wordpress.wpCli('eval \'set_transient("nfd_site_capabilities", ["canScanPerformance" => true], 4 * HOUR_IN_SECONDS);\'');
        await wordpress.wpCli('option delete nfd_insights_last_scan || true');
        await wordpress.wpCli('transient delete nfd_insights_last_scan_result || true');
        await auth.loginToWordPress(page);
    });

    test('Scan Result Details page loads and displays correct information', async ({ page }) => {
        const fixturePath = join(__dirname, '../../fixtures/scans.json');
        const fixtureData = await readFile(fixturePath, 'utf8');

        await page.route('**/wp-json/newfold-insights/v1/performance-scans*', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: fixtureData
            });
        });

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

        await page.goto('/wp-admin/tools.php?page=nfd-insights&scan-result=999');
        await waitForInsightsPage(page);

        await expect(page.locator('h1.nfd-text-2xl')).toContainText('Scan Result Details');
        await expect(page.locator('p.nfd-text-gray-600')).toContainText('Below is a detailed breakdown');
        await expect(page.locator('h2')).toContainText('Diagnostics');

        const firstAccordion = page.locator('button.nfd-w-full').filter({ hasText: /—|Mocked/ }).first();
        await expect(firstAccordion).toBeVisible({ timeout: 10000 });
        await firstAccordion.click();

        const contentTable = page.locator('.nfd-accordion-content table').first();
        await expect(contentTable).toBeVisible();

        const tableRows = contentTable.locator('tbody tr');
        await expect(tableRows.first()).toBeVisible();
    });
});
