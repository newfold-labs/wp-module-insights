import { __ } from '@wordpress/i18n';

/**
 * PageSpeed-style score tier legend (shared by Insights report content and Bluehost embeds).
 *
 * @param {Object}  props
 * @param {boolean} [props.hideNoDataTier] When true, omits the gray “No Data” swatch (e.g. wp-admin dashboard widget).
 */
const LighthouseScoreLegend = ( { hideNoDataTier = false } = {} ) => (
	<div className="nfd-mb-8 nfd-flex nfd-flex-wrap nfd-items-center nfd-justify-center nfd-gap-6 nfd-text-sm nfd-text-gray-800">
		<div className="nfd-flex nfd-items-center nfd-gap-2">
			<span className="nfd-h-3 nfd-w-3 nfd-rounded-full nfd-bg-[#0cce6b]"></span>
			<span>{ __( 'Good:', 'wp-module-insights' ) } &ge; 90</span>
		</div>
		<div className="nfd-flex nfd-items-center nfd-gap-2">
			<span className="nfd-h-3 nfd-w-3 nfd-rounded-full nfd-bg-[#ffa400]"></span>
			<span>
				{ __( 'Needs Improvement: 50 – 89', 'wp-module-insights' ) }
			</span>
		</div>
		<div className="nfd-flex nfd-items-center nfd-gap-2">
			<span className="nfd-h-3 nfd-w-3 nfd-rounded-full nfd-bg-[#ff4e42]"></span>
			<span>{ __( 'Poor: 0–49', 'wp-module-insights' ) }</span>
		</div>
		{ ! hideNoDataTier && (
			<div className="nfd-flex nfd-items-center nfd-gap-2">
				<span className="nfd-h-3 nfd-w-3 nfd-rounded-full nfd-bg-[#AEB9C6]"></span>
				<span>{ __( 'No Data', 'wp-module-insights' ) }</span>
			</div>
		) }
	</div>
);

export default LighthouseScoreLegend;
