import { useState } from '@wordpress/element';
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
import { aggregateScansByDay } from '../../../utils';

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

const PerformanceScans = () => {
	const [ dateRange, setDateRange ] = useState( '30' );
	const { scans } = useInsights();

	const days = parseInt( dateRange );
	const now = new Date();
	const rangeMaxTime = now.getTime();
	const rangeMinTime = new Date( now.getTime() - days * 24 * 60 * 60 * 1000 ).getTime();

	const filteredScans = scans.filter( scan => {
		const scanTime = new Date( scan.createdAt ).getTime();
		return scanTime >= rangeMinTime && scanTime <= rangeMaxTime;
	} );

	const aggregatedScans = aggregateScansByDay( filteredScans );

	let labels = [];
	let scansMap = {};

	if ( aggregatedScans.length > 0 ) {
		const minDateStr = aggregatedScans[ 0 ].date;
		const maxDateStr = aggregatedScans[ aggregatedScans.length - 1 ].date;

		const minDate = new Date( minDateStr );
		const maxDate = new Date( maxDateStr );

		for ( let d = new Date( minDate ); d <= maxDate; d.setDate( d.getDate() + 1 ) ) {
			labels.push( d.toISOString().slice( 0, 10 ) );
		}

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

			<div className="nfd-h-80 nfd-w-full">
				<Line options={ options } data={ data }/>
			</div>
		</div>
	);
};

export default PerformanceScans;
