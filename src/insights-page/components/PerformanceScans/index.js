import { useState } from '@wordpress/element';
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
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { useInsights } from '../../context/InsightsContext';
import { externalTooltipHandler } from './Tooltip';
import { aggregateScansByDay } from '../../../utils';

import './index.scss';

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
            }
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
                stepSize: 10
            },
            grid: {
                color: '#f3f4f6'
            }
        },
        x: {
            grid: {
                display: false
            }
        }
    },
    interaction: {
        mode: 'index',
        axis: 'x',
        intersect: false,
    }
};

const PerformanceScans = () => {
    const [dateRange, setDateRange] = useState('7');
    const { scans } = useInsights();

    // Generate array of dates for the selected range (last 7 or 30 days)
    const dates = [];
    const days = parseInt(dateRange);

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD format
    }

    // Create a map of scans by date for easy lookup
    // We use the aggregated scans to ensure we have one entry per day if multiple exist
    const aggregatedScans = aggregateScansByDay(scans);
    const scansMap = aggregatedScans.reduce((acc, scan) => {
        acc[scan.date] = scan;
        return acc;
    }, {});

    const labels = dates.map(date => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));

    const data = {
        labels,
        datasets: [
            {
                label: 'Performance',
                data: dates.map(date => scansMap[date] ? Math.round(scansMap[date].performanceScore * 100) : null),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                pointBackgroundColor: '#3b82f6',
                pointStyle: 'circle',
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
                spanGaps: true, // Connect lines across null values if desired, or remove to show gaps
            },
            {
                label: 'Accessibility',
                data: dates.map(date => scansMap[date] ? Math.round(scansMap[date].accessibilityScore * 100) : null),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                pointBackgroundColor: '#f59e0b',
                pointStyle: 'rect',
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
                spanGaps: true,
            },
            {
                label: 'Best Practices',
                data: dates.map(date => scansMap[date] ? Math.round(scansMap[date].bestPracticeScore * 100) : null),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                pointBackgroundColor: '#ef4444',
                pointStyle: 'triangle',
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
                spanGaps: true,
            },
            {
                label: 'SEO',
                data: dates.map(date => scansMap[date] ? Math.round(scansMap[date].seoScore * 100) : null),
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                pointBackgroundColor: '#22c55e',
                pointStyle: 'rectRot',
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
                spanGaps: true,
            },
        ],
    };

    const selectOptions = [
        {
            value: '7',
            label: __('Last 7 days', 'wp-module-insights')
        },
        {
            value: '30',
            label: __('Last 30 days', 'wp-module-insights')
        }
    ];

    return (
        <div className="nfd-bg-white nfd-rounded-lg nfd-shadow-sm nfd-border nfd-border-gray-200 nfd-p-6">
            <div className="nfd-flex nfd-items-center nfd-justify-between nfd-mb-6">
                <div className="nfd-flex nfd-items-center nfd-gap-2">
                    <ChartBarIcon className="nfd-w-6 nfd-h-6" />
                    <h2 className="nfd-text-lg nfd-font-semibold nfd-text-gray-900">
                        {__('Performance Scans', 'wp-module-insights')}
                    </h2>
                </div>
                <select
                    className="nfd-form-select nfd-block nfd-w-auto nfd-pl-3 nfd-pr-10 nfd-py-2 nfd-text-base nfd-border-gray-300 focus:nfd-outline-none focus:nfd-ring-blue-500 focus:nfd-border-blue-500 sm:nfd-text-sm nfd-rounded-md"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                >
                    {selectOptions.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="nfd-h-80 nfd-w-full">
                <Line options={options} data={data} />
            </div>
        </div>
    );
};

export default PerformanceScans;
