<?php

namespace NewfoldLabs\WP\Module\Insights;

use NewfoldLabs\WP\Module\Data\HiiveConnection;
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
			set_transient( self::TRANSIENT, $data, HOUR_IN_SECONDS );
		}

		return $data;
	}

	/**
	 * Trigger a new scan.
	 *
	 * @return array|WP_Error
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
		$path       = 'scan_results/scan';

		$response = $connection->hiive_request( $path );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		if ( json_last_error() !== JSON_ERROR_NONE ) {
			return new WP_Error( 'rest_api_error', __( 'Error decoding API response.', 'wp-module-insights' ), array( 'status' => 500 ) );
		}

		delete_transient( self::TRANSIENT );

		return $data;
	}
}
