import { __ } from '@wordpress/i18n';
import { useInsights } from '../../context/InsightsContext';

const LATEST_VALUE = '__latest__';

const formatScanOptionLabel = ( scan ) => {
	const when = new Date( scan.createdAt ).toLocaleString();
	const perf = scan.performanceScore != null
		? Math.round( scan.performanceScore * 100 )
		: '—';
	return `${ when } · ${ perf }`;
};

const ScanReportSelector = () => {
	const {
		scansSorted,
		selectedReportJobId,
		setActiveReportJobId,
	} = useInsights();

	if ( ! scansSorted.length ) {
		return null;
	}

	return (
		<div className="nfd-flex nfd-flex-col nfd-items-stretch nfd-gap-2 sm:nfd-items-end">
			<label
				htmlFor="nfd-insights-scan-select"
				className="nfd-text-sm nfd-font-medium nfd-text-gray-700"
			>
				{ __( 'Report', 'wp-module-insights' ) }
			</label>
			<select
				id="nfd-insights-scan-select"
				className="nfd-form-select nfd-block nfd-w-full sm:nfd-w-auto nfd-min-w-[240px] nfd-pl-3 nfd-pr-10 nfd-py-2 nfd-text-base nfd-border-gray-300 focus:nfd-outline-none focus:nfd-ring-blue-500 focus:nfd-border-blue-500 sm:nfd-text-sm nfd-rounded-md"
				value={ selectedReportJobId === null ? LATEST_VALUE : String( selectedReportJobId ) }
				onChange={ ( e ) => {
					const v = e.target.value;
					setActiveReportJobId( v === LATEST_VALUE ? null : v );
				} }
			>
				<option value={ LATEST_VALUE }>
					{ __( 'Latest scan (updates when new results arrive)', 'wp-module-insights' ) }
				</option>
				{ scansSorted.map( ( scan ) => (
					<option key={ scan.jobId } value={ String( scan.jobId ) }>
						{ formatScanOptionLabel( scan ) }
					</option>
				) ) }
			</select>
		</div>
	);
};

export default ScanReportSelector;
