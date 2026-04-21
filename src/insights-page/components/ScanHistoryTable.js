import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { useInsights } from '../context/InsightsContext';
import {
	REPORT_QUERY_KEY,
	scrollToLighthouseReportSection,
} from '../constants';

const scoreCell = ( value ) =>
	value === null || value === undefined ? '—' : Math.round( value * 100 );

/**
 * @param {Object}  props
 * @param {boolean} [props.compact] If true, omit extra intro copy (used inside Performance Scans card).
 */
const ScanHistoryTable = ( { compact = false } = {} ) => {
	const {
		scansSorted,
		activeReportScan,
		setActiveReportJobId,
		selectedReportJobId,
	} = useInsights();

	const activateScanInReport = useCallback(
		( jobId ) => {
			setActiveReportJobId( jobId );
			scrollToLighthouseReportSection();
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
		<div>
			{ ! compact && (
				<p className="nfd-mb-4 nfd-text-sm nfd-text-gray-700">
					{ __(
						'Open the Lighthouse summary for any run, or the full diagnostics page for deep audit details.',
						'wp-module-insights'
					) }
				</p>
			) }
			<div className="nfd-overflow-x-auto">
				<table className="nfd-min-w-full nfd-border-collapse nfd-text-left nfd-text-sm">
					<thead>
						<tr className="nfd-border-b nfd-border-gray-200">
							<th
								scope="col"
								className="nfd-py-2 nfd-pr-4 nfd-font-medium nfd-text-gray-900"
							>
								{ __( 'Date', 'wp-module-insights' ) }
							</th>
							<th
								scope="col"
								className="nfd-py-2 nfd-pr-4 nfd-font-medium nfd-text-gray-900"
							>
								{ __( 'Perf.', 'wp-module-insights' ) }
							</th>
							<th
								scope="col"
								className="nfd-py-2 nfd-pr-4 nfd-font-medium nfd-text-gray-900"
							>
								{ __( 'A11y', 'wp-module-insights' ) }
							</th>
							<th
								scope="col"
								className="nfd-py-2 nfd-pr-4 nfd-font-medium nfd-text-gray-900"
							>
								{ __( 'Best', 'wp-module-insights' ) }
							</th>
							<th
								scope="col"
								className="nfd-py-2 nfd-pr-4 nfd-font-medium nfd-text-gray-900"
							>
								{ __( 'SEO', 'wp-module-insights' ) }
							</th>
							<th
								scope="col"
								className="nfd-py-2 nfd-font-medium nfd-text-gray-900"
							>
								{ __( 'Details', 'wp-module-insights' ) }
							</th>
						</tr>
					</thead>
					<tbody>
						{ scansSorted.map( ( scan ) => {
							const isActive =
								String( activeReportScan?.jobId ) ===
								String( scan.jobId );
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
										__(
											'Show scan from %s in Lighthouse Report',
											'wp-module-insights'
										),
										new Date(
											scan.createdAt
										).toLocaleString()
									) }
									className={
										isActive
											? 'nfd-cursor-pointer nfd-border-b nfd-border-gray-100 nfd-bg-gray-50 hover:nfd-bg-gray-100'
											: 'nfd-cursor-pointer nfd-border-b nfd-border-gray-100 hover:nfd-bg-gray-50'
									}
									onClick={ () =>
										activateScanInReport( scan.jobId )
									}
									onKeyDown={ ( e ) =>
										onRowKeyDown( e, scan )
									}
								>
									<td className="nfd-whitespace-nowrap nfd-py-3 nfd-pr-4 nfd-text-gray-900">
										{ new Date(
											scan.createdAt
										).toLocaleString() }
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
											className="nfd-inline-flex nfd-items-center nfd-gap-1 nfd-text-sm nfd-font-medium nfd-text-gray-800 hover:nfd-text-gray-950"
											onClick={ ( e ) =>
												e.stopPropagation()
											}
										>
											{ __(
												'Details',
												'wp-module-insights'
											) }
											<ArrowTopRightOnSquareIcon className="nfd-h-4 nfd-w-4" />
										</a>
									</td>
								</tr>
							);
						} ) }
					</tbody>
				</table>
			</div>
			{ selectedReportJobId !== null && (
				<p className="nfd-mt-4 nfd-text-sm nfd-text-gray-700">
					<button
						type="button"
						className="nfd-cursor-pointer nfd-border-0 nfd-bg-transparent nfd-p-0 nfd-font-medium nfd-text-blue-600 hover:nfd-underline"
						onClick={ () => {
							setActiveReportJobId( null );
							scrollToLighthouseReportSection();
						} }
					>
						{ __( 'Return to latest scan', 'wp-module-insights' ) }
					</button>
				</p>
			) }
		</div>
	);
};

export default ScanHistoryTable;
