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
	 * Maximum number of scans to store.
	 */
	const MAX_SCANS_STORED = 30;

	/**
	 * Constructor for the Insights class.
	 *
	 * @param Container $container The module container.
	 */
	public function __construct( Container $container ) {
		$this->container = $container;

		\add_action( 'pre_update_option_' . RestApi::SCANS_OPTION, array( $this, 'handle_scans_option_update' ), 10, 2 );

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

		return ! empty( $capabilities['canScanPerformance'] );
	}

	/**
	 * Initialize REST API.
	 */
	public function init_rest_api() {
		$api = new RestApi();
		$api->register_routes();
	}

	/**
	 * Keep only the most recent scan per day, then keep latest 30 days.
	 *
	 * @param array $scans The scans to format.
	 * @return array
	 */
	public static function format_scans_option($scans ) {
		$by_day = array();

		foreach ( $scans as $scan ) {
			if ( ! is_array( $scan ) || empty( $scan['updatedAt'] ) ) {
				continue;
			}

			$ts = strtotime( $scan['updatedAt'] );
			if ( ! $ts ) {
				continue;
			}

			$day_key = gmdate( 'Y-m-d', $ts );

			if ( ! isset( $by_day[ $day_key ] ) ) {
				$by_day[ $day_key ] = $scan;
				continue;
			}

			$existing_ts = strtotime( $by_day[ $day_key ]['updatedAt'] );
			if ( $ts > $existing_ts ) {
				$by_day[ $day_key ] = $scan;
			}
		}

		$filtered = array_values( $by_day );

		usort( $filtered, function ( $a, $b ) {
			return strtotime( $b['updatedAt'] ) <=> strtotime( $a['updatedAt'] );
		} );

		return array_slice( $filtered, 0, self::MAX_SCANS_STORED );
	}

	/**
	 * Format option before saving it.
	 *
	 * @param mixed $new_value The new value of the option.
	 * @param mixed $old_value The old value of the option.
	 * @return mixed
	 */
	public function handle_scans_option_update( $new_value, $old_value ) {
		if ( ! is_array( $new_value ) ) {
			return $old_value;
		}

		return self::format_scans_option( $new_value );
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
			'nfd-insights',
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

		$screen = \get_current_screen();
		if ( isset( $screen->id ) && ( false !== strpos( $screen->id, 'nfd-insights' ) ) ) {
			\wp_enqueue_script( 'insights-page' );
			\wp_enqueue_style( 'insights-page' );

			\wp_localize_script(
				'insights-page',
				'NFD_INSIGHTS_DATA',
				array(
					'isRunningScan'           => get_transient( RestApi::SCAN_LOCK_TRANSIENT ) !== false,
					'isRecurringScansEnabled' => get_option( RestApi::RECURRING_SCANS_OPTION ) !== false,
				)
			);
		}
	}
}
