import { __ } from '@wordpress/i18n';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { useInsights } from '../context/InsightsContext';
import { REPORT_QUERY_KEY } from '../constants';

const scoreCell = ( value ) => (
	value != null ? Math.round( value * 100 ) : '—'
);

const ScanHistoryPanel = () => {
	const {
		scansSorted,
		activeReportScan,
		setActiveReportJobId,
		selectedReportJobId,
	} = useInsights();

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
								{ __( 'Actions', 'wp-module-insights' ) }
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
									className={
										isActive
											? 'nfd-bg-gray-50 nfd-border-b nfd-border-gray-100'
											: 'nfd-border-b nfd-border-gray-100'
									}
								>
									<td className="nfd-py-3 nfd-pr-4 nfd-whitespace-nowrap nfd-text-gray-900">
										{ new Date( scan.createdAt ).toLocaleString() }
									</td>
									<td className="nfd-py-3 nfd-pr-4">{ scoreCell( scan.performanceScore ) }</td>
									<td className="nfd-py-3 nfd-pr-4">{ scoreCell( scan.accessibilityScore ) }</td>
									<td className="nfd-py-3 nfd-pr-4">{ scoreCell( scan.bestPracticesScore ) }</td>
									<td className="nfd-py-3 nfd-pr-4">{ scoreCell( scan.seoScore ) }</td>
									<td className="nfd-py-3">
										<div className="nfd-flex nfd-flex-wrap nfd-items-center nfd-gap-3">
											<button
												type="button"
												className="nfd-text-sm nfd-font-medium nfd-text-blue-600 hover:nfd-underline nfd-bg-transparent nfd-border-0 nfd-p-0 nfd-cursor-pointer"
												onClick={ () => setActiveReportJobId( scan.jobId ) }
											>
												{ __( 'Show in report', 'wp-module-insights' ) }
											</button>
											<a
												href={ diagnosticsUrl }
												className="nfd-inline-flex nfd-items-center nfd-gap-1 nfd-text-sm nfd-font-medium nfd-text-gray-700 hover:nfd-text-gray-900"
											>
												{ __( 'Diagnostics', 'wp-module-insights' ) }
												<ArrowTopRightOnSquareIcon className="nfd-w-4 nfd-h-4" />
											</a>
										</div>
									</td>
								</tr>
							);
						} ) }
					</tbody>
				</table>
			</div>
			{ selectedReportJobId !== null && (
				<p className="nfd-mt-4 nfd-text-sm nfd-text-gray-600">
					<button
						type="button"
						className="nfd-text-blue-600 hover:nfd-underline nfd-bg-transparent nfd-border-0 nfd-p-0 nfd-cursor-pointer nfd-font-medium"
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
