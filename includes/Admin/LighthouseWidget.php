<?php
/**
 * Lighthouse Report dashboard widget.
 *
 * @package WPModuleInsights
 */

namespace NewfoldLabs\WP\Module\Insights\Admin;

/**
 * Registers a wp-admin dashboard widget that surfaces the Lighthouse Report section from
 * Tools → Site Insights.
 *
 * The widget owns only its container + heading chrome — the React UI is mounted by the
 * `lighthouse-widget` bundle (see {@see Admin::lighthouse_widget_assets()}).
 */
class LighthouseWidget {

	/**
	 * WordPress dashboard widget id.
	 */
	const ID = 'nfd_lighthouse_report_widget';

	/**
	 * Constructor.
	 */
	public function __construct() {
		\add_action( 'wp_dashboard_setup', array( __CLASS__, 'init' ), 1 );
	}

	/**
	 * Register the dashboard widget.
	 */
	public static function init() {
		if ( ! \current_user_can( 'manage_options' ) ) {
			return;
		}

		\wp_add_dashboard_widget(
			self::ID,
			\__( 'Lighthouse Report', 'wp-module-insights' ),
			array( __CLASS__, 'widget_render' ),
			null,
			null,
			'normal',
			'high'
		);
	}

	/**
	 * Render widget markup. The React UI is mounted into the inner root by the bundle.
	 */
	public static function widget_render() {
		$view_file = NFD_INSIGHTS_DIR . '/includes/Admin/views/lighthouse-widget.php';
		if ( \is_readable( $view_file ) ) {
			include $view_file;
		}
	}
}
