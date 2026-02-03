<?php

namespace NewfoldLabs\WP\Module\Insights;

/**
 * Module loading wpunit tests.
 *
 * @coversNothing
 */
class ModuleLoadingWPUnitTest extends \lucatume\WPBrowser\TestCase\WPTestCase {

	/**
	 * Verify WordPress factory is available.
	 *
	 * @return void
	 */
	public function test_wordpress_factory_available() {
		$this->assertTrue( function_exists( 'get_option' ) );
		$this->assertNotEmpty( get_option( 'blogname' ) );
	}

	/**
	 * Verify add_action exists (bootstrap uses it).
	 *
	 * @return void
	 */
	public function test_wordpress_hooks_available() {
		$this->assertTrue( function_exists( 'add_action' ) );
		$this->assertTrue( function_exists( 'add_filter' ) );
	}

	/**
	 * Verify Insights class exists.
	 *
	 * @return void
	 */
	public function test_insights_class_exists() {
		$this->assertTrue( class_exists( 'NewfoldLabs\WP\Module\Insights\Insights' ) );
	}

	/**
	 * Verify RestController class exists.
	 *
	 * @return void
	 */
	public function test_rest_controller_class_exists() {
		$this->assertTrue( class_exists( 'NewfoldLabs\WP\Module\Insights\Controllers\RestController' ) );
	}
}
