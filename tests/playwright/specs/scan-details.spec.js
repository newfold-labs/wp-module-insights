import { test, expect } from '@playwright/test';
import { readFile } from 'fs/promises';
import { join } from 'path';
import {
  installInsightsRestMocks,
  prepareInsightsPreconditions,
  waitForInsightsPage,
  getInsightsAdminGotoOptions,
  INSIGHTS_ADMIN_RELATIVE_URL,
  assertInsightsAdminUrl,
  insightsLog,
} from '../helpers/index.js';

const mockAuditDetails = {
  audits: {
    'color-contrast': {
      id: 'color-contrast',
      title: 'Mocked Background and foreground colors',
      score: 0,
      details: {
        type: 'table',
        headings: [{ key: 'node', valueType: 'text', label: 'Failing Elements' }],
        items: [{ node: 'Mocked failing element' }],
      },
    },
  },
};

test.describe('Scan Details Page', { tag: '@env-local' }, () => {
  test.describe.configure({ timeout: 60000 });

  test('Scan Result Details page loads and displays correct information', async ({ page }) => {
    const fixturePath = join(__dirname, '../fixtures/scans.json');
    const fixtureData = await readFile(fixturePath, 'utf8');
    const rest = await installInsightsRestMocks(page, {
      collection: fixtureData,
      scanDetails: mockAuditDetails,
    });
    const precondition = await prepareInsightsPreconditions(page, {
      canScanPerformance: true,
      retries: 1,
      cleanupCommands: [
        'option delete nfd_insights_last_scan || true',
        'transient delete nfd_insights_last_scan_result || true',
      ],
    });
    if (!precondition.ok) {
      throw new Error(precondition.reason);
    }

    const scanDetailsUrl = `${INSIGHTS_ADMIN_RELATIVE_URL}&scan-result=999`;
    const beforeNavigation = rest.snapshot();

    await test.step('Open scan-details Tools URL', async () => {
      insightsLog(`scan-details: goto ${scanDetailsUrl}`, 'cyan');
      await page.goto(scanDetailsUrl, {
        ...getInsightsAdminGotoOptions(),
      });
      insightsLog(`scan-details: after goto URL=${page.url()}`, 'cyan');
      assertInsightsAdminUrl(page, 'scan-details:after goto');
    });

    await test.step('Wait for Insights shell', async () => {
      await waitForInsightsPage(page);
      assertInsightsAdminUrl(page, 'scan-details:after shell');
    });

    await expect.poll(() => rest.counts.collection).toBeGreaterThan(beforeNavigation.collection);
    await expect.poll(() => rest.counts.scanDetails).toBeGreaterThan(beforeNavigation.scanDetails);
    expect(rest.unexpected).toEqual([]);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Performance report');
    await expect(page.getByText(/Lighthouse audit for this scan/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Diagnostics' })).toBeVisible();

    const firstAccordion = page.getByRole('button', { name: /Mocked/ }).first();
    await expect(firstAccordion).toBeVisible({ timeout: 10000 });
    await firstAccordion.click();

    const contentTable = page.locator('.nfd-accordion-content table').first();
    await expect(contentTable).toBeVisible();

    const tableRows = contentTable.locator('tbody tr');
    await expect(tableRows.first()).toBeVisible();
  });
});
