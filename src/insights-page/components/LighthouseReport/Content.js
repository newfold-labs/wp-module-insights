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
import ScoreGauge from './ScoreGauge';

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

    const scores = [
        { label: __('Performance', 'wp-module-insights'), score: Math.round(report.performanceScore * 100) },
        { label: __('Accessibility', 'wp-module-insights'), score: Math.round(report.accessibilityScore * 100) },
        { label: __('Best Practices', 'wp-module-insights'), score: Math.round(report.bestPracticesScore * 100) },
        { label: __('SEO', 'wp-module-insights'), score: Math.round(report.seoScore * 100) },
    ];

    const detailsUrl =
        report?.resultUrl && report?.jobId
            ? addQueryArgs(removeQueryArgs(window.location.href, REPORT_QUERY_KEY), {
                  'scan-result': report.jobId,
              })
            : null;

    return (
        <div>
            <div className="nfd-grid nfd-grid-cols-2 md:nfd-grid-cols-4 nfd-gap-8 nfd-mb-8">
                {scores.map((item, index) => (
                    <ScoreGauge key={index} {...item} />
                ))}
            </div>

            <div className="nfd-flex nfd-flex-wrap nfd-items-center nfd-justify-center nfd-gap-6 nfd-mb-8 nfd-text-sm nfd-text-gray-500">
                <div className="nfd-flex nfd-items-center nfd-gap-2">
                    <span className="nfd-h-3 nfd-w-3 nfd-rounded-full nfd-bg-[#0cce6b]"></span>
                    <span>Good: &gt; 90</span>
                </div>
                <div className="nfd-flex nfd-items-center nfd-gap-2">
                    <span className="nfd-h-3 nfd-w-3 nfd-rounded-full nfd-bg-[#ffa400]"></span>
                    <span>Needs Improvement: 50 - 89</span>
                </div>
                <div className="nfd-flex nfd-items-center nfd-gap-2">
                    <span className="nfd-h-3 nfd-w-3 nfd-rounded-full nfd-bg-[#ff4e42]"></span>
                    <span>Poor: &lt; 50</span>
                </div>
                <div className="nfd-flex nfd-items-center nfd-gap-2">
                    <span className="nfd-w-3 nfd-h-3 nfd-rounded-full nfd-bg-[#AEB9C6]"></span>
                    <span>No Data</span>
                </div>
            </div>

            <div className="nfd-flex nfd-flex-col nfd-items-start nfd-gap-4">
                <div className="nfd-text-sm nfd-text-gray-500 nfd-flex nfd-justify-between nfd-w-full nfd-items-center">
                    {sprintf(__('Last checked %s', 'wp-module-insights'), new Date(report.createdAt).toLocaleString())}
                    <span className="nfd-flex nfd-gap-2">
                        {
                            detailsUrl &&
                            <a
                                href={detailsUrl}
                                className="nfd-flex nfd-items-center nfd-justify-center nfd-gap-1 nfd-border-[#D1D5DC] nfd-border-[2px] nfd-border-solid nfd-px-4 nfd-py-2 nfd-bg-white nfd-text-sm nfd-font-medium nfd-no-underline nfd-text-gray-900 nfd-rounded-md hover:nfd-bg-gray-100 focus:nfd-outline-none focus:nfd-ring-2 focus:nfd-ring-offset-2 focus:nfd-ring-gray-100"
                            >
                                {__('View Detailed Report', 'wp-module-insights')}
                                <ArrowTopRightOnSquareIcon width={18} />
                            </a>
                        }
                        <Button
                            onClick={triggerScan}
                            className={classnames(
                                'nfd-flex nfd-items-center nfd-gap-2 nfd-px-6 nfd-py-3 nfd-border-0 nfd-bg-gray-900 nfd-text-white nfd-text-sm nfd-font-medium nfd-rounded-md',
                                {
                                    'nfd-opacity-50': isTryingToRun || isRunningScan,
                                    'nfd-cursor-pointer hover:nfd-bg-gray-800 focus:nfd-outline-none focus:nfd-ring-2 focus:nfd-ring-offset-2 focus:nfd-ring-gray-900': !(isTryingToRun || isRunningScan),
                                    'nfd-pl-3 nfd-cursor-progress': isTryingToRun,
                                    'nfd-cursor-not-allowed': isRunningScan,
                                }
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