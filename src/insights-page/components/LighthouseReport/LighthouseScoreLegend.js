import { __ } from '@wordpress/i18n';

/** @type {string} wp-module-insights on the Insights app; wp-plugin-bluehost when bundled into Bluehost (see webpack DefinePlugin). */
const TEXT_DOMAIN =
	process.env.NFD_INSIGHTS_TEXT_DOMAIN || 'wp-module-insights';

/**
 * PageSpeed-style score tier legend (shared by Insights report content and Bluehost embeds).
 *
 * @param {Object}  props
 * @param {boolean} [props.hideNoDataTier] When true, omits the gray “No Data” swatch (e.g. wp-admin dashboard widget).
 */
const LighthouseScoreLegend = ( { hideNoDataTier = false } = {} ) => (
	<div className="nfd-mb-8 nfd-flex nfd-flex-wrap nfd-items-center nfd-justify-center nfd-gap-6 nfd-text-sm nfd-text-gray-500">
		<div className="nfd-flex nfd-items-center nfd-gap-2">
			<span className="nfd-h-3 nfd-w-3 nfd-rounded-full nfd-bg-[#0cce6b]"></span>
			<span>
				{ __( 'Good:', TEXT_DOMAIN ) } &gt; 90
			</span>
		</div>
		<div className="nfd-flex nfd-items-center nfd-gap-2">
			<span className="nfd-h-3 nfd-w-3 nfd-rounded-full nfd-bg-[#ffa400]"></span>
			<span>
				{ __( 'Needs Improvement: 50 – 89', TEXT_DOMAIN ) }
			</span>
		</div>
		<div className="nfd-flex nfd-items-center nfd-gap-2">
			<span className="nfd-h-3 nfd-w-3 nfd-rounded-full nfd-bg-[#ff4e42]"></span>
			<span>
				{ __( 'Poor:', TEXT_DOMAIN ) } &lt; 50
			</span>
		</div>
		{ ! hideNoDataTier && (
			<div className="nfd-flex nfd-items-center nfd-gap-2">
				<span className="nfd-h-3 nfd-w-3 nfd-rounded-full nfd-bg-[#AEB9C6]"></span>
				<span>{ __( 'No Data', TEXT_DOMAIN ) }</span>
			</div>
		) }
	</div>
);

export default LighthouseScoreLegend;
