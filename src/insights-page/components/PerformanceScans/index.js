import { useState, useMemo, useEffect } from '@wordpress/element';
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
	Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
	ChartBarIcon,
	TableCellsIcon,
	ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useInsights } from '../../context/InsightsContext';
import { scrollToLighthouseReportSection } from '../../constants';
import { externalTooltipHandler } from './Tooltip';
import {
	aggregateScansByDayLatest,
	buildInclusiveDateRangeIso,
} from '../../../utils';
import { getRelativePosition } from 'chart.js/helpers';
import ScanHistoryTable from '../ScanHistoryTable';
import {
	dropdownChevronClass,
	dropdownMenuButtonClass,
	insightsMenuItemClass,
	insightsMenuItemsClass,
} from '../common/insightsDropdownMenuClasses';

import './index.scss';

/**
 * Disabled range options: do not reuse `insightsMenuItemClass` — its `bg-transparent` and
 * `hover:bg-gray-100` use Tailwind `!important` and override muted/disabled styles. Use a dedicated
 * utility set with gray-50 wash and hover/focus kept at gray-50 so there is no hover lift.
 *
 * @param {{ disabled: boolean }} bag Headless UI MenuItem render bag.
 */
const RANGE_OPTION_DISABLED_ITEM_CLASS =
	'nfd-box-border nfd-flex nfd-w-full nfd-min-w-0 nfd-max-w-full nfd-cursor-not-allowed nfd-items-center nfd-gap-2 nfd-border-0 nfd-bg-gray-50 nfd-px-3 nfd-py-2 nfd-text-left nfd-text-sm nfd-font-normal nfd-text-gray-400 nfd-italic nfd-whitespace-nowrap nfd-outline-none hover:nfd-bg-gray-50 focus:nfd-bg-gray-50 focus:nfd-outline-none';

const rangeSelectItemClassName = ( { disabled } ) =>
	disabled ? RANGE_OPTION_DISABLED_ITEM_CLASS : insightsMenuItemClass;

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
			},
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
				stepSize: 10,
			},
			grid: {
				color: '#f3f4f6',
			},
		},
		x: {
			grid: {
				display: false,
			},
		},
	},
	interaction: {
		mode: 'index',
		axis: 'x',
		intersect: false,
	},
};

/** Distinct calendar days with scan data in the selected range must exceed this to render the trend chart. */
const MIN_SCANS_FOR_CHART = 6;

/** Try 30 → 60 → all time; first range with enough distinct days wins. */
const RANGE_ORDER = [ '30', '60', 'all' ];

/**
 * @param {Array}  scans
 * @param {string} rangeKey `30` | `60` | `all`
 * @return {Array} Scans whose createdAt falls within the selected day window.
 */
const filterScansByRangeKey = ( scans, rangeKey ) => {
	if ( ! Array.isArray( scans ) ) {
		return [];
	}
	if ( rangeKey === 'all' ) {
		return scans;
	}
	const days = parseInt( rangeKey, 10 );
	const now = Date.now();
	const rangeMinTime = now - days * 24 * 60 * 60 * 1000;
	return scans.filter( ( scan ) => {
		const scanTime = new Date( scan.createdAt ).getTime();
		return scanTime >= rangeMinTime && scanTime <= now;
	} );
};

/**
 * @param {Array} scans Input scans.
 * @return {string|null} First range key in RANGE_ORDER with more than MIN_SCANS_FOR_CHART distinct days, or null.
 */
const pickFirstQualifyingRange = ( scans ) => {
	for ( const key of RANGE_ORDER ) {
		const filtered = filterScansByRangeKey( scans, key );
		if (
			aggregateScansByDayLatest( filtered ).length > MIN_SCANS_FOR_CHART
		) {
			return key;
		}
	}
	return null;
};

/**
 * @param {Array} scans Input scans.
 * @return {Record<string, boolean>} Whether each range key has enough distinct days to plot.
 */
const getRangeQualificationMap = ( scans ) => {
	const out = {};
	for ( const key of RANGE_ORDER ) {
		const filtered = filterScansByRangeKey( scans, key );
		out[ key ] =
			aggregateScansByDayLatest( filtered ).length > MIN_SCANS_FOR_CHART;
	}
	return out;
};

/**
 * Resolve x-axis category index from Chart.js click (handles edge points with weak hit tests).
 *
 * @param {import('chart.js').ChartEvent}      event    Chart event.
 * @param {import('chart.js').ActiveElement[]} elements Hit elements.
 * @param {import('chart.js').Chart}           chart    Chart instance.
 * @return {number|null} Label index for the clicked day, or null.
 */
const resolveClickIndex = ( event, elements, chart ) => {
	if ( elements?.length ) {
		const idx = elements[ 0 ].index;
		if ( idx !== undefined && idx !== null ) {
			return idx;
		}
	}
	const xScale = chart.scales.x;
	const n = chart.data.labels?.length ?? 0;
	if ( ! n || ! xScale ) {
		return null;
	}
	const pos = getRelativePosition( event, chart );
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
		const s = Math.abs(
			xScale.getPixelForTick( i ) - xScale.getPixelForTick( i - 1 )
		);
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
	const { scans, setActiveReportJobId } = useInsights();

	const qualifyingRange = useMemo(
		() =>
			Array.isArray( scans ) ? pickFirstQualifyingRange( scans ) : null,
		[ scans ]
	);

	const [ selectedRangeKey, setSelectedRangeKey ] = useState( null );
	const [ panelView, setPanelView ] = useState( 'chart' );

	const rangeQualifies = useMemo(
		() =>
			Array.isArray( scans ) ? getRangeQualificationMap( scans ) : {},
		[ scans ]
	);

	const rangeKey = selectedRangeKey ?? qualifyingRange ?? '30';
	const effectiveRangeKey =
		qualifyingRange && rangeQualifies[ rangeKey ]
			? rangeKey
			: qualifyingRange;

	useEffect( () => {
		if (
			selectedRangeKey !== null &&
			qualifyingRange &&
			! rangeQualifies[ selectedRangeKey ]
		) {
			setSelectedRangeKey( null );
		}
	}, [ selectedRangeKey, rangeQualifies, qualifyingRange ] );

	const filteredScans = useMemo( () => {
		if ( ! qualifyingRange || ! effectiveRangeKey ) {
			return [];
		}
		return filterScansByRangeKey( scans, effectiveRangeKey );
	}, [ scans, effectiveRangeKey, qualifyingRange ] );

	const aggregatedScans = useMemo(
		() => aggregateScansByDayLatest( filteredScans ),
		[ filteredScans ]
	);

	const showChart =
		Boolean( qualifyingRange ) &&
		aggregatedScans.length > MIN_SCANS_FOR_CHART;

	useEffect( () => {
		if ( ! showChart ) {
			setPanelView( 'table' );
		}
	}, [ showChart ] );

	const { chartLabels, chartScansMap, chartData } = useMemo( () => {
		if ( aggregatedScans.length === 0 ) {
			return {
				chartLabels: [],
				chartScansMap: {},
				chartData: { labels: [], datasets: [] },
			};
		}
		const minDateStr = aggregatedScans[ 0 ].date;
		const maxDateStr = aggregatedScans[ aggregatedScans.length - 1 ].date;
		const rawLabels = buildInclusiveDateRangeIso( minDateStr, maxDateStr );
		const map = aggregatedScans.reduce( ( acc, scan ) => {
			acc[ scan.date ] = scan;
			return acc;
		}, {} );
		const formattedLabels = rawLabels.map( ( date ) =>
			new Date( date ).toLocaleDateString( undefined, {
				month: 'short',
				day: 'numeric',
			} )
		);
		const commonData = {
			fill: true,
			pointRadius: 4,
			pointHoverRadius: 6,
			pointHitRadius: 16,
			spanGaps: true,
		};
		const built = {
			labels: formattedLabels,
			datasets: [
				{
					...commonData,
					label: 'Performance',
					data: rawLabels.map( ( date ) =>
						map[ date ]
							? Math.round( map[ date ].performanceScore * 100 )
							: null
					),
					borderColor: '#3b82f6',
					backgroundColor: 'rgba(59, 130, 246, 0.1)',
					pointBackgroundColor: '#3b82f6',
					pointStyle: 'circle',
				},
				{
					...commonData,
					label: 'Accessibility',
					data: rawLabels.map( ( date ) =>
						map[ date ]
							? Math.round( map[ date ].accessibilityScore * 100 )
							: null
					),
					borderColor: '#f59e0b',
					backgroundColor: 'rgba(245, 158, 11, 0.1)',
					pointBackgroundColor: '#f59e0b',
					pointStyle: 'rect',
				},
				{
					...commonData,
					label: 'Best Practices',
					data: rawLabels.map( ( date ) =>
						map[ date ]
							? Math.round( map[ date ].bestPracticesScore * 100 )
							: null
					),
					borderColor: '#ef4444',
					backgroundColor: 'rgba(239, 68, 68, 0.1)',
					pointBackgroundColor: '#ef4444',
					pointStyle: 'triangle',
				},
				{
					...commonData,
					label: 'SEO',
					data: rawLabels.map( ( date ) =>
						map[ date ]
							? Math.round( map[ date ].seoScore * 100 )
							: null
					),
					borderColor: '#22c55e',
					backgroundColor: 'rgba(34, 197, 94, 0.1)',
					pointBackgroundColor: '#22c55e',
					pointStyle: 'rectRot',
				},
			],
		};
		return {
			chartLabels: rawLabels,
			chartScansMap: map,
			chartData: built,
		};
	}, [ aggregatedScans ] );

	const selectOptions = [
		{ value: '30', label: __( 'Last 30 days', 'wp-module-insights' ) },
		{ value: '60', label: __( 'Last 60 days', 'wp-module-insights' ) },
		{ value: 'all', label: __( 'All time results', 'wp-module-insights' ) },
	];

	const chartOptions = useMemo(
		() => ( {
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
				const dateKey = chartLabels[ index ];
				if ( ! dateKey ) {
					return;
				}
				const dayData = chartScansMap[ dateKey ];
				if ( dayData ) {
					setActiveReportJobId( dayData.jobId ?? null );
					scrollToLighthouseReportSection();
				}
			},
			onHover: ( event, elements ) => {
				const canvas = event.native?.target;
				if ( canvas && canvas.style ) {
					canvas.style.cursor = elements.length
						? 'pointer'
						: 'default';
				}
			},
		} ),
		[ chartLabels, chartScansMap, setActiveReportJobId ]
	);

	if ( ! Array.isArray( scans ) || scans.length === 0 ) {
		return null;
	}

	const showChartView = showChart && panelView === 'chart';

	return (
		<div className="nfd-rounded-lg nfd-border nfd-border-gray-200 nfd-bg-white nfd-p-6 nfd-shadow-sm">
			<div className="nfd-mb-6 nfd-flex nfd-flex-wrap nfd-items-center nfd-justify-between nfd-gap-3">
				<div className="nfd-flex nfd-min-w-0 nfd-items-center nfd-gap-2">
					<ChartBarIcon className="nfd-h-6 nfd-w-6 nfd-shrink-0 nfd-text-gray-900" />
					<h2 className="nfd-text-lg nfd-font-semibold nfd-text-gray-900">
						{ __( 'Performance Scans', 'wp-module-insights' ) }
					</h2>
				</div>
				<div className="nfd-flex nfd-flex-wrap nfd-items-center nfd-justify-end nfd-gap-2">
					{ showChart && (
						<Menu
							as="div"
							className="nfd-relative nfd-inline-block nfd-text-left"
						>
							<MenuButton
								type="button"
								className={ dropdownMenuButtonClass }
								aria-label={ __(
									'Switch between chart and table view',
									'wp-module-insights'
								) }
							>
								{ panelView === 'chart' ? (
									<ChartBarIcon
										className="nfd-h-5 nfd-w-5 nfd-shrink-0"
										aria-hidden="true"
									/>
								) : (
									<TableCellsIcon
										className="nfd-h-5 nfd-w-5 nfd-shrink-0"
										aria-hidden="true"
									/>
								) }
								<ChevronDownIcon
									className={ dropdownChevronClass }
									aria-hidden="true"
								/>
							</MenuButton>
							<MenuItems
								anchor="bottom end"
								modal={ false }
								portal
								className={ insightsMenuItemsClass }
							>
								<MenuItem
									as="button"
									type="button"
									className={ insightsMenuItemClass }
									onClick={ () => setPanelView( 'chart' ) }
								>
									<ChartBarIcon
										className="nfd-h-4 nfd-w-4"
										aria-hidden="true"
									/>
									{ __( 'Chart view', 'wp-module-insights' ) }
								</MenuItem>
								<MenuItem
									as="button"
									type="button"
									className={ insightsMenuItemClass }
									onClick={ () => setPanelView( 'table' ) }
								>
									<TableCellsIcon
										className="nfd-h-4 nfd-w-4"
										aria-hidden="true"
									/>
									{ __( 'Table view', 'wp-module-insights' ) }
								</MenuItem>
							</MenuItems>
						</Menu>
					) }
					{ showChart && qualifyingRange && (
						<Menu
							as="div"
							className="nfd-relative nfd-inline-block nfd-text-left"
						>
							<MenuButton
								type="button"
								className={ dropdownMenuButtonClass }
								aria-label={ __(
									'Time range for performance trend chart',
									'wp-module-insights'
								) }
							>
								<span className="nfd-min-w-0 nfd-truncate">
									{
										selectOptions.find(
											( o ) =>
												o.value === effectiveRangeKey
										)?.label
									}
								</span>
								<ChevronDownIcon
									className={ dropdownChevronClass }
									aria-hidden="true"
								/>
							</MenuButton>
							<MenuItems
								anchor="bottom end"
								modal={ false }
								portal
								className={ insightsMenuItemsClass }
							>
								{ selectOptions.map( ( option ) => (
									<MenuItem
										key={ option.value }
										as="button"
										type="button"
										disabled={
											! rangeQualifies[ option.value ]
										}
										className={ rangeSelectItemClassName }
										onClick={ () => {
											if ( rangeQualifies[ option.value ] ) {
												setSelectedRangeKey(
													option.value
												);
											}
										} }
									>
										{ option.label }
									</MenuItem>
								) ) }
							</MenuItems>
						</Menu>
					) }
				</div>
			</div>

			{ showChartView && (
				<div className="nfd-h-80 nfd-w-full">
					<Line options={ chartOptions } data={ chartData } />
				</div>
			) }

			{ ( ! showChart || panelView === 'table' ) && (
				<ScanHistoryTable compact />
			) }
		</div>
	);
};

export default PerformanceScans;
