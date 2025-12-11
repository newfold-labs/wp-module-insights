import { __ } from '@wordpress/i18n';
import LighthouseReport from './LighthouseReport';
import PerformanceScans from './PerformanceScans';
import { useInsights } from '../context/InsightsContext';

const Content = () => {
	const { loading, scans } = useInsights();

	if (loading) {
		return <p>{__('Loading...', 'wp-module-insights')}</p>;
	}

	return <>
		<LighthouseReport />
		{
			Array.isArray(scans) && scans.length > 0 &&
			<PerformanceScans />
		}
	</>
}

export default Content;