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

	const gauges = scores.map( ( item, index ) => (
		<ScoreGauge key={ index } { ...item } />
	) );

	return (
		<div
			className={ classnames(
				'nfd-grid nfd-grid-cols-2 nfd-gap-8 md:nfd-grid-cols-4',
				isDashboardWidget ? 'nfd-mb-4 nfd-py-[17px]' : 'nfd-mb-8'
			) }
		>
			{ gauges }
		</div>
	);
};

export default LighthouseReportScoresSection;
