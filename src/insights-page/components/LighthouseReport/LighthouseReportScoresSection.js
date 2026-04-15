import { __ } from '@wordpress/i18n';
import ScoreGauge from './ScoreGauge';

/** @type {string} See LighthouseScoreLegend.js */
const TEXT_DOMAIN =
	process.env.NFD_INSIGHTS_TEXT_DOMAIN || 'wp-module-insights';

/**
 * @param {Object} props
 * @param {Object} props.report Performance scan row with category scores 0–1.
 */
const LighthouseReportScoresSection = ( { report } ) => {
	const scores = [
		{
			label: __( 'Performance', TEXT_DOMAIN ),
			score: Math.round( report.performanceScore * 100 ),
		},
		{
			label: __( 'Accessibility', TEXT_DOMAIN ),
			score: Math.round( report.accessibilityScore * 100 ),
		},
		{
			label: __( 'Best Practices', TEXT_DOMAIN ),
			score: Math.round( report.bestPracticesScore * 100 ),
		},
		{
			label: __( 'SEO', TEXT_DOMAIN ),
			score: Math.round( report.seoScore * 100 ),
		},
	];

	const gauges = scores.map( ( item, index ) => (
		<ScoreGauge key={ index } { ...item } />
	) );

	return (
		<div className="nfd-mb-8 nfd-grid nfd-grid-cols-2 nfd-gap-8 md:nfd-grid-cols-4">
			{ gauges }
		</div>
	);
};

export default LighthouseReportScoresSection;
