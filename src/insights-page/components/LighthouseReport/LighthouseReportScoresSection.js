import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import ScoreGauge from './ScoreGauge';

/**
 * @param {Object}  props
 * @param {Object}  props.report              Performance scan row with category scores 0–1.
 * @param {boolean} [props.isDashboardWidget] wp-admin dashboard widget — tighter spacing.
 */
const LighthouseReportScoresSection = ( {
	report,
	isDashboardWidget = false,
} ) => {
	const scores = [
		{
			label: __( 'Performance', 'wp-module-insights' ),
			score: Math.round( report.performanceScore * 100 ),
		},
		{
			label: __( 'Accessibility', 'wp-module-insights' ),
			score: Math.round( report.accessibilityScore * 100 ),
		},
		{
			label: __( 'Best Practices', 'wp-module-insights' ),
			score: Math.round( report.bestPracticesScore * 100 ),
		},
		{
			label: __( 'SEO', 'wp-module-insights' ),
			score: Math.round( report.seoScore * 100 ),
		},
	];

	if (
		typeof report.agenticBrowsingScore === 'number' &&
		! Number.isNaN( report.agenticBrowsingScore )
	) {
		scores.push( {
			label: __( 'Agentic Browsing', 'wp-module-insights' ),
			score: Math.round( report.agenticBrowsingScore * 100 ),
		} );
	}

	const gridColsClass =
		scores.length >= 5
			? 'nfd-grid-cols-2 md:nfd-grid-cols-3 lg:nfd-grid-cols-5'
			: 'nfd-grid-cols-2 md:nfd-grid-cols-4';

	const gauges = scores.map( ( item, index ) => (
		<ScoreGauge key={ index } { ...item } />
	) );

	return (
		<div
			className={ classnames(
				'nfd-grid nfd-gap-8',
				gridColsClass,
				isDashboardWidget ? 'nfd-mb-4 nfd-py-[17px]' : 'nfd-mb-8'
			) }
		>
			{ gauges }
		</div>
	);
};

export default LighthouseReportScoresSection;
