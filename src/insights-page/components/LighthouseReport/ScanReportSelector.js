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
		<div className="nfd-flex nfd-flex-col nfd-items-stretch sm:nfd-items-end">
			<select
				id="nfd-insights-scan-select"
				className="nfd-form-select nfd-block nfd-w-full sm:nfd-w-auto nfd-min-w-[240px] nfd-pl-3 nfd-pr-10 nfd-py-2 nfd-text-base nfd-border-gray-300 focus:nfd-outline-none focus:nfd-ring-blue-500 focus:nfd-border-blue-500 sm:nfd-text-sm nfd-rounded-md"
				aria-label={ __(
					'Select scan for Lighthouse Report',
					'wp-module-insights'
				) }
				value={ selectedReportJobId === null ? LATEST_VALUE : String( selectedReportJobId ) }
				onChange={ ( e ) => {
					const v = e.target.value;
					setActiveReportJobId( v === LATEST_VALUE ? null : v );
				} }
			>
				<option value={ LATEST_VALUE }>
					{ __( 'Latest scan', 'wp-module-insights' ) }
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
