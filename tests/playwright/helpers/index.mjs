/**
 * Insights Module Test Helpers for Playwright
 */
import { join } from 'path';
import { pathToFileURL } from 'url';

// ============================================================================
// PLUGIN HELPERS (re-exported from plugin-level helpers)
// ============================================================================

const pluginDir = process.env.PLUGIN_DIR || process.cwd();
const finalHelpersPath = join(pluginDir, 'tests/playwright/helpers/index.mjs');
const helpersUrl = pathToFileURL(finalHelpersPath).href;
const pluginHelpers = await import(helpersUrl);

export const { auth, wordpress, newfold, a11y, utils } = pluginHelpers;

// ============================================================================
// NAVIGATION HELPERS
// ============================================================================

/**
 * Navigate to the insights page
 * @param {import('@playwright/test').Page} page
 */
export async function navigateToInsightsPage(page) {
    await page.goto('/wp-admin/tools.php?page=nfd-insights');
}

/**
 * Wait for insights page to be ready
 * @param {import('@playwright/test').Page} page
 */
export async function waitForInsightsPage(page) {
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#nfd-insights-app');
}

/**
 * Combined setup: login, navigate to insights page, and wait for it to load
 * @param {import('@playwright/test').Page} page
 */
export async function setupAndNavigate(page) {
    await auth.loginToWordPress(page);
    await navigateToInsightsPage(page);
    await waitForInsightsPage(page);
}
