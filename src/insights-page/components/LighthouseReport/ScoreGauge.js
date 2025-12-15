import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

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

export default ScoreGauge;
