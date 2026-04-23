import { join } from 'path';
import { pathToFileURL } from 'url';
import { expect } from '@playwright/test';

const pluginDir = process.env.PLUGIN_DIR || process.cwd();
const finalHelpersPath = join(pluginDir, 'tests/playwright/helpers/index.mjs');
const helpersUrl = pathToFileURL(finalHelpersPath).href;
const pluginHelpers = await import(helpersUrl);

export const { auth, wordpress, newfold, a11y, utils } = pluginHelpers;

const sleep = ( ms ) => new Promise( ( resolve ) => setTimeout( resolve, ms ) );

/**
 * After login, load wp-admin and wait until the REST API accepts the authenticated session.
 * Prevents 403/401 on the first @wordpress/api-fetch call to module routes (cold start / nonce timing).
 *
 * @param {import('@playwright/test').Page} page
 */
export async function waitForAuthenticatedRestContext( page ) {
    await page.goto( '/wp-admin/' );
    await page.waitForLoadState( 'domcontentloaded' );
    await page.waitForSelector( 'body.logged-in', { timeout: 30000 } );

    const mePath = '/wp-json/wp/v2/users/me?context=edit';
    const maxAttempts = 12;
    let lastStatus = 0;
    for ( let attempt = 1; attempt <= maxAttempts; attempt++ ) {
        const res = await page.request.get( mePath, { failOnStatusCode: false } );
        lastStatus = res.status();
        if ( lastStatus === 200 ) {
            return;
        }
        await sleep( Math.min( 500 * attempt, 2500 ) );
    }
    expect(
        lastStatus,
        `Expected authenticated REST ${ mePath } to return 200 before Insights tests; got ${ lastStatus } (session or REST not ready).`
    ).toBe( 200 );
}

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
    await waitForAuthenticatedRestContext( page );
    await navigateToInsightsPage(page);
    await waitForInsightsPage(page);
}
