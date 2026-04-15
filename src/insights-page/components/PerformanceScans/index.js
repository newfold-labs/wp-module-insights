import { useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { useInsights } from '../../context/InsightsContext';
import { externalTooltipHandler } from './Tooltip';
import { aggregateScansByDayLatest, buildInclusiveDateRangeIso } from '../../../utils';
import { getRelativePosition } from 'chart.js/helpers';

import './index.scss';

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler
);

const options = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			position: 'bottom',
			labels: {
				usePointStyle: true,
				padding: 20,
			}
		},
		tooltip: {
			enabled: false,
			position: 'average',
			external: externalTooltipHandler,
		},
	},
	scales: {
		y: {
			min: 0,
			max: 100,
			ticks: {
				stepSize: 10
			},
			grid: {
				color: '#f3f4f6'
			}
		},
		x: {
			grid: {
				display: false
			}
		}
	},
	interaction: {
		mode: 'index',
		axis: 'x',
		intersect: false,
	}
};

/** Distinct days with scan data in the selected range must exceed this to render the trend chart. */
const MIN_SCANS_FOR_CHART = 6;

/** Resolve x-axis category index from Chart.js click (handles edge points with weak hit tests). */
const resolveClickIndex = ( event, elements, chart ) => {
	if ( elements?.length ) {
		const idx = elements[ 0 ].index;
		if ( idx !== undefined && idx !== null ) {
			return idx;
		}
	}
	const pos = getRelativePosition( event, chart );
	const xScale = chart.scales.x;
	const n = chart.data.labels?.length ?? 0;
	if ( ! n || ! xScale ) {
		return null;
	}
	let bestIdx = 0;
	let bestDist = Infinity;
	for ( let i = 0; i < n; i++ ) {
		const px = xScale.getPixelForTick( i );
		const dist = Math.abs( px - pos.x );
		if ( dist < bestDist ) {
			bestDist = dist;
			bestIdx = i;
		}
	}
	let maxSpacing = 0;
	for ( let i = 1; i < n; i++ ) {
		const s = Math.abs( xScale.getPixelForTick( i ) - xScale.getPixelForTick( i - 1 ) );
		if ( s > maxSpacing ) {
			maxSpacing = s;
		}
	}
	const threshold = maxSpacing > 0 ? maxSpacing * 0.55 : Infinity;
	if ( bestDist > threshold ) {
		return null;
	}
	return bestIdx;
};

const PerformanceScans = () => {
	const [ dateRange, setDateRange ] = useState( '30' );
	const { scans, setActiveReportJobId } = useInsights();

	const days = parseInt( dateRange );
	const now = new Date();
	const rangeMaxTime = now.getTime();
	const rangeMinTime = new Date( now.getTime() - days * 24 * 60 * 60 * 1000 ).getTime();

	const filteredScans = scans.filter( scan => {
		const scanTime = new Date( scan.createdAt ).getTime();
		return scanTime >= rangeMinTime && scanTime <= rangeMaxTime;
	} );

	const aggregatedScans = aggregateScansByDayLatest( filteredScans );

	let labels = [];
	let scansMap = {};

	if ( aggregatedScans.length > 0 ) {
		const minDateStr = aggregatedScans[ 0 ].date;
		const maxDateStr = aggregatedScans[ aggregatedScans.length - 1 ].date;

		labels = buildInclusiveDateRangeIso( minDateStr, maxDateStr );

		scansMap = aggregatedScans.reduce( ( acc, scan ) => {
			acc[ scan.date ] = scan;
			return acc;
		}, {} );
	}

	const formattedLabels = labels.map( date => new Date( date ).toLocaleDateString( undefined, { month: 'short', day: 'numeric' } ) );
	const commonData = {
		fill: true,
		pointRadius: 4,
		pointHoverRadius: 6,
		/** Larger hit target so the left/right edge points still receive clicks. */
		pointHitRadius: 16,
		spanGaps: true,
	}

	const data = {
		labels: formattedLabels,
		datasets: [
			{
				...commonData,
				label: 'Performance',
				data: labels.map( date => scansMap[ date ] ? Math.round( scansMap[ date ].performanceScore * 100 ) : null ),
				borderColor: '#3b82f6',
				backgroundColor: 'rgba(59, 130, 246, 0.1)',
				pointBackgroundColor: '#3b82f6',
				pointStyle: 'circle',
			},
			{
				...commonData,
				label: 'Accessibility',
				data: labels.map( date => scansMap[ date ] ? Math.round( scansMap[ date ].accessibilityScore * 100 ) : null ),
				borderColor: '#f59e0b',
				backgroundColor: 'rgba(245, 158, 11, 0.1)',
				pointBackgroundColor: '#f59e0b',
				pointStyle: 'rect',
			},
			{
				...commonData,
				label: 'Best Practices',
				data: labels.map( date => scansMap[ date ] ? Math.round( scansMap[ date ].bestPracticesScore * 100 ) : null ),
				borderColor: '#ef4444',
				backgroundColor: 'rgba(239, 68, 68, 0.1)',
				pointBackgroundColor: '#ef4444',
				pointStyle: 'triangle',
			},
			{
				...commonData,
				label: 'SEO',
				data: labels.map( date => scansMap[ date ] ? Math.round( scansMap[ date ].seoScore * 100 ) : null ),
				borderColor: '#22c55e',
				backgroundColor: 'rgba(34, 197, 94, 0.1)',
				pointBackgroundColor: '#22c55e',
				pointStyle: 'rectRot',
			},
		],
	};

	const selectOptions = [
		{
			value: '30',
			label: __( 'Last 30 days', 'wp-module-insights' )
		},
		{
			value: '360',
			label: __( 'All time results', 'wp-module-insights' )
		}
	];

	const showChart = aggregatedScans.length > MIN_SCANS_FOR_CHART;

	const chartOptions = useMemo( () => ( {
		...options,
		layout: {
			padding: {
				left: 10,
				right: 10,
			},
		},
		onClick: ( event, elements, chart ) => {
			const index = resolveClickIndex( event, elements, chart );
			if ( index === null || index === undefined ) {
				return;
			}
			const dateKey = labels[ index ];
			if ( ! dateKey ) {
				return;
			}
			const dayData = scansMap[ dateKey ];
			if ( dayData ) {
				setActiveReportJobId( dayData.jobId ?? null );
			}
		},
		onHover: ( event, elements ) => {
			const canvas = event.native?.target;
			if ( canvas && canvas.style ) {
				canvas.style.cursor = elements.length ? 'pointer' : 'default';
			}
		},
	} ), [ labels, scansMap, setActiveReportJobId ] );

	return (
		<div className="nfd-bg-white nfd-rounded-lg nfd-shadow-sm nfd-border nfd-border-gray-200 nfd-p-6">
			<div className="nfd-flex nfd-items-center nfd-justify-between nfd-mb-6">
				<div className="nfd-flex nfd-items-center nfd-gap-2">
					<ChartBarIcon className="nfd-w-6 nfd-h-6"/>
					<h2 className="nfd-text-lg nfd-font-semibold nfd-text-gray-900">
						{ __( 'Performance Scans', 'wp-module-insights' ) }
					</h2>
				</div>
				<select
					className="nfd-form-select nfd-block nfd-w-auto nfd-pl-3 nfd-pr-10 nfd-py-2 nfd-text-base nfd-border-gray-300 focus:nfd-outline-none focus:nfd-ring-blue-500 focus:nfd-border-blue-500 sm:nfd-text-sm nfd-rounded-md"
					value={ dateRange }
					onChange={ ( e ) => setDateRange( e.target.value ) }
					options={ selectOptions }
				>
					{ selectOptions.map( option => (
						<option key={ option.value } value={ option.value }>
							{ option.label }
						</option>
					) ) }
				</select>
			</div>

			{ showChart && (
				<p className="nfd-mb-4 nfd-text-sm nfd-text-gray-600">
					{ __(
						'Click the chart on a day with scan data to load that run in the Lighthouse report and scan history above.',
						'wp-module-insights'
					) }
				</p>
			) }

			<div className="nfd-h-80 nfd-w-full">
				{ showChart ? (
					<Line options={ chartOptions } data={ data }/>
				) : (
					<div className="nfd-flex nfd-h-full nfd-items-center nfd-justify-center nfd-rounded-md nfd-border nfd-border-dashed nfd-border-gray-200 nfd-bg-gray-50 nfd-px-6 nfd-py-8">
						<p className="nfd-max-w-md nfd-text-center nfd-text-sm nfd-leading-relaxed nfd-text-gray-600">
							{ __(
								'Not enough scan history in this range to plot a trend. Choose a broader time range above, or run more scans. The chart appears when your selection includes more than six days with scan data.',
								'wp-module-insights'
							) }
						</p>
					</div>
				) }
			</div>
		</div>
	);
};

export default PerformanceScans;
