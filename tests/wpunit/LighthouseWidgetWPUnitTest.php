<?php

namespace NewfoldLabs\WP\Module\Insights;

use NewfoldLabs\WP\Module\Insights\Admin\LighthouseWidget;

/**
 * Tests for {@see LighthouseWidget}.
 *
 * @covers \NewfoldLabs\WP\Module\Insights\Admin\LighthouseWidget
 */
class LighthouseWidgetWPUnitTest extends \lucatume\WPBrowser\TestCase\WPTestCase {

	/**
	 * Shared administrator user ID.
	 *
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Creates a shared administrator before the suite runs.
	 *
	 * @return void
	 */
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();
		self::$admin_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
	}

	/**
	 * Logs in as the shared administrator.
	 *
	 * @return void
	 */
	public function setUp(): void {
		parent::setUp();
		wp_set_current_user( self::$admin_id );
	}

	/**
	 * Clears the current user after each test.
	 *
	 * @return void
	 */
	public function tearDown(): void {
		wp_set_current_user( 0 );
		parent::tearDown();
	}

	/**
	 * Widget id matches the DOM container used in wp-admin.
	 *
	 * @return void
	 */
	public function test_widget_id_constant() {
		$this->assertSame( 'nfd_lighthouse_report_widget', LighthouseWidget::ID );
	}

	/**
	 * WordPress registers the dashboard metabox for administrators.
	 *
	 * @return void
	 */
	public function test_init_registers_meta_box_for_administrator() {
		// wp_add_dashboard_widget() passes get_current_screen() into add_meta_box(); the screen
		// must exist before LighthouseWidget::init() runs.
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'dashboard' );
		require_once ABSPATH . 'wp-admin/includes/dashboard.php';

		global $wp_meta_boxes;
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- Test resets dashboard meta boxes before asserting registration.
		$wp_meta_boxes = array();

		LighthouseWidget::init();

		$this->assertArrayHasKey( 'dashboard', $wp_meta_boxes );
		$this->assertArrayHasKey( 'normal', $wp_meta_boxes['dashboard'] );
		// Module passes context `normal`, priority `high` as the last two args.
		$this->assertArrayHasKey( 'high', $wp_meta_boxes['dashboard']['normal'] );
		$this->assertArrayHasKey(
			LighthouseWidget::ID,
			$wp_meta_boxes['dashboard']['normal']['high']
		);
	}

	/**
	 * Subscribers do not get dashboard widgets registered.
	 *
	 * @return void
	 */
	public function test_init_does_not_register_for_subscriber() {
		require_once ABSPATH . 'wp-admin/includes/dashboard.php';
		$sub_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $sub_id );

		global $wp_meta_boxes;
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- Test resets dashboard meta boxes before asserting no registration.
		$wp_meta_boxes = array();

		LighthouseWidget::init();

		$this->assertEmpty( $wp_meta_boxes );

		wp_set_current_user( self::$admin_id );
	}

	/**
	 * The widget_render callback includes the React mount root and test id.
	 *
	 * @return void
	 */
	public function test_widget_render_outputs_mount_point() {
		ob_start();
		LighthouseWidget::widget_render();
		$html = ob_get_clean();

		$this->assertStringContainsString( 'nfd_lighthouse_report_widget_root', $html );
		$this->assertStringContainsString( 'data-test-id="lighthouse-report-dashboard-widget"', $html );
	}
}
