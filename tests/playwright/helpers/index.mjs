import { join } from 'path';
import { pathToFileURL } from 'url';

const pluginDir = process.env.PLUGIN_DIR || process.cwd();
const finalHelpersPath = join(pluginDir, 'tests/playwright/helpers/index.mjs');
const helpersUrl = pathToFileURL(finalHelpersPath).href;
const pluginHelpers = await import(helpersUrl);

export const { auth, wordpress, newfold, a11y, utils } = pluginHelpers;

export async function navigateToInsightsPage(page) {
    await page.goto('/wp-admin/tools.php?page=nfd-insights');
}

export async function waitForInsightsPage(page) {
	// Avoid `networkidle` — admin pages often keep connections open; flaky on CI.
	await page.waitForLoadState( 'domcontentloaded' );
	await page.waitForSelector( '#nfd-insights-app', { timeout: 15000 } );
}

export async function setupAndNavigate(page) {
    await auth.loginToWordPress(page);
    await navigateToInsightsPage(page);
    await waitForInsightsPage(page);
}
