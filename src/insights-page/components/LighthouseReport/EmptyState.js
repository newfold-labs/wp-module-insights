import { __ } from '@wordpress/i18n';
import { ReactComponent as LighthouseEmptyStateIcon } from '../../../../assets/icons/empty-state-insights.svg';
import { Button } from '@newfold/ui-component-library';
import { useInsights } from '../../context/InsightsContext';

const EmptyState = () => {
    const { triggerScan } = useInsights();

    return (
        <>
            <div className="nfd-flex nfd-flex-col nfd-items-center nfd-justify-center nfd-py-2 nfd-text-center nfd--mt-8">
                <LighthouseEmptyStateIcon className="nfd-w-[40%] nfd-min-w-[200px] nfd-max-w-[300px]" />
                <h3 className="nfd-text-base nfd-font-medium nfd-text-gray-900 nfd-mb-1 nfd-mt-8">
                    {__('No insights yet.', 'wp-module-insights')}
                </h3>
                <p className="nfd-text-sm nfd-text-gray-500 nfd-max-w-lg nfd-mt-1">
                    {__('Run your first test to generate performance, accessibility, and SEO data.', 'wp-module-insights')}
                </p>
            </div>
            <div className="nfd-flex nfd-justify-center nfd-mt-2 nfd-mb-4">
                <Button
                    onClick={triggerScan}
                    className="nfd-px-4 nfd-py-2 nfd-bg-gray-900 nfd-text-white nfd-text-sm nfd-font-medium nfd-rounded-md hover:nfd-bg-gray-800 focus:nfd-outline-none focus:nfd-ring-2 focus:nfd-ring-offset-2 focus:nfd-ring-gray-900"
                >
                    {__('Run Your First Test', 'wp-module-insights')}
                </Button>
            </div>
        </>
    );
};

export default EmptyState;

