<?php
/**
 * Lighthouse Report dashboard widget view (React mount point).
 *
 * WordPress renders the metabox heading; CSS below adds the Lighthouse mark via `h2:before`
 * (mirroring the pattern used by Bluehost's widgets and wp-module-next-steps).
 *
 * wp-admin link styles (`#wpbody-content .wrap a`, specificity 0,1,1,1) outrank the
 * `.nfd-root a.nfd-button--secondary` rule produced by this module's compiled bundle. Those
 * colour overrides therefore live here as inline CSS, scoped to the metabox id so they can
 * beat wp-admin with only a single ID of specificity — keeping the compiled bundle CSS free
 * of id-scoped rules that would not survive the `postcss-prefix-selector` containment used
 * by the widget bundle.
 *
 * @package WPModuleInsights
 */

namespace NewfoldLabs\WP\Module\Insights\Admin;

$icon_path = NFD_INSIGHTS_DIR . '/assets/icons/lighthouse-logo.svg';
$svg_64    = '';
if ( is_readable( $icon_path ) ) {
	$svg_64 = base64_encode( (string) file_get_contents( $icon_path ) );
}
?>
<style>
<?php if ( $svg_64 ) : ?>
	#nfd_lighthouse_report_widget h2 {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 0.5rem;
	}
	#nfd_lighthouse_report_widget h2:before {
		content: '';
		display: block;
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		background-image: url( 'data:image/svg+xml;base64,<?php echo esc_attr( $svg_64 ); ?>' );
		background-repeat: no-repeat;
		background-position: center;
		background-size: contain;
	}
<?php endif; ?>
	/* Beat wp-admin `#wpbody-content .wrap a` link colour on the "Open Site Insights" button. */
	#nfd_lighthouse_report_widget .nfd-root a.nfd-button--secondary,
	#nfd_lighthouse_report_widget .nfd-root a.nfd-button--secondary:hover,
	#nfd_lighthouse_report_widget .nfd-root a.nfd-button--secondary:focus,
	#nfd_lighthouse_report_widget .nfd-root a.nfd-button--secondary:visited {
		color: #196BDE;
	}
	#nfd_lighthouse_report_widget .nfd-root a.nfd-button--secondary svg {
		color: currentColor;
	}
</style>
<div
	id="nfd_lighthouse_report_widget_root"
	class="nfd-root nfd-widget nfd-widget-lighthouse"
	data-test-id="lighthouse-report-dashboard-widget"
></div>
