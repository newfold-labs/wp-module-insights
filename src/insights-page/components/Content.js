import LighthouseReport from './LighthouseReport';
import PerformanceScans from './PerformanceScans';
import { useInsights } from '../context/InsightsContext';
import { Spinner } from '@newfold/ui-component-library';

const Content = () => {
	const { loading, scans } = useInsights();

	if ( loading ) {
		return <Spinner />;
	}

	return (
		<>
			<LighthouseReport />
			{ Array.isArray( scans ) && scans.length > 0 && (
				<PerformanceScans />
			) }
		</>
	);
};

export default Content;
