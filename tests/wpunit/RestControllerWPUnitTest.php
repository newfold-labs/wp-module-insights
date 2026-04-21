<?php

namespace NewfoldLabs\WP\Module\Insights;

use NewfoldLabs\WP\Module\Insights\Controllers\RestController;
use NewfoldLabs\WP\Module\Insights\Repositories\InsightsRepository;
use WP_REST_Request;

/**
 * Additional REST controller unit tests (callbacks and permission checks).
 *
 * @covers \NewfoldLabs\WP\Module\Insights\Controllers\RestController
 */
class RestControllerWPUnitTest extends \lucatume\WPBrowser\TestCase\WPTestCase {

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
	 * Clears the current user after each test.
	 *
	 * @return void
	 */
	public function tearDown(): void {
		wp_set_current_user( 0 );
		parent::tearDown();
	}

	/**
	 * Administrators pass get_items_permissions_check.
	 *
	 * @return void
	 */
	public function test_get_items_permissions_check_allows_administrator() {
		wp_set_current_user( self::$admin_id );
		$controller = new RestController();
		$request    = new WP_REST_Request();
		$result     = $controller->get_items_permissions_check( $request );
		$this->assertTrue( $result );
	}

	/**
	 * Subscribers are forbidden from the REST collection.
	 *
	 * @return void
	 */
	public function test_get_items_permissions_check_forbids_subscriber() {
		$user_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $user_id );
		$controller = new RestController();
		$request    = new WP_REST_Request();
		$result     = $controller->get_items_permissions_check( $request );
		$this->assertWPError( $result );
		$this->assertSame( 'rest_forbidden', $result->get_error_code() );
	}

	/**
	 * Webhook requires X-Validation-Key.
	 *
	 * @return void
	 */
	public function test_webhook_permissions_check_requires_validation_header() {
		$controller = new RestController();
		$request    = new WP_REST_Request();
		$result     = $controller->webhook_permissions_check( $request );
		$this->assertWPError( $result );
		$this->assertSame( 'rest_forbidden', $result->get_error_code() );
	}

	/**
	 * Webhook passes when the validation header is present.
	 *
	 * @return void
	 */
	public function test_webhook_permissions_check_accepts_header() {
		$controller = new RestController();
		$request    = new WP_REST_Request();
		$request->set_header( 'X-Validation-Key', 'test-key' );
		$result = $controller->webhook_permissions_check( $request );
		$this->assertTrue( $result );
	}

	/**
	 * The create_item callback rejects JSON bodies without a data array.
	 *
	 * @return void
	 */
	public function test_create_item_returns_error_when_payload_missing_data() {
		$controller = new RestController();
		$request    = new WP_REST_Request( 'POST', '/newfold-insights/v1/performance-scans' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( '{}' );
		$result = $controller->create_item( $request );
		$this->assertWPError( $result );
		$this->assertSame( 'rest_invalid_payload', $result->get_error_code() );
	}

	/**
	 * The run_scan callback returns 429 when a scan lock is active.
	 *
	 * @return void
	 */
	public function test_run_scan_returns_429_when_scan_locked() {
		wp_set_current_user( self::$admin_id );
		$repo       = new InsightsRepository();
		$controller = new RestController( null, $repo );
		$repo->lock_scan( 120 );
		$result = $controller->run_scan();
		$repo->unlock_scan();
		$this->assertWPError( $result );
		$this->assertSame( 'rest_scan_in_progress', $result->get_error_code() );
	}
}
