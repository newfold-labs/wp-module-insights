import { __ } from '@wordpress/i18n';
import LighthouseReport from './LighthouseReport';
import PerformanceScans from './PerformanceScans';
import { InsightsProvider } from '../context/InsightsContext';

const InsightsPage = () => {
	return (
		<InsightsProvider>
			<div className="nfd-insights-page nfd-p-8 nfd-max-w-[900px] nfd-mx-auto">
				<div className="nfd-mb-8">
					<h1 className="nfd-text-2xl nfd-font-bold nfd-text-gray-900">{__('Insights', 'wp-module-insights')}</h1>
					<p className="nfd-text-gray-500">{__('Monitor your website performance and accessibility.', 'wp-module-insights')}</p>
				</div>

				<LighthouseReport />
				<PerformanceScans />
			</div>
		</InsightsProvider>
	);
};

export default InsightsPage;
