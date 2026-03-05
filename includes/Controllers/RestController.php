<?php

namespace NewfoldLabs\WP\Module\Insights\Controllers;

use NewfoldLabs\WP\Module\Insights\Services\InsightsService;
use NewfoldLabs\WP\Module\Insights\Repositories\InsightsRepository;
use WP_REST_Controller;
use WP_REST_Server;
use WP_Error;

/**
 * REST API controller for performance scans.
 */
class RestController extends WP_REST_Controller {

	/**
	 * Insights Service.
	 *
	 * @var InsightsService
	 */
	protected $service;

	/**
	 * Insights Repository.
	 *
	 * @var InsightsRepository
	 */
	protected $repository;

	/**
	 * Constructor.
	 *
	 * @param InsightsService    $service    Insights Service.
	 * @param InsightsRepository $repository Insights Repository.
	 */
	public function __construct( InsightsService $service = null, InsightsRepository $repository = null ) {
		$this->namespace  = 'newfold-insights/v1';
		$this->rest_base  = 'performance-scans';
		$this->service    = $service ? $service : new InsightsService();
		$this->repository = $repository ? $repository : new InsightsRepository();
	}

	/**
	 * Registers the routes for the objects of the controller.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ), // Webhook for performance results
					'permission_callback' => array( $this, 'webhook_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/run-scan',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'run_scan' ),
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/scan-details',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_scan_details' ),
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
				'args'                => array(
					'jobId' => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/toggle-recurring-scans',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'toggle_recurring_scans' ),
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
				'args'                => array(
					'status' => array( 'required' => true ),
				),
			)
		);
	}

	/**
	 * Get a collection of items.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_items( $request ) {
		$data = $this->service->get_results();

		if ( is_wp_error( $data ) ) {
			return $data;
		}

		return rest_ensure_response( $data );
	}

	/**
	 * Create a new item (Webhook).
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function create_item( $request ) {

		$validation_key = $request->get_header( 'X-Validation-Key' );
		$body           = $request->get_json_params();

		if ( empty( $body['data'] ) || ! is_array( $body['data'] ) ) {
			return new WP_Error(
				'rest_invalid_payload',
				__( 'Invalid webhook payload: missing data field.', 'wp-module-insights' ),
				array( 'status' => 400 )
			);
		}

		$job_id = $body['jobId'] ?? '';

		if ( ! $this->service->validate_webhook_signature( $validation_key, $job_id ) ) {
			return new WP_Error(
				'rest_invalid_validation_key',
				__( 'Invalid X-Validation-Key.', 'wp-module-insights' ),
				array( 'status' => 401 )
			);
		}

		$this->repository->unlock_scan(); // delete_transient( SCAN_LOCK_TRANSIENT )

		$new_scan = $body['data'];
		$this->service->add_scan( $new_scan );

		return rest_ensure_response( array( 'success' => true ) );
	}

	/**
	 * Run a new scan manually.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function run_scan() {
		if ( $this->repository->is_scan_locked() ) {
			return new WP_Error(
				'rest_scan_in_progress',
				__( 'A scan is already in progress. Please wait for the current scan to finish.', 'wp-module-insights' ),
				array( 'status' => 429 )
			);
		}

		$data = $this->service->trigger_scan();

		if ( is_wp_error( $data ) ) {
			return $data;
		}

		$this->repository->lock_scan( 30 * MINUTE_IN_SECONDS );

		return rest_ensure_response( $data );
	}

	/**
	 * Toggle recurring scans.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function toggle_recurring_scans( $request ) {
		$update_status_to = (bool) $request->get_param( 'status' );
		$current_status   = $this->repository->get_recurring_scans_status();

		if ( $current_status !== $update_status_to ) {
			$data = $this->service->toggle_recurring( $update_status_to );

			if ( is_wp_error( $data ) ) {
				return $data;
			}

			if ( empty( $data['success'] ) ) {
				return new WP_Error(
					'rest_toggle_error',
					__( 'Error toggling recurring scans.', 'wp-module-insights' ),
					array( 'status' => 500 )
				);
			}

			$this->repository->update_recurring_scans_status( $update_status_to );
		}

		return rest_ensure_response(
			array(
				'success' => true,
				'status'  => $update_status_to,
			)
		);
	}

	/**
	 * Fetch scan details by jobId.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_scan_details( $request ) {
		$job_id = $request->get_param( 'jobId' );
		$scans  = $this->service->get_results();
		$scan   = null;

		foreach ( $scans as $s ) {
			if ( isset( $s['jobId'] ) && (string) $s['jobId'] === $job_id ) {
				$scan = $s;
				break;
			}
		}

		if ( ! $scan ) {
			return new WP_Error(
				'rest_scan_not_found',
				__( 'Scan not found.', 'wp-module-insights' ),
				array( 'status' => 404 )
			);
		}

		if ( empty( $scan['resultUrl'] ) ) {
			return new WP_Error(
				'rest_scan_no_result',
				__( 'Scan has no result URL.', 'wp-module-insights' ),
				array( 'status' => 404 )
			);
		}

		$response = wp_remote_get( $scan['resultUrl'], array( 'timeout' => 30 ) );

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'rest_scan_details_error',
				$response->get_error_message(),
				array( 'status' => 502 )
			);
		}

		$status = wp_remote_retrieve_response_code( $response );
		$body   = wp_remote_retrieve_body( $response );

		if ( $status >= 400 ) {
			return new WP_Error(
				'rest_scan_details_upstream_error',
				__( 'Upstream request failed.', 'wp-module-insights' ),
				array( 'status' => $status )
			);
		}

		$data = json_decode( $body, true );

		if ( json_last_error() !== JSON_ERROR_NONE ) {
			return new WP_Error(
				'rest_scan_details_invalid_json',
				__( 'Invalid JSON from upstream.', 'wp-module-insights' ),
				array( 'status' => 502 )
			);
		}

		return rest_ensure_response( $data );
	}

	/**
	 * Check permissions for getting items.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return true|\WP_Error
	 */
	public function get_items_permissions_check( $request ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to view these resources.', 'wp-module-insights' ), array( 'status' => 403 ) );
		}
		return true;
	}

	/**
	 * Permission callback for webhook.
	 *
	 * Check if key exists.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return true|\WP_Error
	 */
	public function webhook_permissions_check( $request ) {
		$validation_key = $request->get_header( 'X-Validation-Key' );

		if ( empty( $validation_key ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Missing X-Validation-Key header.', 'wp-module-insights' ),
				array( 'status' => 401 )
			);
		}

		return true;
	}
}
