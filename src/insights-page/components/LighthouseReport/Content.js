import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';
import { REPORT_QUERY_KEY } from '../../constants';
import { Button, Spinner } from '@newfold/ui-component-library';
import { useInsights } from '../../context/InsightsContext';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import classnames from 'classnames';
import apiFetch from '@wordpress/api-fetch';
import { useTriggerScan } from '../../hooks/useTriggerScan';
import LighthouseReportScoresSection from './LighthouseReportScoresSection';
import LighthouseScoreLegend from './LighthouseScoreLegend';

const LighthouseReportContent = () => {
    const { activeReportScan: report } = useInsights();
    const { triggerScan, isRunningScan, isTryingToRun } = useTriggerScan();
    const [recurringScans, setRecurringScans] = useState(NFD_INSIGHTS_DATA.isRecurringScansEnabled);
    const [isUpdatingRecurringScans, setIsUpdatingRecurringScans] = useState(false);

    const toggleRecurringScans = async (event) => {
        if (isUpdatingRecurringScans) {
            return false;
        }

        try {
            setIsUpdatingRecurringScans(true);
            const res = await apiFetch({
                path: '/newfold-insights/v1/performance-scans/toggle-recurring-scans',
                method: 'POST',
                data: {
                    status: event.target.checked
                }
            });

            if (res?.status !== null) {
                setRecurringScans(res.status);
            }
        } catch (error) {
            console.error('Error triggering scan:', error);
        } finally {
            setIsUpdatingRecurringScans(false)
        }
    }

    const detailsUrl =
        report?.resultUrl && report?.jobId
            ? addQueryArgs(removeQueryArgs(window.location.href, REPORT_QUERY_KEY), {
                  'scan-result': report.jobId,
              })
            : null;

    return (
        <div>
            <LighthouseReportScoresSection report={report} />
            <LighthouseScoreLegend />

            <div className="nfd-flex nfd-flex-col nfd-items-start nfd-gap-4">
                <div className="nfd-text-sm nfd-text-gray-500 nfd-flex nfd-justify-between nfd-w-full nfd-items-center">
                    {sprintf(__('Last checked %s', 'wp-module-insights'), new Date(report.createdAt).toLocaleString())}
                    <span className="nfd-flex nfd-gap-2">
                        {
                            detailsUrl &&
                            <Button
                                as="a"
                                href={detailsUrl}
                                variant="secondary"
                                className="nfd-flex nfd-items-center nfd-gap-1"
                            >
                                {__('View Detailed Report', 'wp-module-insights')}
                                <ArrowTopRightOnSquareIcon width={18} />
                            </Button>
                        }
                        <Button
                            variant="primary"
                            onClick={triggerScan}
                            disabled={isTryingToRun || isRunningScan}
                            className={classnames(
                                'nfd-flex nfd-items-center nfd-gap-2',
                                { 'nfd-pl-3': isTryingToRun }
                            )}
                        >
                            {isTryingToRun && <Spinner />}
                            {__('Run Test', 'wp-module-insights')}
                        </Button>
                    </span>
                </div>
                <label className={classnames(
                    'nfd-flex nfd-items-center nfd-gap-2 nfd-text-sm nfd-text-gray-700 nfd-cursor-pointer',
                    {
                        'nfd-opacity-50 nfd-cursor-progress': isUpdatingRecurringScans
                    }
                )}>
                    <input type="checkbox" className="!nfd-m-0" onChange={toggleRecurringScans} checked={recurringScans} />
                    {__('Enable recurring scans', 'wp-module-insights')}
                </label>
            </div>
        </div>
    );
};

export default LighthouseReportContent;