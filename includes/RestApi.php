<?php

namespace NewfoldLabs\WP\Module\Insights;

use Random\RandomException;
use WP_REST_Controller;
use WP_REST_Server;
use WP_Error;
use WP_REST_Response;

/**
 * REST API controller for performance scans.
 */
class RestApi extends WP_REST_Controller {

	/**
	 * Option name where scan results are stored.
	 */
	const SCANS_OPTIONS = 'nfd_insights_scans_results';

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'newfold-insights/v1';
		$this->rest_base = 'performance-scans';
	}

	/**
	 * Registers the routes for the objects of the controller.
	 */
	public function register_routes() {
		$routes = array(
			'base_route'     => array(
				'args' => array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => array( $this, 'get_items' ),
						'permission_callback' => array( $this, 'get_items_permissions_check' ),
					),
					array(
						'methods'             => WP_REST_Server::CREATABLE,
						'callback'            => array( $this, 'create_item' ),
						'permission_callback' => array( $this, 'create_item_permissions_check' ),
					),
				),
			),
			'run_scan_route' => array(
				'route' => '/scans',
				'args'  => array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'maybe_run_scan' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
			),
		);

		foreach ( $routes as $route => $data ) {
			$path = isset( $data['route'] ) ? '/' . $this->rest_base . $data['route'] : '/' . $this->rest_base;
			$args = isset( $data['args'] ) ? $data['args'] : $data;

			register_rest_route(
				$this->namespace,
				$path,
				$args
			);
		}
	}

	/**
	 * Get a collection of items.
	 *
	 * @return \WP_REST_Response|\WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$scans = get_option( self::SCANS_OPTIONS, array() );

		if ( empty( $scans ) ) {
			$insights_api = new InsightsApi();
			$data         = $insights_api->get_scan_results();
			if ( is_wp_error( $data ) ) {
				return $data;
			}
		} else {
			$data = $scans;
		}

		return rest_ensure_response( $data );
	}

	/**
	 * Create a new item (get the data from webhook and validate it).
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return \WP_REST_Response|\WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		if ( get_transient( InsightsApi::SCAN_LOCK_TRANSIENT ) === false ) {
			return new WP_Error(
				'rest_scan_not_expected',
				__( 'No scan is currently pending or the scan window has expired.', 'wp-module-insights' ),
				array( 'status' => 409 )
			);
		}

		$validation_key = $request->get_header( 'X-Validation-Key' );

		if ( empty( $validation_key ) ) {
			return new WP_Error(
				'rest_missing_validation_key',
				__( 'Missing X-Validation-Key header.', 'wp-module-insights' ),
				array( 'status' => 401 )
			);
		}

		// 3. Recupera il payload JSON e la chiave "data".
		$body = $request->get_json_params();

		if ( empty( $body['data'] ) || ! is_array( $body['data'] ) ) {
			return new WP_Error(
				'rest_invalid_payload',
				__( 'Invalid webhook payload: missing data field.', 'wp-module-insights' ),
				array( 'status' => 400 )
			);
		}

		$data_json = wp_json_encode( $body['data'] );

		if ( false === $data_json ) {
			return new WP_Error(
				'rest_json_encode_error',
				__( 'Unable to encode data field for validation.', 'wp-module-insights' ),
				array( 'status' => 500 )
			);
		}

		try {
			$secret = InsightsApi::get_site_secret();
		} catch ( \Random\RandomException $e ) {
			return new WP_Error(
				'rest_secret_generation_error',
				__( 'Unable to retrieve site secret.', 'wp-module-insights' ),
				array( 'status' => 500 )
			);
		}

		$expected = hash_hmac( 'sha256', $data_json, $secret );

		if ( ! hash_equals( $expected, $validation_key ) ) {
			return new WP_Error(
				'rest_invalid_validation_key',
				__( 'Invalid X-Validation-Key.', 'wp-module-insights' ),
				array( 'status' => 401 )
			);
		}

		$data = $request->get_json_params();

		if ( empty( $data ) || ! is_array( $data ) ) {
			return new WP_Error(
				'rest_invalid_payload',
				__( 'Invalid webhook payload.', 'wp-module-insights' ),
				array( 'status' => 400 )
			);
		}

		delete_transient( InsightsApi::SCAN_LOCK_TRANSIENT );

		return rest_ensure_response(
			array(
				'success' => true,
			)
		);
	}

	/**
	 * Maybe run a new scan if one is not already in progress.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return \WP_REST_Response|\WP_Error Response object on success, or WP_Error object on failure.
	 * @throws RandomException
	 */
	public function maybe_run_scan( $request ) {
		if ( get_transient( InsightsApi::SCAN_LOCK_TRANSIENT ) !== false ) {
			return new WP_Error(
				'rest_scan_in_progress',
				__( 'A scan is already in progress. Please wait for the current scan to finish.', 'wp-module-insights' ),
				array( 'status' => 429 )
			);
		}

		$insights_api = new InsightsApi();
		$data         = $insights_api->trigger_scan();

		if ( is_wp_error( $data ) ) {
			return $data;
		}

		set_transient(
			InsightsApi::SCAN_LOCK_TRANSIENT,
			30 * MINUTE_IN_SECONDS
		);

		return rest_ensure_response( $data );
	}

	/**
	 * Check permissions for getting items.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return true|\WP_Error
	 */
	public function get_items_permissions_check( $request ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to view these resources.', 'wp-module-insights' ), array( 'status' => 403 ) );
		}
		return true;
	}

	/**
	 * Check permissions for creating items.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return true|\WP_Error
	 */
	public function create_item_permissions_check( $request ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to create resources.', 'wp-module-insights' ), array( 'status' => 403 ) );
		}
		return true;
	}
}
