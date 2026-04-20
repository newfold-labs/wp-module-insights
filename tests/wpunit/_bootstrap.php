<?php
/**
 * Bootstrap file for wpunit tests.
 *
 * @package NewfoldLabs\WP\Module\Insights
 */

$module_root = dirname( dirname( __DIR__ ) );

require_once $module_root . '/vendor/autoload.php';

/*
 * Production code expects these when Admin / views load outside the module loader callback.
 */
if ( ! defined( 'NFD_INSIGHTS_DIR' ) ) {
	define( 'NFD_INSIGHTS_DIR', $module_root );
}
if ( ! defined( 'NFD_INSIGHTS_PLUGIN_URL' ) ) {
	define( 'NFD_INSIGHTS_PLUGIN_URL', 'http://example.org/wp-content/plugins/wp-module-insights/' );
}
