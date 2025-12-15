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
			array(
				'per_page' => Insights::MAX_SCANS_STORED,
			),
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
			set_transient( self::TRANSIENT, $data, MINUTE_IN_SECONDS * 30 );
		}

		return $data;
	}

	/**
	 * Get or generate the site secret.
	 *
	 * @param bool $update_hiive Wheaten to update Hiive with the new secret.
	 * @return string
	 * @throws RandomException
	 */
	public static function get_site_secret( $update_hiive = true ) {
		$site_secret = get_option( 'nfd_insights_site_secret' );

		if ( ! empty( $site_secret ) ) {
			return $site_secret;
		}

		$secret = bin2hex( random_bytes( 32 ) );

		if ( $update_hiive ) {
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
		}

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
		$path       = 'sites/v2/performance-scanner/scans/run';

		$response = $connection->hiive_request(
			$path,
			null,
			array(
				'headers' => array(
					'Content-Type'  => 'application/json',
					'Accept'        => 'application/json',
					'Authorization' => 'Bearer ' . $connection::get_auth_token(),
					'X-Site-Secret' => self::get_site_secret( false ),
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		if ( empty( $data['success'] ) ) {
			return new WP_Error(
				'rest_api_error',
				__( 'Error triggering scan.', 'wp-module-insights' ),
				array(
					'success' => false,
					'status'  => 500,
				)
			);
		}

		if ( json_last_error() !== JSON_ERROR_NONE ) {
			return new WP_Error( 'rest_api_error', __( 'Error decoding API response.', 'wp-module-insights' ), array( 'status' => 500 ) );
		}

		return $data;
	}

	public function toggle_recurring_scans($status) {
		if ( ! HiiveConnection::is_connected() ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Site is not connected to Hiive.', 'wp-module-insights' ),
				array( 'status' => 403 )
			);
		}

		$connection = new HiiveConnection();
		$path       = 'sites/v2/performance-scanner/toggle-recurring';

		$response = $connection->hiive_request(
			$path,
			array('schedule_status' => $status),
			array(
				'headers' => array(
					'Content-Type'  => 'application/json',
					'Accept'        => 'application/json',
					'Authorization' => 'Bearer ' . $connection::get_auth_token(),
					'X-Site-Secret' => self::get_site_secret( false ),
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		if ( json_last_error() !== JSON_ERROR_NONE ) {
			return new WP_Error( 'rest_api_error', __( 'Error decoding API response.', 'wp-module-insights' ), array( 'status' => 500 ) );
		}

		return $data;
	}
}
