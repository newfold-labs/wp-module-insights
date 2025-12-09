<?php

namespace NewfoldLabs\WP\Module\Insights;

use WP_REST_Controller;
use WP_REST_Server;
use WP_Error;
use WP_REST_Response;

/**
 * REST API controller for performance scans.
 */
class RestApi extends WP_REST_Controller {

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
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => array(
						'from' => array(
							'description'       => __( 'Start date for filtering scans.', 'wp-module-insights' ),
							'type'              => 'string',
							'format'            => 'date',
							'sanitize_callback' => 'sanitize_text_field',
						),
						'to'   => array(
							'description'       => __( 'End date for filtering scans.', 'wp-module-insights' ),
							'type'              => 'string',
							'format'            => 'date',
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => '__return_true', // TODO: Implement proper permission check for webhook
				),
			)
		);
	}

	/**
	 * Get a collection of items.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return \WP_REST_Response|\WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$insights_api = new InsightsApi();
		
		$params = array();
		$from   = $request->get_param( 'from' );
		$to     = $request->get_param( 'to' );
		
		if ( $from ) {
			$params['from'] = $from;
		}
		if ( $to ) {
			$params['to'] = $to;
		}

		$data = $insights_api->get_scan_results( $params );

		if ( is_wp_error( $data ) ) {
			return $data;
		}

		return rest_ensure_response( $data );
	}

	/**
	 * Create a new item (Trigger scan).
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return \WP_REST_Response|\WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		$insights_api = new InsightsApi();
		$data         = $insights_api->trigger_scan();

		if ( is_wp_error( $data ) ) {
			return $data;
		}

		return rest_ensure_response( $data );
	}

	/**
	 * Update an existing item (Webhook).
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return \WP_REST_Response|\WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		$id = $request->get_param( 'id' );
		$scans = get_option( 'nfd_insights_performance_scans', array() );

		if ( ! isset( $scans[ $id ] ) ) {
			return new WP_Error( 'rest_scan_not_found', __( 'Scan not found.', 'wp-module-insights' ), array( 'status' => 404 ) );
		}

		$params = $request->get_json_params();
		
		$fields = array(
			'timeTaken',
			'overallScore',
			'accessibilityScore',
			'seoScore',
			'bestPracticeScore',
			'performanceScore',
			'firstContentfulPaint',
			'speedIndex',
			'largestContentfulPaint',
			'totalBlockingTime',
			'cumulativeLayoutShift',
			'createdAt',
			'updatedAt',
		);

		foreach ( $fields as $field ) {
			if ( isset( $params[ $field ] ) ) {
				$scans[ $id ][ $field ] = $params[ $field ];
			}
		}

		$scans[ $id ]['status'] = 'completed';
		$scans[ $id ]['updatedAt'] = current_time( 'mysql' );

		update_option( 'nfd_insights_performance_scans', $scans );

		return rest_ensure_response( $scans[ $id ] );
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
