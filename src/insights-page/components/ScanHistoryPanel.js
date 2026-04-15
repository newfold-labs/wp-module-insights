import { useState, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { useInsights } from '../context/InsightsContext';
import { LIGHTHOUSE_REPORT_SECTION_ID, REPORT_QUERY_KEY } from '../constants';

const scoreCell = ( value ) => (
	value != null ? Math.round( value * 100 ) : '—'
);

const scrollToLighthouseReport = () => {
	document.getElementById( LIGHTHOUSE_REPORT_SECTION_ID )?.scrollIntoView( {
		behavior: 'smooth',
		block: 'start',
	} );
};

const ScanHistoryPanel = () => {
	const {
		scansSorted,
		activeReportScan,
		setActiveReportJobId,
		selectedReportJobId,
	} = useInsights();

	const [ historyVisible, setHistoryVisible ] = useState( false );

	const activateScanInReport = useCallback(
		( jobId ) => {
			setActiveReportJobId( jobId );
			scrollToLighthouseReport();
		},
		[ setActiveReportJobId ]
	);

	const onRowKeyDown = useCallback(
		( event, scan ) => {
			if ( event.key === 'Enter' || event.key === ' ' ) {
				event.preventDefault();
				activateScanInReport( scan.jobId );
			}
		},
		[ activateScanInReport ]
	);

	if ( ! scansSorted.length ) {
		return null;
	}

	return (
		<div className="nfd-bg-white nfd-rounded-lg nfd-shadow-sm nfd-border nfd-border-gray-200 nfd-p-6 nfd-mb-6">
			<h2 className="nfd-text-lg nfd-font-semibold nfd-text-gray-900 nfd-mb-4">
				{ __( 'Scan history', 'wp-module-insights' ) }
			</h2>
			<p className="nfd-text-sm nfd-text-gray-600 nfd-mb-4">
				{ __(
					'Open the Lighthouse summary for any run, or the full diagnostics page for deep audit details.',
					'wp-module-insights'
				) }
			</p>
			<div className="nfd-mb-4">
				<button
					type="button"
					className="nfd-rounded-md nfd-border nfd-border-gray-300 nfd-bg-white nfd-px-4 nfd-py-2 nfd-text-sm nfd-font-medium nfd-text-gray-700 nfd-shadow-sm hover:nfd-bg-gray-50 focus:nfd-outline-none focus:nfd-ring-2 focus:nfd-ring-blue-500 focus:nfd-ring-offset-2"
					aria-expanded={ historyVisible }
					onClick={ () => setHistoryVisible( ( v ) => ! v ) }
				>
					{ historyVisible
						? __( 'Hide history', 'wp-module-insights' )
						: __( 'View history', 'wp-module-insights' ) }
				</button>
			</div>
			{ historyVisible && (
				<div className="nfd-overflow-x-auto">
					<table className="nfd-min-w-full nfd-text-left nfd-text-sm nfd-border-collapse">
						<thead>
							<tr className="nfd-border-b nfd-border-gray-200">
								<th scope="col" className="nfd-py-2 nfd-pr-4 nfd-font-medium nfd-text-gray-700">
									{ __( 'Date', 'wp-module-insights' ) }
								</th>
								<th scope="col" className="nfd-py-2 nfd-pr-4 nfd-font-medium nfd-text-gray-700">
									{ __( 'Perf.', 'wp-module-insights' ) }
								</th>
								<th scope="col" className="nfd-py-2 nfd-pr-4 nfd-font-medium nfd-text-gray-700">
									{ __( 'A11y', 'wp-module-insights' ) }
								</th>
								<th scope="col" className="nfd-py-2 nfd-pr-4 nfd-font-medium nfd-text-gray-700">
									{ __( 'Best', 'wp-module-insights' ) }
								</th>
								<th scope="col" className="nfd-py-2 nfd-pr-4 nfd-font-medium nfd-text-gray-700">
									{ __( 'SEO', 'wp-module-insights' ) }
								</th>
								<th scope="col" className="nfd-py-2 nfd-font-medium nfd-text-gray-700">
									{ __( 'Details', 'wp-module-insights' ) }
								</th>
							</tr>
						</thead>
						<tbody>
							{ scansSorted.map( ( scan ) => {
								const isActive =
									String( activeReportScan?.jobId ) === String( scan.jobId );
								const base = removeQueryArgs(
									window.location.href,
									REPORT_QUERY_KEY,
									'scan-result'
								);
								const diagnosticsUrl = addQueryArgs( base, {
									'scan-result': scan.jobId,
								} );

								return (
									<tr
										key={ scan.jobId }
										role="button"
										tabIndex={ 0 }
										aria-label={ sprintf(
											/* translators: %s: scan date/time */
											__( 'Show scan from %s in Lighthouse Report', 'wp-module-insights' ),
											new Date( scan.createdAt ).toLocaleString()
										) }
										className={
											isActive
												? 'nfd-cursor-pointer nfd-bg-gray-50 nfd-border-b nfd-border-gray-100 hover:nfd-bg-gray-100'
												: 'nfd-cursor-pointer nfd-border-b nfd-border-gray-100 hover:nfd-bg-gray-50'
										}
										onClick={ () => activateScanInReport( scan.jobId ) }
										onKeyDown={ ( e ) => onRowKeyDown( e, scan ) }
									>
										<td className="nfd-py-3 nfd-pr-4 nfd-whitespace-nowrap nfd-text-gray-900">
											{ new Date( scan.createdAt ).toLocaleString() }
										</td>
										<td className="nfd-py-3 nfd-pr-4">
											{ scoreCell( scan.performanceScore ) }
										</td>
										<td className="nfd-py-3 nfd-pr-4">
											{ scoreCell( scan.accessibilityScore ) }
										</td>
										<td className="nfd-py-3 nfd-pr-4">
											{ scoreCell( scan.bestPracticesScore ) }
										</td>
										<td className="nfd-py-3 nfd-pr-4">
											{ scoreCell( scan.seoScore ) }
										</td>
										<td className="nfd-py-3">
											<a
												href={ diagnosticsUrl }
												className="nfd-inline-flex nfd-items-center nfd-gap-1 nfd-text-sm nfd-font-medium nfd-text-gray-700 hover:nfd-text-gray-900"
												onClick={ ( e ) => e.stopPropagation() }
											>
												{ __( 'Details', 'wp-module-insights' ) }
												<ArrowTopRightOnSquareIcon className="nfd-h-4 nfd-w-4" />
											</a>
										</td>
									</tr>
								);
							} ) }
						</tbody>
					</table>
				</div>
			) }
			{ selectedReportJobId !== null && (
				<p className="nfd-mt-4 nfd-text-sm nfd-text-gray-600">
					<button
						type="button"
						className="nfd-cursor-pointer nfd-border-0 nfd-bg-transparent nfd-p-0 nfd-font-medium nfd-text-blue-600 hover:nfd-underline"
						onClick={ () => setActiveReportJobId( null ) }
					>
						{ __( 'Return to latest scan', 'wp-module-insights' ) }
					</button>
				</p>
			) }
		</div>
	);
};

export default ScanHistoryPanel;
