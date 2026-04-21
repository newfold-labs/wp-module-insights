<?php

namespace NewfoldLabs\WP\Module\Insights\Admin;

use NewfoldLabs\WP\Module\Insights\Repositories\InsightsRepository;

use function NewfoldLabs\WP\ModuleLoader\container;

/**
 * Class Admin
 *
 * Handles Admin UI registration and assets.
 */
class Admin {

	/**
	 * Insights Repository.
	 *
	 * @var InsightsRepository
	 */
	protected $repository;

	/**
	 * Constructor.
	 *
	 * @param InsightsRepository|null $repository Insights Repository.
	 */
	public function __construct( InsightsRepository $repository = null ) {
		$this->repository = $repository ? $repository : new InsightsRepository();
	}

	/**
	 * Register hooks.
	 */
	public function register_hooks() {
		\add_action( 'admin_menu', array( $this, 'add_insights_menu_link' ) );
		\add_action( 'admin_enqueue_scripts', array( $this, 'insights_page_assets' ) );
		\add_action( 'admin_enqueue_scripts', array( $this, 'lighthouse_widget_assets' ) );
	}

	/**
	 * Add "Insights" sub-link to admin tools menu.
	 */
	public function add_insights_menu_link() {
		\add_submenu_page(
			'tools.php',
			__( 'Insights', 'wp-module-insights' ),
			__( 'Insights', 'wp-module-insights' ),
			'manage_options',
			'nfd-insights',
			array( $this, 'render_insights_page' )
		);
	}

	/**
	 * Render "Insights" page root
	 */
	public function render_insights_page() {
		echo '<div id="nfd-insights-app"></div>';
	}

	/**
	 * Enqueue assets and set locals.
	 */
	public function insights_page_assets() {
		$asset_file = NFD_INSIGHTS_DIR . '/build/insights-page/bundle.asset.php';
		if ( is_readable( $asset_file ) ) {
			$asset = include $asset_file;
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

		\wp_register_style(
			'insights-page-style',
			NFD_INSIGHTS_PLUGIN_URL . 'vendor/newfold-labs/wp-module-insights/build/insights-page/style-insights-page.css',
			null,
			$asset['version']
		);

		$screen = \get_current_screen();
		if ( isset( $screen->id ) && ( false !== strpos( $screen->id, 'nfd-insights' ) ) ) {
			\wp_enqueue_script( 'insights-page' );
			\wp_enqueue_style( 'insights-page' );
			\wp_enqueue_style( 'insights-page-style' );

			\wp_localize_script(
				'insights-page',
				'NFD_INSIGHTS_DATA',
				array(
					'isRunningScan'           => $this->repository->is_scan_locked(),
					'isRecurringScansEnabled' => $this->repository->get_recurring_scans_status(),
				)
			);
		}
	}

	/**
	 * Enqueue the Lighthouse widget bundle.
	 *
	 * The bundle self-mounts in two places so host plugins do not need any JS / CSS of
	 * their own to surface the Lighthouse summary:
	 *
	 * 1. The wp-admin dashboard widget registered by {@see LighthouseWidget}.
	 * 2. Any host plugin admin page exposing a `NFDPortalRegistry` portal named
	 *    `lighthouse-report` (see wp-plugin-bluehost's `src/portalRegistry/index.js`).
	 *
	 * Enqueues therefore run on the dashboard (so the meta box mounts) and on brand plugin
	 * screens (so the portal host is available when the portal registers).
	 */
	public function lighthouse_widget_assets() {
		$asset_file = NFD_INSIGHTS_DIR . '/build/lighthouse-widget/bundle.asset.php';
		if ( ! is_readable( $asset_file ) ) {
			return;
		}
		$asset = include $asset_file;

		$build_dir = NFD_INSIGHTS_PLUGIN_URL . 'vendor/newfold-labs/wp-module-insights/build/lighthouse-widget/';

		\wp_register_script(
			'nfd-insights-lighthouse-widget',
			$build_dir . 'bundle.js',
			array_merge( $asset['dependencies'], array( 'wp-element', 'wp-dom-ready', 'wp-i18n' ) ),
			$asset['version'],
			true
		);

		\wp_register_style(
			'nfd-insights-lighthouse-widget',
			$build_dir . 'lighthouse-widget.css',
			array(),
			$asset['version']
		);

		if ( ! $this->should_enqueue_lighthouse_widget() ) {
			return;
		}

		\wp_localize_script(
			'nfd-insights-lighthouse-widget',
			'NFD_INSIGHTS_HOME',
			self::lighthouse_widget_data( $this->repository )
		);

		\wp_enqueue_script( 'nfd-insights-lighthouse-widget' );
		\wp_enqueue_style( 'nfd-insights-lighthouse-widget' );
	}

	/**
	 * Decide whether to enqueue the Lighthouse widget bundle on the current admin screen.
	 *
	 * Loads on:
	 * - The wp-admin dashboard (`index.php`) so the dashboard widget renders.
	 * - Any host plugin admin page (matched via `container()->plugin()->id`) so the
	 *   `NFDPortalRegistry` portal host is ready when the host page registers a portal.
	 *
	 * @return bool
	 */
	protected function should_enqueue_lighthouse_widget() {
		if ( ! \current_user_can( 'manage_options' ) ) {
			return false;
		}

		$screen = \get_current_screen();
		if ( ! isset( $screen->id ) ) {
			return false;
		}

		if ( 'dashboard' === $screen->id || 'index.php' === $screen->base ) {
			return true;
		}

		$plugin_id = '';
		if ( function_exists( 'NewfoldLabs\\WP\\ModuleLoader\\container' ) ) {
			try {
				$plugin    = container()->plugin();
				$plugin_id = isset( $plugin->id ) ? (string) $plugin->id : '';
			} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
				$plugin_id = '';
			}
		}

		if ( '' !== $plugin_id && false !== strpos( $screen->id, $plugin_id ) ) {
			return true;
		}

		/**
		 * Filter whether the Lighthouse widget bundle should be enqueued on the current screen.
		 *
		 * Host plugins with pages that do not follow the default `{plugin_id}` screen naming
		 * (or third-party integrations) can force-enqueue the bundle here.
		 *
		 * @param bool          $should_enqueue Current decision.
		 * @param \WP_Screen   $screen          Current admin screen.
		 */
		return (bool) \apply_filters( 'nfd_insights_enqueue_lighthouse_widget', false, $screen );
	}

	/**
	 * Data payload for the Lighthouse widget UI (mirrors the `NFD_INSIGHTS_DATA` payload
	 * used by the full Insights page, plus a couple of host-context fields).
	 *
	 * @param InsightsRepository $repository Repository instance.
	 * @return array{isRunningScan: bool, isRecurringScansEnabled: bool, adminUrl: string, canScanPerformance: bool}
	 */
	public static function lighthouse_widget_data( InsightsRepository $repository ) {
		$data = array(
			'isRunningScan'           => (bool) $repository->is_scan_locked(),
			'isRecurringScansEnabled' => (bool) $repository->get_recurring_scans_status(),
			'adminUrl'                => \admin_url(),
			'canScanPerformance'      => false,
		);

		if ( function_exists( 'NewfoldLabs\\WP\\ModuleLoader\\container' ) ) {
			try {
				$capabilities = container()->get( 'capabilities' );
				if ( is_object( $capabilities ) && method_exists( $capabilities, 'all' ) ) {
					$all = $capabilities->all();
					if ( isset( $all['canScanPerformance'] ) ) {
						$data['canScanPerformance'] = (bool) $all['canScanPerformance'];
					}
				}
			} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
				$data['canScanPerformance'] = false;
			}
		}

		return $data;
	}
}
