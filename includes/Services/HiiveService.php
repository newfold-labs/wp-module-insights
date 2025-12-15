<?php

namespace NewfoldLabs\WP\Module\Insights\Services;

use NewfoldLabs\WP\Module\Data\HiiveConnection;
use NewfoldLabs\WP\Module\Insights\Repositories\InsightsRepository;
use WP_Error;

/**
 * Class HiiveService
 *
 * Handles direct communication with Hiive API.
 */
class HiiveService {

	/**
	 * Get scan results from Hiive.
	 *
	 * @param array $params Query parameters.
	 * @return array|WP_Error
	 */
	public function get_scans( $params = array() ) {
		return $this->request( 'GET', 'sites/v2/performance-scanner/scans', $params ? array( 'per_page' => InsightsRepository::MAX_SCANS_STORED ) : array() );
	}

	/**
	 * Trigger a new scan.
	 *
	 * @return array|WP_Error
	 */
	public function trigger_scan() {
		return $this->request( 'POST', 'sites/v2/performance-scanner/scans/run' );
	}

	/**
	 * Toggle recurring scans.
	 *
	 * @param bool $status The new status.
	 * @return array|WP_Error
	 */
	public function toggle_recurring( $status ) {
		return $this->request( 'POST', 'sites/v2/performance-scanner/toggle-recurring', array(
			'schedule_status' => $status,
		) );
	}

	/**
	 * Make a request to Hiive.
	 *
	 * @param string $method GET, POST, etc.
	 * @param string $endpoint Endpoint path.
	 * @param array  $body Body parameters.
	 * @return array|WP_Error
	 */
	protected function request( $method, $endpoint, $body = null ) {
		if ( ! HiiveConnection::is_connected() ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Site is not connected to Hiive.', 'wp-module-insights' ),
				array( 'status' => 403 )
			);
		}

		$connection = new HiiveConnection();
		try {
			$headers = array(
				'Content-Type'  => 'application/json',
				'Accept'        => 'application/json',
				'Authorization' => 'Bearer ' . $connection::get_auth_token(),
				'X-Site-Secret' => $this->get_site_secret( false ),
			);

			$args = array(
				'method'  => $method,
				'headers' => $headers,
			);

			$response = $connection->hiive_request( $endpoint, $body, $args );

			if ( is_wp_error( $response ) ) {
				return $response;
			}

			$response_body = wp_remote_retrieve_body( $response );
			$data = json_decode( $response_body, true );

			if ( json_last_error() !== JSON_ERROR_NONE ) {
				return new WP_Error( 'rest_api_error', __( 'Error decoding API response.', 'wp-module-insights' ), array( 'status' => 500 ) );
			}

			return $data;
		} catch ( \Exception $e ) {
			return new WP_Error( 'hiive_request_error', $e->getMessage() );
		}
	}

	/**
	 * Get or generate the site secret.
	 *
	 * @param bool $update_hiive Whether to update Hiive with the new secret.
	 * @return string
	 */
	public function get_site_secret( $update_hiive = true ) {
		$site_secret = get_option( 'nfd_insights_site_secret' );

		if ( ! empty( $site_secret ) ) {
			return $site_secret;
		}

		try {
			$secret = bin2hex( random_bytes( 32 ) );
		} catch ( \Random\RandomException $e ) {
			return '';
		}

		if ( $update_hiive ) {
			$this->request( 'POST', 'sites/v2/performance-scanner' );

			return $this->register_site_secret($secret);
		}

		update_option( 'nfd_insights_site_secret', $secret );
		return $secret;
	}

	/**
	 * Register the secret with Hiive.
	 *
	 * @param string $secret
	 * @return string|false
	 */
	protected function register_site_secret( $secret ) {
		if ( ! HiiveConnection::is_connected() ) {
			return false;
		}

		$connection = new HiiveConnection();
		$path       = 'sites/v2/performance-scanner';
		
		$response = $connection->hiive_request(
			$path,
			null,
			array(
				'headers' => array(
					'Content-Type'  => 'application/json',
					'Accept'        => 'application/json',
					'Authorization' => 'Bearer ' . $connection::get_auth_token(),
					'X-Site-Secret' => $secret,
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return false;
		}

		update_option( 'nfd_insights_site_secret', $secret );

		return $secret;
	}
}
