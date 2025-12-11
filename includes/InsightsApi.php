<?php

namespace NewfoldLabs\WP\Module\Insights;

use NewfoldLabs\WP\Module\Data\HiiveConnection;
use Random\RandomException;
use WP_Error;

/**
 * Class InsightsApi
 *
 * Handles API requests to the Insights service via Hiive.
 */
class InsightsApi {

	/**
	 * Transient name where data is stored.
	 */
	const TRANSIENT = 'nfd_insights_scan_results';

	/**
	 * Transient name used as a lock while a scan is pending.
	 */
	const SCAN_LOCK_TRANSIENT = 'nfd_insights_scan_pending';

	/**
	 * Get scan results.
	 *
	 * @param array $params Query parameters.
	 * @return array|WP_Error
	 */
	public function get_scan_results( $params = array() ) {
		if ( ! HiiveConnection::is_connected() ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Site is not connected to Hiive.', 'wp-module-insights' ),
				array( 'status' => 403 )
			);
		}

		$use_cache = empty( $params );
		if ( $use_cache ) {
			$cached_data = get_transient( self::TRANSIENT );
			if ( false !== $cached_data ) {
				return $cached_data;
			}
		}

		$connection = new HiiveConnection();
		$path       = 'sites/v2/performance-scanner/scans';

		if ( ! empty( $params ) ) {
			$path = add_query_arg( $params, $path );
		}

		$response = $connection->hiive_request(
			$path,
			null,
			array( 'method' => 'GET' )
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		if ( json_last_error() !== JSON_ERROR_NONE ) {
			return new WP_Error( 'rest_api_error', __( 'Error decoding API response.', 'wp-module-insights' ), array( 'status' => 500 ) );
		}

		if ( $use_cache ) {
			set_transient( self::TRANSIENT, $data, HOUR_IN_SECONDS * 6 );
		}

		return $data;
	}

	/**
	 * Get or generate the site secret.
	 *
	 * @return string
	 * @throws RandomException
	 */
	public static function get_site_secret() {
		$site_secret = get_option( 'nfd_insights_site_secret' );
		if ( $site_secret ) {
			return $site_secret;
		}

		$secret = bin2hex( random_bytes( 32 ) );
		update_option( 'nfd_insights_site_secret', $secret );
		return $secret;
	}

	/**
	 * Trigger a new scan.
	 *
	 * @return array|WP_Error
	 * @throws RandomException
	 */
	public function trigger_scan() {
		if ( ! HiiveConnection::is_connected() ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Site is not connected to Hiive.', 'wp-module-insights' ),
				array( 'status' => 403 )
			);
		}

		$connection = new HiiveConnection();
		$path       = 'site/v2/performance-scanner';

		$response = $connection->hiive_request(
			$path,
			null,
			array(
				'headers' => array(
					'X-Site-Secret' => self::get_site_secret(),
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status_code = wp_remote_retrieve_response_code( $response );

		if ( ! in_array( $status_code, array( 200, 202 ), true ) ) {
			return new WP_Error(
				'rest_api_error',
				__( 'Error triggering scan.', 'wp-module-insights' ),
				array( 'status' => $status_code )
			);
		}

		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );
		if ( json_last_error() !== JSON_ERROR_NONE ) {
			return new WP_Error( 'rest_api_error', __( 'Error decoding API response.', 'wp-module-insights' ), array( 'status' => 500 ) );
		}

		return $data;
	}
}
