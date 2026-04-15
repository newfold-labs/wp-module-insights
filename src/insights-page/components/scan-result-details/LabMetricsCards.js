import { __ } from '@wordpress/i18n';

/**
 * @param {number|null} score Lighthouse audit score 0–1.
 * @return {string} CSS color for tier accent.
 */
const tierAccent = ( score ) => {
	if ( score === null || score === undefined || Number.isNaN( score ) ) {
		return '#dadce0';
	}
	if ( score >= 0.9 ) {
		return '#0cce6b';
	}
	if ( score >= 0.5 ) {
		return '#ffa400';
	}
	return '#ff4e42';
};

/**
 * Lab metrics grid (Lighthouse “Diagnose performance issues” section style).
 *
 * @param {Object} props Props.
 * @param {{ id: string, title: string, displayValue: string, score: number|null }[]} props.metrics Rows to render.
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
			<p className="nfd-mb-6 nfd-text-sm nfd-text-gray-600">
				{ __(
					'Values are from this Lighthouse run (lab environment). They complement field data when available.',
					'wp-module-insights'
				) }
			</p>
			<div className="nfd-grid nfd-grid-cols-1 nfd-gap-4 sm:nfd-grid-cols-2 lg:nfd-grid-cols-3">
				{ metrics.map( ( m ) => (
					<div
						key={ m.id }
						className="nfd-relative nfd-overflow-hidden nfd-rounded-lg nfd-border nfd-border-gray-100 nfd-bg-gray-50/80 nfd-p-4 nfd-pl-5"
						style={ { borderLeftWidth: 4, borderLeftColor: tierAccent( m.score ) } }
					>
						<div className="nfd-text-xs nfd-font-medium nfd-uppercase nfd-tracking-wide nfd-text-gray-500">
							{ m.title }
						</div>
						<div className="nfd-mt-2 nfd-text-2xl nfd-font-semibold nfd-tabular-nums nfd-text-gray-900">
							{ m.displayValue }
						</div>
					</div>
				) ) }
			</div>
		</section>
	);
};

export default LabMetricsCards;
