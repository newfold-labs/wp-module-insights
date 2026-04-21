<?php

namespace NewfoldLabs\WP\Module\Insights;

use NewfoldLabs\WP\Module\Insights\Repositories\InsightsRepository;

/**
 * Tests for {@see InsightsRepository}.
 *
 * @covers \NewfoldLabs\WP\Module\Insights\Repositories\InsightsRepository
 */
class InsightsRepositoryWPUnitTest extends \lucatume\WPBrowser\TestCase\WPTestCase {

	/**
	 * Repository under test.
	 *
	 * @var InsightsRepository
	 */
	protected $repository;

	/**
	 * Resets options and transients before each test.
	 *
	 * @return void
	 */
	public function setUp(): void {
		parent::setUp();
		$this->repository = new InsightsRepository();
		delete_option( InsightsRepository::SCANS_OPTION );
		delete_option( InsightsRepository::RECURRING_SCANS_OPTION );
		delete_option( InsightsRepository::SITE_SECRET_OPTION );
		delete_transient( InsightsRepository::SCAN_LOCK_TRANSIENT );
		delete_transient( InsightsRepository::CACHE_TRANSIENT );
	}

	/**
	 * The get_scans method returns an empty array when nothing is stored.
	 *
	 * @return void
	 */
	public function test_get_scans_defaults_to_empty_array() {
		$this->assertSame( array(), $this->repository->get_scans() );
	}

	/**
	 * The update_scans method persists and get_scans reads back the same list.
	 *
	 * @return void
	 */
	public function test_update_and_get_scans() {
		$scans = array(
			array(
				'jobId'     => 'test-1',
				'updatedAt' => '2020-01-01',
			),
		);
		$this->assertTrue( $this->repository->update_scans( $scans ) );
		$this->assertSame( $scans, $this->repository->get_scans() );
	}

	/**
	 * Recurring scans status can be toggled and read back.
	 *
	 * @return void
	 */
	public function test_recurring_scans_status_roundtrip() {
		$this->assertFalse( $this->repository->get_recurring_scans_status() );
		$this->assertTrue( $this->repository->update_recurring_scans_status( true ) );
		$this->assertTrue( $this->repository->get_recurring_scans_status() );
	}

	/**
	 * Scan lock transient mirrors is_scan_locked and unlock_scan.
	 *
	 * @return void
	 */
	public function test_scan_lock_transient_roundtrip() {
		$this->assertFalse( $this->repository->is_scan_locked() );
		$this->assertTrue( $this->repository->lock_scan( 120 ) );
		$this->assertTrue( $this->repository->is_scan_locked() );
		$this->assertTrue( $this->repository->unlock_scan() );
		$this->assertFalse( $this->repository->is_scan_locked() );
	}

	/**
	 * Cached API results are stored in a transient.
	 *
	 * @return void
	 */
	public function test_cached_results_transient_roundtrip() {
		$this->assertFalse( $this->repository->get_cached_results() );
		$payload = array( 'ok' => true );
		$this->assertTrue( $this->repository->set_cached_results( $payload, 60 ) );
		$this->assertSame( $payload, $this->repository->get_cached_results() );
	}

	/**
	 * Site secret round-trips through options.
	 *
	 * @return void
	 */
	public function test_site_secret_roundtrip() {
		$this->assertSame( '', $this->repository->get_site_secret() );
		$this->assertTrue( $this->repository->update_site_secret( 'secret-key' ) );
		$this->assertSame( 'secret-key', $this->repository->get_site_secret() );
	}
}
