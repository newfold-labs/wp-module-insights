<?php

namespace NewfoldLabs\WP\Module\Insights;

use NewfoldLabs\WP\Module\Insights\Admin\Admin;
use NewfoldLabs\WP\Module\Insights\Repositories\InsightsRepository;
use ReflectionMethod;

/**
 * Tests for {@see Admin} Lighthouse widget helpers and asset loading.
 *
 * @covers \NewfoldLabs\WP\Module\Insights\Admin\Admin
 */
class AdminLighthouseWPUnitTest extends \lucatume\WPBrowser\TestCase\WPTestCase {

	/**
	 * Administrator user id for tests that need manage_options.
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
	 * Clears filters and restores the user between tests.
	 *
	 * @return void
	 */
	public function tearDown(): void {
		remove_all_filters( 'nfd_insights_enqueue_lighthouse_widget' );
		wp_set_current_user( 0 );
		parent::tearDown();
	}

	/**
	 * Lighthouse widget data includes the expected keys and scalar types.
	 *
	 * @return void
	 */
	public function test_lighthouse_widget_data_has_expected_keys_and_types() {
		$repo = new InsightsRepository();
		$data = Admin::lighthouse_widget_data( $repo );

		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'isRunningScan', $data );
		$this->assertArrayHasKey( 'isRecurringScansEnabled', $data );
		$this->assertArrayHasKey( 'adminUrl', $data );
		$this->assertArrayHasKey( 'canScanPerformance', $data );
		$this->assertIsBool( $data['isRunningScan'] );
		$this->assertIsBool( $data['isRecurringScansEnabled'] );
		$this->assertIsBool( $data['canScanPerformance'] );
		$this->assertIsString( $data['adminUrl'] );
		$this->assertStringContainsString( 'wp-admin', $data['adminUrl'] );
	}

	/**
	 * The isRunningScan flag follows the scan-lock transient.
	 *
	 * @return void
	 */
	public function test_lighthouse_widget_data_reflects_scan_lock_transient() {
		$repo = new InsightsRepository();
		$repo->lock_scan( 60 );
		$data = Admin::lighthouse_widget_data( $repo );
		$this->assertTrue( $data['isRunningScan'] );
		$repo->unlock_scan();
		$data = Admin::lighthouse_widget_data( $repo );
		$this->assertFalse( $data['isRunningScan'] );
	}

	/**
	 * The isRecurringScansEnabled flag follows the stored option.
	 *
	 * @return void
	 */
	public function test_lighthouse_widget_data_reflects_recurring_scans_option() {
		$repo = new InsightsRepository();
		$repo->update_recurring_scans_status( true );
		$data = Admin::lighthouse_widget_data( $repo );
		$this->assertTrue( $data['isRecurringScansEnabled'] );
		$repo->update_recurring_scans_status( false );
		$data = Admin::lighthouse_widget_data( $repo );
		$this->assertFalse( $data['isRecurringScansEnabled'] );
	}

	/**
	 * The should_enqueue helper returns true on the dashboard for administrators.
	 *
	 * @return void
	 */
	public function test_should_enqueue_lighthouse_widget_true_on_dashboard_screen() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'dashboard' );

		$admin = new Admin( new InsightsRepository() );
		$ref   = new ReflectionMethod( Admin::class, 'should_enqueue_lighthouse_widget' );
		$ref->setAccessible( true );

		$this->assertTrue( $ref->invoke( $admin ) );
	}

	/**
	 * The should_enqueue helper returns false when the current user cannot manage_options.
	 *
	 * @return void
	 */
	public function test_should_enqueue_lighthouse_widget_false_for_subscriber() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		$sub_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $sub_id );
		set_current_screen( 'dashboard' );

		$admin = new Admin( new InsightsRepository() );
		$ref   = new ReflectionMethod( Admin::class, 'should_enqueue_lighthouse_widget' );
		$ref->setAccessible( true );

		$this->assertFalse( $ref->invoke( $admin ) );

		wp_set_current_user( self::$admin_id );
	}

	/**
	 * Non-dashboard screens can opt in via nfd_insights_enqueue_lighthouse_widget.
	 *
	 * @return void
	 */
	public function test_should_enqueue_lighthouse_widget_respects_filter_on_non_dashboard() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'edit-post' );

		$admin = new Admin( new InsightsRepository() );
		$ref   = new ReflectionMethod( Admin::class, 'should_enqueue_lighthouse_widget' );
		$ref->setAccessible( true );

		$this->assertFalse( $ref->invoke( $admin ) );

		add_filter( 'nfd_insights_enqueue_lighthouse_widget', '__return_true' );
		$this->assertTrue( $ref->invoke( $admin ) );
	}

	/**
	 * Registers and enqueues the lighthouse-widget bundle when build artifacts exist.
	 *
	 * @return void
	 */
	public function test_lighthouse_widget_assets_registers_and_enqueues_when_build_present() {
		$asset_file = NFD_INSIGHTS_DIR . '/build/lighthouse-widget/bundle.asset.php';
		if ( ! is_readable( $asset_file ) ) {
			$this->markTestSkipped( 'Lighthouse widget build assets missing; run npm run build in the module root.' );
		}

		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'dashboard' );

		$admin = new Admin( new InsightsRepository() );
		$admin->lighthouse_widget_assets();

		$this->assertTrue( wp_script_is( 'nfd-insights-lighthouse-widget', 'enqueued' ) );
		$this->assertTrue( wp_style_is( 'nfd-insights-lighthouse-widget', 'enqueued' ) );
	}

	/**
	 * The render_insights_page callback outputs the React root element.
	 *
	 * @return void
	 */
	public function test_render_insights_page_outputs_root_div() {
		$admin = new Admin( new InsightsRepository() );
		ob_start();
		$admin->render_insights_page();
		$html = ob_get_clean();
		$this->assertStringContainsString( 'id="nfd-insights-app"', $html );
	}
}
