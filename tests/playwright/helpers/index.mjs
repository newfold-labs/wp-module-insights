import { join } from 'path';
import { pathToFileURL } from 'url';

const pluginDir = process.env.PLUGIN_DIR || process.cwd();
const finalHelpersPath = join(pluginDir, 'tests/playwright/helpers/index.mjs');
const helpersUrl = pathToFileURL(finalHelpersPath).href;
const pluginHelpers = await import(helpersUrl);

export const { auth, wordpress, newfold, a11y, utils } = pluginHelpers;

const { fancyLog } = utils;

/**
 * Prefixed Playwright helper logs (CI-friendly). Uses a high max length so admin URLs are not truncated.
 *
 * @param {string} message
 * @param {'cyan'|'yellow'|'green'|'red'|'gray'} [color]
 */
export function insightsLog(message, color = 'cyan') {
  fancyLog(`[Insights Playwright] ${message}`, 500, color);
}

/**
 * Relative URL for the main Insights Tools screen (no origin).
 * Scan-details tests append `&scan-result=…`.
 */
export const INSIGHTS_ADMIN_RELATIVE_URL = '/wp-admin/tools.php?page=nfd-insights';

/**
 * True when URL is wp-admin Tools with `page=nfd-insights` (extra query params allowed).
 *
 * @param {URL|string} urlOrHref
 * @returns {boolean}
 */
export function isInsightsToolsAdminUrl(urlOrHref) {
  try {
    const url = typeof urlOrHref === 'string' ? new URL(urlOrHref) : urlOrHref;
    return (
      url.pathname.endsWith('/wp-admin/tools.php') && url.searchParams.get('page') === 'nfd-insights'
    );
  } catch {
    return false;
  }
}

/**
 * Assert current page URL is the Insights Tools admin screen; logs URL for CI artifacts.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} [stepLabel] Where in the flow this check ran (shown in errors/logs).
 */
export function assertInsightsAdminUrl(page, stepLabel = 'Insights URL check') {
  const href = page.url();
  insightsLog(`${stepLabel}: URL=${href}`, 'cyan');
  let parsed;
  try {
    parsed = new URL(href);
  } catch {
    const msg = `${stepLabel}: invalid URL string: ${href}`;
    insightsLog(msg, 'yellow');
    throw new Error(`[Insights Playwright] ${msg}`);
  }
  if (!isInsightsToolsAdminUrl(parsed)) {
    const msg =
      `${stepLabel}: expected pathname ending with /wp-admin/tools.php and query page=nfd-insights; ` +
      `got pathname=${parsed.pathname} search=${parsed.search}`;
    insightsLog(msg, 'yellow');
    throw new Error(`[Insights Playwright] ${msg}`);
  }
  insightsLog(`${stepLabel}: OK (Insights admin URL)`, 'green');
}

/**
 * Use the same code path as production: {@see \NewfoldLabs\WP\Module\Data\SiteCapabilities}
 * writes via {@see \NewfoldLabs\WP\Module\Data\Helpers\Transient} (transients vs options fallback).
 * Manual `option update` / `set_transient` from tests can drift from that behavior on CI.
 */
const DEFAULT_RETRIES = 1;
const DEFAULT_RETRY_DELAY_MS = 150;

/** Generous budgets so local and CI behave the same (cold wp-env / slow runners). */
const INSIGHTS_GOTO_TIMEOUT_MS = 30000;
/** Mount node is omitted entirely when Insights admin did not register (capabilities) or we never reached the screen. */
const INSIGHTS_ROOT_ATTACH_MS = 45000;
const INSIGHTS_HEADING_MS = 45000;
const INSIGHTS_URL_WAIT_MS = 30000;

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

  insightsLog(`setInsightsCapability: canScanPerformance=${String(enabled)} (retries=${retries})`, 'cyan');

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const phpBool = enabled ? 'true' : 'false';
    const updatePhp = `(new \\NewfoldLabs\\WP\\Module\\Data\\SiteCapabilities())->update(array('canScanPerformance' => ${phpBool}));`;
    const setEval = await wpEval(updatePhp);

    await runWpCli('cache flush');

    if (!setEval.ok) {
      lastError = setEval.output;
    } else if (await verifyInsightsCapability(enabled)) {
      insightsLog(`setInsightsCapability: verified canScanPerformance=${String(enabled)} (attempt ${attempt}/${retries})`, 'green');
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
    insightsLog('login: opening /wp-login.php', 'cyan');
    await page.goto('/wp-login.php', { waitUntil: 'domcontentloaded', timeout: 15000 });
    insightsLog(`login: loaded wp-login URL=${page.url()}`, 'cyan');
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
    insightsLog(`login: post-submit URL=${page.url()}`, 'green');
    return true;
  } catch (error) {
    insightsLog(`login failed at URL=${page.url()}: ${error?.message || error}`, 'yellow');
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

  insightsLog(
    `prepareInsightsPreconditions: start canScanPerformance=${String(canScanPerformance)} cleanupCommands=${cleanupCommands.length}`,
    'cyan',
  );

  await cleanupInsightsState(cleanupCommands);
  insightsLog('prepareInsightsPreconditions: cleanup finished', 'cyan');

  const capabilityRetries = canScanPerformance ? Math.max(retries, 2) : retries;
  const capabilityReady = await setInsightsCapability(canScanPerformance, capabilityRetries);
  if (!capabilityReady) {
    insightsLog(
      `prepareInsightsPreconditions: FAILED capability canScanPerformance=${String(canScanPerformance)}`,
      'yellow',
    );
    return {
      ok: false,
      reason: `Insights capability canScanPerformance=${String(canScanPerformance)} could not be verified after retries.`,
    };
  }

  insightsLog('prepareInsightsPreconditions: logging in…', 'cyan');
  const loginReady = await loginToWordPressWithGuard(page);
  if (!loginReady) {
    insightsLog(`prepareInsightsPreconditions: FAILED login (last URL=${page.url()})`, 'yellow');
    return {
      ok: false,
      reason: 'WordPress login page was not ready after precondition setup.',
    };
  }

  insightsLog(`prepareInsightsPreconditions: login OK, URL=${page.url()}`, 'green');

  // Re-persist after login so web workers see the same cache state as WP-CLI (helps flaky object-cache timing).
  if (canScanPerformance) {
    insightsLog('prepareInsightsPreconditions: re-persisting canScanPerformance after login', 'cyan');
    await setInsightsCapability(true, 2);
  }

  insightsLog('prepareInsightsPreconditions: complete', 'green');
  return { ok: true, reason: '' };
}

export async function navigateToInsightsPage(page) {
  insightsLog(`navigateToInsightsPage: goto ${INSIGHTS_ADMIN_RELATIVE_URL}`, 'cyan');
  await page.goto(INSIGHTS_ADMIN_RELATIVE_URL, {
    waitUntil: 'load',
    timeout: INSIGHTS_GOTO_TIMEOUT_MS,
  });
  insightsLog(`navigateToInsightsPage: navigation settled URL=${page.url()}`, 'cyan');
  assertInsightsAdminUrl(page, 'navigateToInsightsPage');
}

/** Navigation defaults for any Insights-related wp-admin URL (main page or scan details). */
export function getInsightsAdminGotoOptions() {
  return { waitUntil: /** @type {const} */ ('load'), timeout: INSIGHTS_GOTO_TIMEOUT_MS };
}

/**
 * Wait until the Insights React shell has mounted (stable landmark).
 * The bare `#nfd-insights-app` node can exist with zero height before JS/CSS load;
 * Playwright treats that as hidden, so we wait for the page heading inside the app.
 *
 * @param {import('@playwright/test').Page} page
 */
export async function waitForInsightsShell(page) {
  insightsLog(`waitForInsightsShell: start URL=${page.url()}`, 'cyan');
  await page.waitForLoadState('domcontentloaded');

  if (await page.locator('#loginform').isVisible().catch(() => false)) {
    insightsLog(`waitForInsightsShell: still on login screen URL=${page.url()}`, 'yellow');
    throw new Error(
      'Insights shell: browser is on wp-login.php (admin session missing). Check WP_ADMIN_USERNAME/PASSWORD and cookie path.',
    );
  }

  insightsLog(
    `waitForInsightsShell: waiting for URL tools.php?page=nfd-insights (timeout ${INSIGHTS_URL_WAIT_MS}ms), current=${page.url()}`,
    'cyan',
  );
  await page.waitForURL((url) => isInsightsToolsAdminUrl(url), { timeout: INSIGHTS_URL_WAIT_MS });

  assertInsightsAdminUrl(page, 'waitForInsightsShell:after URL wait');

  insightsLog('waitForInsightsShell: waiting for #wpwrap', 'cyan');
  await page.locator('#wpwrap').waitFor({ state: 'attached', timeout: INSIGHTS_URL_WAIT_MS });

  const root = page.locator('#nfd-insights-app');
  insightsLog(
    `waitForInsightsShell: waiting for #nfd-insights-app attached (timeout ${INSIGHTS_ROOT_ATTACH_MS}ms)`,
    'cyan',
  );
  try {
    await root.waitFor({ state: 'attached', timeout: INSIGHTS_ROOT_ATTACH_MS });
  } catch {
    const snippet = await page.locator('body').innerText().catch(() => '');
    insightsLog(
      `waitForInsightsShell: #nfd-insights-app missing URL=${page.url()} snippet=${snippet.slice(0, 200)}…`,
      'yellow',
    );
    throw new Error(
      `Insights mount #nfd-insights-app missing after ${INSIGHTS_ROOT_ATTACH_MS}ms. ` +
        `URL=${page.url()} — Insights admin may not be registered (canScanPerformance false in web context). ` +
        `Body snippet: ${snippet.slice(0, 500)}`,
    );
  }

  insightsLog(
    `waitForInsightsShell: waiting for first app h1 visible (timeout ${INSIGHTS_HEADING_MS}ms)`,
    'cyan',
  );
  // Prefer the first app h1 over a text regex: translations may not include "Insights",
  // and admin chrome can expose other headings. Covers main Insights + scan-details (both use h1).
  await root.locator('h1').first().waitFor({ state: 'visible', timeout: INSIGHTS_HEADING_MS });

  assertInsightsAdminUrl(page, 'waitForInsightsShell:complete');
  insightsLog(`waitForInsightsShell: shell ready URL=${page.url()}`, 'green');
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
