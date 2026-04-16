/* global NFD_INSIGHTS_DATA */
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';
import { REPORT_QUERY_KEY } from '../../constants';
import { Button, Spinner, ToggleField } from '@newfold/ui-component-library';
import { useInsights } from '../../context/InsightsContext';
import classnames from 'classnames';
import apiFetch from '@wordpress/api-fetch';
import { useTriggerScan } from '../../hooks/useTriggerScan';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import LighthouseReportScoresSection from './LighthouseReportScoresSection';
import LighthouseScoreLegend from './LighthouseScoreLegend';

const LighthouseReportContent = () => {
	const { activeReportScan: report } = useInsights();
	const { triggerScan, isRunningScan, isTryingToRun } = useTriggerScan();
	const [ recurringScans, setRecurringScans ] = useState(
		NFD_INSIGHTS_DATA.isRecurringScansEnabled
	);
	const [ isUpdatingRecurringScans, setIsUpdatingRecurringScans ] =
		useState( false );

	const setRecurringScansStatus = async ( status ) => {
		if ( isUpdatingRecurringScans ) {
			return;
		}

		try {
			setIsUpdatingRecurringScans( true );
			const res = await apiFetch( {
				path: '/newfold-insights/v1/performance-scans/toggle-recurring-scans',
				method: 'POST',
				data: {
					status,
				},
			} );

			if ( res?.status !== null ) {
				setRecurringScans( res.status );
			}
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Error toggling recurring scans:', error );
		} finally {
			setIsUpdatingRecurringScans( false );
		}
	};

	const detailsUrl =
		report?.resultUrl && report?.jobId
			? addQueryArgs(
					removeQueryArgs( window.location.href, REPORT_QUERY_KEY ),
					{
						'scan-result': report.jobId,
					}
			  )
			: null;

	return (
		<div>
			<LighthouseReportScoresSection report={ report } />
			<LighthouseScoreLegend />

			<div className="nfd-flex nfd-flex-col nfd-items-start nfd-gap-4">
				<div className="nfd-flex nfd-w-full nfd-flex-col nfd-items-start nfd-justify-between nfd-gap-3 sm:nfd-flex-row sm:nfd-items-center">
					<span className="nfd-text-sm nfd-text-gray-800">
						{ sprintf(
							/* translators: %s: relative time (e.g. “3 hours ago”) or short date */
							__( 'Last checked %s', 'wp-module-insights' ),
							formatRelativeTime(
								report.createdAt || report.updatedAt,
								'wp-module-insights'
							)
						) }
					</span>
					<span className="nfd-flex nfd-flex-wrap nfd-gap-2">
						{ detailsUrl && (
							<Button
								as="a"
								href={ detailsUrl }
								variant="secondary"
								className="nfd-flex nfd-items-center"
							>
								{ __(
									'View Detailed Report',
									'wp-module-insights'
								) }
							</Button>
						) }
						<Button
							variant="primary"
							onClick={ triggerScan }
							disabled={ isTryingToRun || isRunningScan }
							className={ classnames(
								'nfd-flex nfd-items-center nfd-gap-2',
								{ 'nfd-pl-3': isTryingToRun }
							) }
						>
							{ isTryingToRun && <Spinner /> }
							{ __( 'Run Test', 'wp-module-insights' ) }
						</Button>
					</span>
				</div>
				<div className="nfd-max-w-full">
					<ToggleField
						id="nfd-insights-recurring-scans"
						label={ __(
							'Enable recurring scans',
							'wp-module-insights'
						) }
						checked={ recurringScans }
						disabled={ isUpdatingRecurringScans }
						onChange={ setRecurringScansStatus }
						className={ classnames(
							'nfd-insights-recurring-toggle',
							isUpdatingRecurringScans &&
								'nfd-opacity-50 nfd-pointer-events-none'
						) }
					/>
				</div>
			</div>
		</div>
	);
};

export default LighthouseReportContent;
