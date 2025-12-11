import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { Button } from '@newfold/ui-component-library';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useInsights } from '../../context/InsightsContext';
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

ChartJS.register(ArcElement, Tooltip, Legend);

const ScoreGauge = ({ score, label, color }) => {
    const data = {
        datasets: [
            {
                data: [score, 100 - score],
                backgroundColor: [color, '#f3f4f6'],
                borderWidth: 0,
                cutout: '90%',
                circumference: 360,
                rotation: 0,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
        },
        animation: {
            animateScale: true,
            animateRotate: true
        }
    };

    return (
        <div className="nfd-flex nfd-flex-col nfd-items-center">
            <div className="nfd-relative nfd-w-[60px] nfd-h-[60px] nfd-mb-4">
                <Doughnut data={data} options={options} />
                <div className="nfd-absolute nfd-inset-0 nfd-flex nfd-items-center nfd-justify-center">
                    <span className="nfd-text-xl nfd-font-semibold nfd-text-gray-900">{score}</span>
                </div>
            </div>
            <span className="nfd-text-xs nfd-font-light nfd-text-gray-500 nfd-uppercase nfd-tracking-wide">{label}</span>
        </div>
    );
};

const LighthouseReportContent = () => {
    const { latestScan: report, triggerScan } = useInsights();

    const scores = [
        { label: __('Performance', 'wp-module-insights'), score: Math.round(report.performanceScore * 100), color: '#167D12' },
        { label: __('Accessibility', 'wp-module-insights'), score: Math.round(report.accessibilityScore * 100), color: '#167D12' },
        { label: __('Best Practices', 'wp-module-insights'), score: Math.round(report.bestPracticesScore * 100), color: '#167D12' },
        { label: __('SEO', 'wp-module-insights'), score: Math.round(report.seoScore * 100), color: '#E38407' },
    ];

    // Static UUID for now as requested
    const reportId = '123e4567-e89b-12d3-a456-426614174000';
    const reportUrl = addQueryArgs(window.location.href, { 'scan-result': reportId });

    return (
        <div>
            <div className="nfd-grid nfd-grid-cols-2 md:nfd-grid-cols-4 nfd-gap-8 nfd-mb-8">
                {scores.map((item, index) => (
                    <ScoreGauge key={index} {...item} />
                ))}
            </div>

            <div className="nfd-flex nfd-flex-wrap nfd-items-center nfd-justify-center nfd-gap-6 nfd-mb-8 nfd-text-sm nfd-text-gray-500">
                <div className="nfd-flex nfd-items-center nfd-gap-2">
                    <span className="nfd-w-3 nfd-h-3 nfd-rounded-full nfd-bg-[#167D12]"></span>
                    <span>Good: &gt; 90</span>
                </div>
                <div className="nfd-flex nfd-items-center nfd-gap-2">
                    <span className="nfd-w-3 nfd-h-3 nfd-rounded-full nfd-bg-[#E38407]"></span>
                    <span>Needs Improvement: 50 - 89</span>
                </div>
                <div className="nfd-flex nfd-items-center nfd-gap-2">
                    <span className="nfd-w-3 nfd-h-3 nfd-rounded-full nfd-bg-[#A30013]"></span>
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
                        <a
                            href={reportUrl}
                            className="nfd-flex nfd-items-center nfd-justify-center nfd-gap-1 nfd-border-[#D1D5DC] nfd-border-[2px] nfd-border-solid nfd-px-4 nfd-py-2 nfd-bg-white nfd-text-sm nfd-font-medium nfd-no-underline nfd-text-gray-900 nfd-rounded-md hover:nfd-bg-gray-100 focus:nfd-outline-none focus:nfd-ring-2 focus:nfd-ring-offset-2 focus:nfd-ring-gray-100"
                        >
                            {__('View Detailed Report', 'wp-module-insights')}
                            <ArrowTopRightOnSquareIcon width={18} />
                        </a>
                        <Button
                            onClick={triggerScan}
                            className="nfd-px-4 nfd-py-2 nfd-border-0 nfd-bg-gray-900 nfd-text-white nfd-text-sm nfd-font-medium nfd-rounded-md hover:nfd-bg-gray-800 focus:nfd-outline-none focus:nfd-ring-2 focus:nfd-ring-offset-2 focus:nfd-ring-gray-900"
                        >
                            {__('Run Test', 'wp-module-insights')}
                        </Button>
                    </span>
                </div>
                <label className="nfd-flex nfd-items-center nfd-gap-2 nfd-text-sm nfd-text-gray-700 nfd-cursor-pointer">
                    <input type="checkbox" className="!nfd-m-0" />
                    {__('Enable recurring scans', 'wp-module-insights')}
                </label>
            </div>
        </div>
    );
};

export default LighthouseReportContent;