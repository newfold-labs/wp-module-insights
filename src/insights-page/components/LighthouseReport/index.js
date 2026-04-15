import { __, } from '@wordpress/i18n';
import { ReactComponent as LighthouseIcon } from '../../../../assets/icons/lighthouse-logo.svg';
import EmptyState from './EmptyState';
import { useInsights } from '../../context/InsightsContext';
import Content from './Content';
import ScanReportSelector from './ScanReportSelector';

const LighthouseReport = () => {
	const { activeReportScan: report, loading, scansSorted } = useInsights();

	if (loading) {
		return <div className="nfd-p-6 nfd-text-center">{__('Loading...', 'wp-module-insights')}</div>;
	}

	return (
		<div className="nfd-bg-white nfd-rounded-lg nfd-shadow-sm nfd-border nfd-border-gray-200 nfd-p-6 nfd-mb-6">
			<div className="nfd-flex nfd-flex-col nfd-gap-4 nfd-mb-8 md:nfd-flex-row md:nfd-items-start md:nfd-justify-between">
				<div className="nfd-flex nfd-items-center nfd-gap-2">
					<LighthouseIcon className="nfd-w-6 nfd-h-6" />
					<h2 className="nfd-text-lg nfd-font-semibold nfd-text-gray-900">
						{__('Lighthouse Report', 'wp-module-insights')}
					</h2>
				</div>
				{ scansSorted.length > 1 && <ScanReportSelector /> }
			</div>
			{
				!report ?
					<EmptyState />
					:
					<Content />
			}
		</div>
	);
};

export default LighthouseReport;