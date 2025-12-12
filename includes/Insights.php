<?php

namespace NewfoldLabs\WP\Module\Insights;

use NewfoldLabs\Container\NotFoundException;
use NewfoldLabs\WP\ModuleLoader\Container;

/**
 * Manages all the functionalities for the module.
 */
class Insights {
	/**
	 * Dependency injection container.
	 *
	 * @var Container
	 */
	protected $container;

	/**
	 * Constructor for the Insights class.
	 *
	 * @param Container $container The module container.
	 */
	public function __construct( Container $container ) {
		$this->container = $container;

		if ( $this->can_view_insights() ) {
			\add_action( 'admin_menu', array( __CLASS__, 'add_insights_menu_link' ) );
			\add_action( 'admin_enqueue_scripts', array( __CLASS__, 'insights_page_assets' ) );
			\add_action( 'rest_api_init', array( $this, 'init_rest_api' ) );
		}
	}

	/**
	 * Check if the current user can view insights.
	 *
	 * @return bool
	 * @throws NotFoundException
	 */
	public function can_view_insights() {
		$capabilities = $this->container->get( 'capabilities' )->all();

		return array_key_exists( 'canScanPerformance', $capabilities ) && $capabilities['canScanPerformance'];
	}

	/**
	 * Initialize REST API.
	 */
	public function init_rest_api() {
		$api = new RestApi();
		$api->register_routes();
	}

	/**
	 * Add "Insights" sub-link to admin tools menu.
	 */
	public static function add_insights_menu_link() {
		\add_submenu_page(
			'tools.php',
			__( 'Insights', 'wp-module-insights' ),
			__( 'Insights', 'wp-module-insights' ),
			'manage_options',
			'insights',
			array( __CLASS__, 'render_insights_page' )
		);
	}

	/**
	 * Render "Insights" page root
	 *
	 * @return void
	 */
	public static function render_insights_page() {
		echo '<div id="nfd-insights-app"></div>';
	}

	/**
	 * Enqueue assets and set locals.
	 */
	public static function insights_page_assets() {
		$asset_file = NFD_INSIGHTS_DIR . '/build/insights-page/bundle.asset.php';
		if ( is_readable( $asset_file ) ) {
			$asset = include_once $asset_file;
		} else {
			return;
		}

		\wp_register_script(
			'insights-page',
			NFD_INSIGHTS_PLUGIN_URL . 'vendor/newfold-labs/wp-module-insights/build/insights-page/bundle.js',
			array_merge(
				$asset['dependencies'],
				array( 'wp-element' ),
			),
			$asset['version'],
			true
		);

		\wp_register_style(
			'insights-page',
			NFD_INSIGHTS_PLUGIN_URL . 'vendor/newfold-labs/wp-module-insights/build/insights-page/insights-page.css',
			null,
			$asset['version']
		);

		// Only enqueue on insights page
		$screen = \get_current_screen();
		if ( isset( $screen->id ) && ( false !== strpos( $screen->id, 'insights' ) ) ) {
			\wp_enqueue_script( 'insights-page' );
			\wp_enqueue_style( 'insights-page' );

			\wp_localize_script(
				'insights-page',
				'NFD_INSIGHTS_DATA',
				array(
					'isRunningScan'           => get_transient( RestApi::SCAN_LOCK_TRANSIENT ) !== false,
					'isRecurringScansEnabled' => get_option( RestApi::RECURRING_SCANS_OPTIONS ) !== false,
				)
			);
		}
	}
}
