import { __ } from '@wordpress/i18n';
import LighthouseReport from './LighthouseReport';
import PerformanceScans from './PerformanceScans';
import Header from './Header';
import Content from './Content';

const InsightsPage = () => {
	return (
		<div className="nfd-insights-page nfd-p-8 nfd-max-w-[900px] nfd-mx-auto">
			<div className="nfd-mb-8">
				<Header/>
			</div>
			<Content/>
		</div>
	);
};

export default InsightsPage;
