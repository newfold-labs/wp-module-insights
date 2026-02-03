<?php

namespace NewfoldLabs\WP\Module\Insights;

use NewfoldLabs\WP\Module\Insights\Controllers\RestController;

/**
 * REST API wpunit tests.
 *
 * @covers \NewfoldLabs\WP\Module\Insights\Controllers\RestController::register_routes
 */
class RestApiWPUnitTest extends \lucatume\WPBrowser\TestCase\WPTestCase {

	/**
	 * Verifies that insights REST routes are registered when rest_api_init runs.
	 *
	 * @return void
	 */
	public function test_rest_api_init_registers_insights_routes() {
		$server = rest_get_server();
		$this->assertNotNull( $server );

		// Register routes as the module does on rest_api_init.
		add_action(
			'rest_api_init',
			function () {
				$api = new RestController();
				$api->register_routes();
			}
		);
		do_action( 'rest_api_init' );

		$routes = $server->get_routes();
		$this->assertArrayHasKey( '/newfold-insights/v1/performance-scans', $routes );
		$this->assertArrayHasKey( '/newfold-insights/v1/performance-scans/run-scan', $routes );
		$this->assertArrayHasKey( '/newfold-insights/v1/performance-scans/toggle-recurring-scans', $routes );
	}
}
