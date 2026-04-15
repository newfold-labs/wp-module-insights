import { __ } from '@wordpress/i18n';
import { getLabMetricBarState } from '../../utils/lighthouseReport';

/**
 * @param {'good'|'ni'|'poor'} tier Tier from thresholds.
 * @return {string} Hex color for the metric value (PageSpeed palette).
 */
const tierValueColor = ( tier ) => {
	if ( tier === 'good' ) {
		return '#0cce6b';
	}
	if ( tier === 'ni' ) {
		return '#ffa400';
	}
	return '#ff4e42';
};

/**
 * PageSpeed Insights–style lab metrics: label, color-coded value, tri-segment bar, marker.
 *
 * @param {Object} props Props.
 * @param {{ id: string, title: string, displayValue: string, score: number|null, numericValue: number|null }[]} props.metrics Rows to render.
 */
const LabMetricsCards = ( { metrics } ) => {
	if ( ! metrics?.length ) {
		return null;
	}

	return (
		<section
			className="nfd-mb-6 nfd-rounded-xl nfd-border nfd-border-gray-200 nfd-bg-white nfd-p-6 nfd-shadow-sm"
			aria-labelledby="nfd-lab-metrics-heading"
		>
			<h2
				id="nfd-lab-metrics-heading"
				className="nfd-mb-1 nfd-text-lg nfd-font-semibold nfd-text-gray-900"
			>
				{ __( 'Lab metrics', 'wp-module-insights' ) }
			</h2>
			<p className="nfd-mb-8 nfd-text-sm nfd-leading-relaxed nfd-text-gray-600">
				{ __(
					'Values are from this Lighthouse run (lab environment). Bars show how each value falls within good, needs improvement, and poor ranges.',
					'wp-module-insights'
				) }
			</p>
			<div className="nfd-grid nfd-grid-cols-1 nfd-gap-x-8 nfd-gap-y-10 sm:nfd-grid-cols-2 lg:nfd-grid-cols-3">
				{ metrics.map( ( m ) => {
					const { leftPercent, tier } = getLabMetricBarState(
						m.id,
						m.numericValue,
						m.score
					);
					const valueColor = tierValueColor( tier );
					return (
						<div
							key={ m.id }
							className="nfd-min-w-0"
							role="group"
							aria-label={ `${ m.title }: ${ m.displayValue }` }
						>
							<div className="nfd-text-sm nfd-font-normal nfd-text-gray-600">
								{ m.title }
							</div>
							<div
								className="nfd-mt-1 nfd-text-2xl nfd-font-medium nfd-tabular-nums nfd-leading-tight"
								style={ { color: valueColor } }
							>
								{ m.displayValue }
							</div>
							<div className="nfd-relative nfd-mt-4">
								<div
									className="nfd-pointer-events-none nfd-absolute nfd-bottom-full nfd-left-0 nfd-z-10 nfd-mb-0 nfd-h-5 nfd-w-full"
									aria-hidden
								>
									<div
										className="nfd-absolute nfd-bottom-0 nfd-flex nfd-flex-col nfd-items-center"
										style={ {
											left: `${ leftPercent }%`,
											transform: 'translateX(-50%)',
										} }
									>
										<span className="nfd-mb-0.5 nfd-block nfd-h-2 nfd-w-2 nfd-shrink-0 nfd-rounded-full nfd-bg-gray-900" />
										<span className="nfd-block nfd-h-3 nfd-w-px nfd-shrink-0 nfd-bg-gray-900" />
									</div>
								</div>
								<div className="nfd-flex nfd-h-2 nfd-w-full nfd-overflow-hidden nfd-rounded-full nfd-shadow-inner">
									<div className="nfd-h-full nfd-min-w-0 nfd-flex-1 nfd-bg-[#0cce6b]" />
									<div className="nfd-h-full nfd-min-w-0 nfd-flex-1 nfd-bg-[#ffa400]" />
									<div className="nfd-h-full nfd-min-w-0 nfd-flex-1 nfd-bg-[#ff4e42]" />
								</div>
							</div>
						</div>
					);
				} ) }
			</div>
		</section>
	);
};

export default LabMetricsCards;
