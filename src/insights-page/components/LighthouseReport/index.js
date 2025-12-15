import { __, } from '@wordpress/i18n';
import { ReactComponent as LighthouseIcon } from '../../../../assets/icons/lighthouse-logo.svg';
import EmptyState from './EmptyState';
import { useInsights } from '../../context/InsightsContext';
import Content from './Content'

const LighthouseReport = () => {
	const { latestScan: report, loading } = useInsights();

	if (loading) {
		return <div className="nfd-p-6 nfd-text-center">{__('Loading...', 'wp-module-insights')}</div>;
	}

	return (
		<div className="nfd-bg-white nfd-rounded-lg nfd-shadow-sm nfd-border nfd-border-gray-200 nfd-p-6 nfd-mb-6">
			<div className="nfd-flex nfd-items-center nfd-gap-2 nfd-mb-8">
				<LighthouseIcon className="nfd-w-6 nfd-h-6" />
				<h2 className="nfd-text-lg nfd-font-semibold nfd-text-gray-900">
					{__('Lighthouse Report', 'wp-module-insights')}
				</h2>
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