import { __ } from '@wordpress/i18n';
import LighthouseReport from './LighthouseReport';
import PerformanceScans from './PerformanceScans';
import { InsightsProvider } from '../context/InsightsContext';
import Header from './Header';
import Content from './Content';

const InsightsPage = () => {
	return (
		<InsightsProvider>
			<div className="nfd-insights-page nfd-p-8 nfd-max-w-[900px] nfd-mx-auto">
				<div className="nfd-mb-8">
					<Header />
				</div>
				<Content />
			</div>
		</InsightsProvider>
	);
};

export default InsightsPage;
