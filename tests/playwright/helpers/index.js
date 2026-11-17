import { createRequire } from 'module';
import { join } from 'path';
const pluginDir = process.env.PLUGIN_DIR || process.cwd();
const requireFromPlugin = createRequire(join(pluginDir, 'package.json'));
const rawPluginHelpers = requireFromPlugin('./tests/playwright/helpers/index.js');
const pluginHelpers = rawPluginHelpers?.auth !== undefined ? rawPluginHelpers : rawPluginHelpers?.default;

const requiredPluginHelperExports = ['auth', 'wordpress', 'newfold', 'a11y', 'utils'];
const missingPluginHelperExports = requiredPluginHelperExports.filter((name) => pluginHelpers?.[name] === undefined);

if (missingPluginHelperExports.length > 0) {
  throw new Error(
    `[Insights Playwright] Host helper entry at ${join(
      pluginDir,
      'tests/playwright/helpers/index.js',
    )} is missing exports: ${missingPluginHelperExports.join(', ')}`,
  );
}

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
export const INSIGHTS_ADMIN_RELATIVE_URL = 'wp-admin/tools.php?page=nfd-insights';
const INSIGHTS_REST_BASE = '/newfold-insights/v1/performance-scans';

/**
 * Normalize both WordPress REST URL forms:
 * - /wp-json/newfold-insights/v1/performance-scans...
 * - ?rest_route=/newfold-insights/v1/performance-scans...
 *
 * @param {URL|string} urlOrHref
 * @returns {string|null}
 */
export function getInsightsRestPath(urlOrHref) {
  try {
    const url = urlOrHref instanceof URL ? urlOrHref : new URL(urlOrHref);
    const restRoute = url.searchParams.get('rest_route');
    if (restRoute) {
      const path = restRoute.startsWith('/') ? restRoute : `/${restRoute}`;
      return path.startsWith(INSIGHTS_REST_BASE) ? path : null;
    }

    const wpJsonIndex = url.pathname.indexOf('/wp-json/');
    if (wpJsonIndex === -1) {
      return null;
    }

    const path = url.pathname.slice(wpJsonIndex + '/wp-json'.length);
    return path.startsWith(INSIGHTS_REST_BASE) ? path : null;
  } catch {
    return null;
  }
}

/**
 * Install page-scoped mocks before login or any wp-admin navigation.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ collection?: unknown, collectionStatus?: number, scanDetails?: unknown, scanDetailsStatus?: number }} [options]
 */
export async function installInsightsRestMocks(page, options = {}) {
  let collectionResponse = {
    body: options.collection ?? [],
    status: options.collectionStatus ?? 200,
  };
  let scanDetailsResponse =
    options.scanDetails === undefined
      ? null
      : {
          body: options.scanDetails,
          status: options.scanDetailsStatus ?? 200,
        };

  const counts = {
    collection: 0,
    scanDetails: 0,
  };
  const unexpected = [];

  const matcher = (url) => getInsightsRestPath(url) !== null;
  await page.route(matcher, async (route) => {
    const request = route.request();
    const method = request.method();
    const path = getInsightsRestPath(request.url());

    if (method !== 'GET') {
      unexpected.push(`${method} ${path || request.url()}`);
      await route.abort('blockedbyclient');
      return;
    }

    const isCollection = new RegExp(`^${INSIGHTS_REST_BASE}/?$`).test(path || '');
    if (isCollection) {
      counts.collection += 1;
      await route.fulfill({
        status: collectionResponse.status,
        contentType: 'application/json',
        body:
          typeof collectionResponse.body === 'string'
            ? collectionResponse.body
            : JSON.stringify(collectionResponse.body),
      });
      return;
    }

    const isScanDetails = new RegExp(`^${INSIGHTS_REST_BASE}/scan-details(?:\\?|$)`).test(path || '');
    if (isScanDetails && scanDetailsResponse !== null) {
      counts.scanDetails += 1;
      await route.fulfill({
        status: scanDetailsResponse.status,
        contentType: 'application/json',
        body:
          typeof scanDetailsResponse.body === 'string'
            ? scanDetailsResponse.body
            : JSON.stringify(scanDetailsResponse.body),
      });
      return;
    }

    unexpected.push(`${method} ${path || request.url()}`);
    await route.abort('blockedbyclient');
  });

  return {
    counts,
    unexpected,
    snapshot() {
      return { ...counts };
    },
    setCollection(body, status = 200) {
      collectionResponse = { body, status };
    },
    setScanDetails(body, status = 200) {
      scanDetailsResponse = { body, status };
    },
  };
}

/**
 * True when URL is wp-admin Tools with `page=nfd-insights` (extra query params allowed).
 *
 * @param {URL|string} urlOrHref
 * @returns {boolean}
 */
export function isInsightsToolsAdminUrl(urlOrHref) {
  try {
    const url = typeof urlOrHref === 'string' ? new URL(urlOrHref) : urlOrHref;
    return url.pathname.endsWith('/wp-admin/tools.php') && url.searchParams.get('page') === 'nfd-insights';
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
 * Capability writes go through the plugin's shared newfold.setCapability() helper
 * (same helper used by wp-module-performance and wp-module-onboarding's test suites),
 * merged onto the existing capabilities so this doesn't clobber flags other specs
 * depend on. In this CI environment (no object-cache.php drop-in), wp-module-data's
 * Transient::should_use_transients() falls back to the same wp_options-table storage
 * this helper writes to, so there's no cache-vs-options drift to worry about here.
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
  const encodedPhp = Buffer.from(php, 'utf8').toString('base64');
  const runner = [
    `$code = base64_decode("${encodedPhp}", true);`,
    'if ( false === $code ) { throw new Exception("Invalid base64 PHP payload"); }',
    'eval( $code );',
  ].join(' ');
  const shellSafeRunner = `'${runner.replace(/'/g, `'"'"'`)}'`;

  return runWpCli(`eval ${shellSafeRunner}`);
}

function parseLastJsonLine(output) {
  const lines = String(output || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      return JSON.parse(lines[index]);
    } catch {
      // WP-CLI or plugins may emit notices before the final JSON payload.
    }
  }

  throw new Error(`Unable to parse WP-CLI JSON output: ${output}`);
}

/**
 * Capture the raw capability value and timeout rows before any mutation.
 *
 * @returns {Promise<Record<string, { exists: boolean, value: string|null, autoload: string|null }>>}
 */
export async function captureInsightsCapabilityState() {
  const php = `
global $wpdb;
$names = array(
  '_transient_nfd_site_capabilities',
  '_transient_timeout_nfd_site_capabilities',
);
$rows = $wpdb->get_results(
  $wpdb->prepare(
    "SELECT option_name, option_value, autoload FROM {$wpdb->options} WHERE option_name IN (%s, %s)",
    $names[0],
    $names[1]
  ),
  ARRAY_A
);
if ( '' !== $wpdb->last_error ) {
  echo wp_json_encode(
    array(
      'ok' => false,
      'error' => $wpdb->last_error,
    )
  );
  return;
}
$state = array();
foreach ( $names as $name ) {
  $state[$name] = array( 'exists' => false, 'value' => null, 'autoload' => null );
}
foreach ( $rows as $row ) {
  $state[$row['option_name']] = array(
    'exists' => true,
    'value' => base64_encode( $row['option_value'] ),
    'autoload' => $row['autoload'],
  );
}
echo wp_json_encode(
  array(
    'ok' => true,
    'state' => $state,
  )
);
`;
  const result = await wpEval(php);
  if (!result.ok) {
    throw new Error(`Unable to snapshot Insights capability state: ${result.output}`);
  }

  const payload = parseLastJsonLine(result.output);
  if (payload?.ok !== true) {
    throw new Error(`Unable to snapshot Insights capability state: ${payload?.error || 'unknown SQL error'}`);
  }

  const state = payload.state;
  for (const name of ['_transient_nfd_site_capabilities', '_transient_timeout_nfd_site_capabilities']) {
    if (!state?.[name] || typeof state[name].exists !== 'boolean') {
      throw new Error(`Capability snapshot is missing ${name}`);
    }
  }
  return state;
}

/**
 * Restore the exact option-row state captured by captureInsightsCapabilityState().
 *
 * @param {Record<string, { exists: boolean, value: string|null, autoload: string|null }>} state
 * @returns {Promise<void>}
 */
export async function restoreInsightsCapabilityState(state) {
  const encodedState = Buffer.from(JSON.stringify(state), 'utf8').toString('base64');
  const php = `
global $wpdb;
$state = json_decode( base64_decode( '${encodedState}' ), true );
if ( ! is_array( $state ) ) {
  throw new Exception( 'Invalid capability snapshot payload' );
}
foreach ( $state as $name => $row ) {
  if ( ! empty( $row['exists'] ) ) {
    $raw = base64_decode( $row['value'], true );
    if ( false === $raw ) {
      throw new Exception( 'Invalid base64 option value for ' . $name );
    }
    $autoload = isset( $row['autoload'] ) ? $row['autoload'] : 'off';
    $wpdb->query(
      $wpdb->prepare(
        "INSERT INTO {$wpdb->options} (option_name, option_value, autoload)
         VALUES (%s, %s, %s)
         ON DUPLICATE KEY UPDATE option_value = VALUES(option_value), autoload = VALUES(autoload)",
        $name,
        $raw,
        $autoload
      )
    );
  } else {
    $wpdb->delete( $wpdb->options, array( 'option_name' => $name ), array( '%s' ) );
  }
  wp_cache_delete( $name, 'options' );
}
wp_cache_delete( 'alloptions', 'options' );
wp_cache_delete( 'notoptions', 'options' );
wp_cache_flush();
echo 'restored';
`;
  const result = await wpEval(php);
  if (!result.ok || !String(result.output).includes('restored')) {
    throw new Error(`Unable to restore Insights capability state: ${result.output}`);
  }

  const restored = await captureInsightsCapabilityState();
  if (JSON.stringify(restored) !== JSON.stringify(state)) {
    throw new Error(
      `Insights capability restore mismatch. Expected ${JSON.stringify(state)}, received ${JSON.stringify(restored)}`,
    );
  }
}

/**
 * Whether the cached capability map satisfies the expected `canScanPerformance` flag.
 * Mirrors PHP `! empty( $capabilities['canScanPerformance'] )`.
 *
 * @param {boolean} expected
 * @returns {Promise<boolean>}
 */
export async function verifyInsightsCapability(expected) {
  const php = 'echo wp_json_encode((new \\NewfoldLabs\\WP\\Module\\Data\\SiteCapabilities())->all(false));';
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
    // Merge onto whatever capabilities already exist (mirroring
    // SiteCapabilities::update()'s merge behavior) so this doesn't clobber
    // flags other specs (e.g. performance, onboarding) depend on, then
    // write through the plugin's shared setCapability helper so all
    // modules persist capabilities the same way.
    const existingRaw = await runWpCli('transient get nfd_site_capabilities --format=json');
    let existing = {};
    if (existingRaw.ok) {
      try {
        existing = JSON.parse(existingRaw.output) || {};
      } catch {
        existing = {};
      }
    }

    let setOk = true;
    try {
      await newfold.setCapability({ ...existing, canScanPerformance: enabled });
    } catch (error) {
      setOk = false;
      lastError = error?.message || String(error);
    }

    await runWpCli('cache flush');

    if (setOk && (await verifyInsightsCapability(enabled))) {
      insightsLog(
        `setInsightsCapability: verified canScanPerformance=${String(enabled)} (attempt ${attempt}/${retries})`,
        'green',
      );
      return true;
    } else if (setOk) {
      lastError = 'capability did not match expected value after setCapability()';
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

async function loginToLocalWordPress(page) {
  if (await auth.isLoggedIn(page)) {
    return;
  }

  await page.goto('wp-login.php', { waitUntil: 'domcontentloaded' });
  const loginForm = page.locator('#loginform');
  // Set both values and submit in one browser task. WordPress autofocus can
  // move focus between separate Playwright fill calls.
  await Promise.all([
    page.waitForURL(
      (url) =>
        url.pathname.includes('/wp-admin/') ||
        (url.pathname.endsWith('/wp-login.php') && url.searchParams.get('action') === 'confirm_admin_email'),
      { waitUntil: 'domcontentloaded', timeout: 20000 },
    ),
    loginForm.evaluate(
      (form, { username, password }) => {
        form.elements.namedItem('log').value = username;
        form.elements.namedItem('pwd').value = password;
        form.requestSubmit(form.querySelector('#wp-submit'));
      },
      {
        username: process.env.WP_ADMIN_USERNAME || 'admin',
        password: process.env.WP_ADMIN_PASSWORD || 'password',
      },
    ),
  ]);
}

/**
 * Authenticate WordPress while keeping the host's remote and Playground login behavior.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<boolean>}
 */
export async function loginToWordPressWithGuard(page) {
  try {
    if (process.env.BASE_URL || process.env.PLAYGROUND_PLUGIN_DIR || process.env.PLAYGROUND_AUTO_LOGIN === '1') {
      insightsLog('login: using host auth helper', 'cyan');
      await auth.loginToWordPress(page);
    } else {
      insightsLog('login: submitting the WordPress login form', 'cyan');
      await loginToLocalWordPress(page);
    }
    insightsLog(`login: authenticated URL=${page.url()}`, 'green');
    return true;
  } catch (error) {
    insightsLog(`login failed at URL=${page.url()}: ${error?.message || error}`, 'yellow');
    fancyLog(`Login precondition failed: ${error?.message || error}`, 100, 'yellow');
    return false;
  }
}

/**
 * Authenticate and require the Insights menu without mutating server state.
 * REST mocks must be installed before calling this helper because login can open Dashboard.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
export async function prepareReadOnlyInsights(page) {
  const loginReady = await loginToWordPressWithGuard(page);
  if (!loginReady) {
    throw new Error('WordPress login failed before Insights read-only preflight.');
  }

  await page.goto('wp-admin/tools.php', {
    waitUntil: 'domcontentloaded',
    timeout: INSIGHTS_GOTO_TIMEOUT_MS,
  });

  const currentUrl = new URL(page.url());
  if (!currentUrl.pathname.endsWith('/wp-admin/tools.php')) {
    throw new Error(`[Insights Playwright] Expected wp-admin/tools.php during preflight; got ${page.url()}`);
  }

  await page.locator('#adminmenu a[href*="page=nfd-insights"]').first().waitFor({ state: 'visible', timeout: 10000 });
}

/**
 * Shared precondition for insights specs.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ canScanPerformance?: boolean, cleanupCommands?: string[], retries?: number }} options
 * @returns {Promise<{ok: boolean, reason: string}>}
 */
export async function prepareInsightsPreconditions(page, options = {}) {
  const { canScanPerformance = true, cleanupCommands = [], retries = DEFAULT_RETRIES } = options;

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
  return {
    waitUntil: /** @type {const} */ ('load'),
    timeout: INSIGHTS_GOTO_TIMEOUT_MS,
  };
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

  if (
    await page
      .locator('#loginform')
      .isVisible()
      .catch(() => false)
  ) {
    insightsLog(`waitForInsightsShell: still on login screen URL=${page.url()}`, 'yellow');
    throw new Error(
      'Insights shell: browser is on wp-login.php (admin session missing). Check WP_ADMIN_USERNAME/PASSWORD and cookie path.',
    );
  }

  insightsLog(
    `waitForInsightsShell: waiting for URL tools.php?page=nfd-insights (timeout ${INSIGHTS_URL_WAIT_MS}ms), current=${page.url()}`,
    'cyan',
  );
  await page.waitForURL((url) => isInsightsToolsAdminUrl(url), {
    timeout: INSIGHTS_URL_WAIT_MS,
  });

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
    const snippet = await page
      .locator('body')
      .innerText()
      .catch(() => '');
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

  insightsLog(`waitForInsightsShell: waiting for first app h1 visible (timeout ${INSIGHTS_HEADING_MS}ms)`, 'cyan');
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
