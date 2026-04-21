import { __ } from '@wordpress/i18n';

/**
 * Legend matching PageSpeed Insights score tiers (good / needs improvement / poor / no data).
 */
const PageSpeedScoreLegend = () => (
	<div
		className="nfd-mt-8 nfd-flex nfd-flex-wrap nfd-items-center nfd-justify-center nfd-gap-x-6 nfd-gap-y-3 nfd-text-xs nfd-text-gray-600"
		role="list"
	>
		<div className="nfd-flex nfd-items-center nfd-gap-2" role="listitem">
			<span className="nfd-h-2.5 nfd-w-2.5 nfd-shrink-0 nfd-rounded-full nfd-bg-[#0cce6b]" aria-hidden />
			<span>{ __( 'Good: 90–100', 'wp-module-insights' ) }</span>
		</div>
		<div className="nfd-flex nfd-items-center nfd-gap-2" role="listitem">
			<span className="nfd-h-2.5 nfd-w-2.5 nfd-shrink-0 nfd-rounded-full nfd-bg-[#ffa400]" aria-hidden />
			<span>{ __( 'Needs improvement: 50–89', 'wp-module-insights' ) }</span>
		</div>
		<div className="nfd-flex nfd-items-center nfd-gap-2" role="listitem">
			<span className="nfd-h-2.5 nfd-w-2.5 nfd-shrink-0 nfd-rounded-full nfd-bg-[#ff4e42]" aria-hidden />
			<span>{ __( 'Poor: 0–49', 'wp-module-insights' ) }</span>
		</div>
	</div>
);

export default PageSpeedScoreLegend;
