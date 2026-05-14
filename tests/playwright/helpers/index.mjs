import { join } from 'path';
import { pathToFileURL } from 'url';

const pluginDir = process.env.PLUGIN_DIR || process.cwd();
const finalHelpersPath = join(pluginDir, 'tests/playwright/helpers/index.mjs');
const helpersUrl = pathToFileURL(finalHelpersPath).href;
const pluginHelpers = await import(helpersUrl);

export const { auth, wordpress, newfold, a11y, utils } = pluginHelpers;

const { fancyLog } = utils;

/**
 * Use the same code path as production: {@see \NewfoldLabs\WP\Module\Data\SiteCapabilities}
 * writes via {@see \NewfoldLabs\WP\Module\Data\Helpers\Transient} (transients vs options fallback).
 * Manual `option update` / `set_transient` from tests can drift from that behavior on CI.
 */
const DEFAULT_RETRIES = 1;
const DEFAULT_RETRY_DELAY_MS = 150;

function isWpCliError(output) {
  if (typeof output !== 'string') return false;
  return output.startsWith('Error:') || output.includes('Fatal error') || output.includes('Parse error');
}

/**
 * Run a WP-CLI command and normalize result to a simple success object.
 *
 * @param {string} command
 * @returns {Promise<{ok: boolean, output: string}>}
 */
async function runWpCli(command) {
  const raw = await wordpress.wpCli(command);
  const output = typeof raw === 'string' ? raw : String(raw ?? '');
  return { ok: !isWpCliError(output), output };
}

/**
 * @param {string} php Single PHP statement or block (no surrounding <?php).
 * @returns {Promise<{ok: boolean, output: string}>}
 */
async function wpEval(php) {
  return runWpCli(`eval ${JSON.stringify(php)}`);
}

/**
 * Whether the cached capability map satisfies the expected `canScanPerformance` flag.
 * Mirrors PHP `! empty( $capabilities['canScanPerformance'] )`.
 *
 * @param {boolean} expected
 * @returns {Promise<boolean>}
 */
export async function verifyInsightsCapability(expected) {
  const php =
    "echo wp_json_encode((new \\NewfoldLabs\\WP\\Module\\Data\\SiteCapabilities())->all(false));";
  const result = await wpEval(php);
  if (!result.ok) {
    return false;
  }
  try {
    const parsed = JSON.parse(result.output || '{}');
    const actual = Boolean(parsed?.canScanPerformance);
    return actual === Boolean(expected);
  } catch {
    return false;
  }
}

/**
 * Set canScanPerformance and verify persisted value.
 *
 * @param {boolean} enabled
 * @param {number} retries
 * @returns {Promise<boolean>}
 */
export async function setInsightsCapability(enabled, retries = DEFAULT_RETRIES) {
  let lastError = '';

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const phpBool = enabled ? 'true' : 'false';
    const updatePhp = `(new \\NewfoldLabs\\WP\\Module\\Data\\SiteCapabilities())->update(array('canScanPerformance' => ${phpBool}));`;
    const setEval = await wpEval(updatePhp);

    await runWpCli('cache flush');

    if (!setEval.ok) {
      lastError = setEval.output;
    } else if (await verifyInsightsCapability(enabled)) {
      return true;
    } else {
      lastError = 'capability did not match expected value after SiteCapabilities::update()';
    }

    fancyLog(`Insights capability setup retry (${attempt}/${retries}): ${lastError}`, 100, 'yellow');
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, DEFAULT_RETRY_DELAY_MS));
    }
  }

  fancyLog(`Insights capability setup failed: ${lastError}`, 100, 'yellow');
  return false;
}

/**
 * Best-effort cache cleanup used by insights specs.
 *
 * @param {string[]} commands
 * @returns {Promise<void>}
 */
export async function cleanupInsightsState(commands = []) {
  for (const command of commands) {
    const result = await runWpCli(command);
    if (!result.ok) {
      fancyLog(`Cleanup warning for "${command}": ${result.output}`, 100, 'yellow');
    }
  }
}

/**
 * Fast-fail login guard to avoid consuming full test timeout on broken wp-login responses.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<boolean>}
 */
export async function loginToWordPressWithGuard(page) {
  const username = process.env.WP_ADMIN_USERNAME || 'admin';
  const password = process.env.WP_ADMIN_PASSWORD || 'password';
  try {
    await page.goto('/wp-login.php', { waitUntil: 'domcontentloaded', timeout: 15000 });
    const userField = page.locator('#user_login');
    const passField = page.locator('#user_pass');
    await userField.waitFor({ state: 'visible', timeout: 10000 });
    await passField.waitFor({ state: 'visible', timeout: 10000 });
    await userField.fill(username, { timeout: 5000 });
    await passField.fill(password, { timeout: 5000 });
    await passField.press('Enter', { timeout: 5000 });
    await page.waitForURL(
      (url) => {
        if (!url.pathname.includes('/wp-login.php')) return true;
        return url.searchParams.get('action') === 'confirm_admin_email';
      },
      { timeout: 15000 },
    );
    return true;
  } catch (error) {
    fancyLog(`Login precondition failed: ${error?.message || error}`, 100, 'yellow');
    return false;
  }
}

/**
 * Shared precondition for insights specs.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ canScanPerformance?: boolean, cleanupCommands?: string[], retries?: number }} options
 * @returns {Promise<{ok: boolean, reason: string}>}
 */
export async function prepareInsightsPreconditions(page, options = {}) {
  const {
    canScanPerformance = true,
    cleanupCommands = [],
    retries = DEFAULT_RETRIES,
  } = options;

  await cleanupInsightsState(cleanupCommands);

  const capabilityReady = await setInsightsCapability(canScanPerformance, retries);
  if (!capabilityReady) {
    return {
      ok: false,
      reason: `Insights capability canScanPerformance=${String(canScanPerformance)} could not be verified after retries.`,
    };
  }

  const loginReady = await loginToWordPressWithGuard(page);
  if (!loginReady) {
    return {
      ok: false,
      reason: 'WordPress login page was not ready after precondition setup.',
    };
  }

  return { ok: true, reason: '' };
}

export async function navigateToInsightsPage(page) {
  await page.goto('/wp-admin/tools.php?page=nfd-insights', {
    waitUntil: 'domcontentloaded',
    timeout: 10000,
  });
}

/**
 * Wait until the Insights React shell has mounted (stable landmark).
 * The bare `#nfd-insights-app` node can exist with zero height before JS/CSS load;
 * Playwright treats that as hidden, so we wait for the page heading inside the app.
 *
 * @param {import('@playwright/test').Page} page
 */
export async function waitForInsightsShell(page) {
  await page.waitForLoadState('domcontentloaded');
  const root = page.locator('#nfd-insights-app');
  await root.waitFor({ state: 'attached', timeout: 15000 });
  // Prefer the first app h1 over a text regex: translations may not include "Insights",
  // and admin chrome can expose other headings. Covers main Insights + scan-details (both use h1).
  await root.locator('h1').first().waitFor({ state: 'visible', timeout: 25000 });
}

export async function waitForInsightsPage(page) {
  // Avoid `networkidle` — admin pages often keep connections open; flaky on CI.
  await waitForInsightsShell(page);
}

export async function setupAndNavigate(page) {
  await loginToWordPressWithGuard(page);
  await navigateToInsightsPage(page);
  await waitForInsightsPage(page);
}
