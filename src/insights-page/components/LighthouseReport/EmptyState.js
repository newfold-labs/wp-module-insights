import { __ } from '@wordpress/i18n';
import { ReactComponent as LighthouseIcon } from '../../../../assets/icons/lighthouse-logo.svg';

const EmptyState = () => {
    return (
        <>
            <div className="nfd-flex nfd-flex-col nfd-items-center nfd-justify-center nfd-py-12 nfd-text-center">
                <div className="nfd-bg-gray-50 nfd-rounded-full nfd-p-4 nfd-mb-4">
                    <LighthouseIcon className="nfd-w-8 nfd-h-8 nfd-opacity-50 nfd-grayscale" />
                </div>
                <h3 className="nfd-text-base nfd-font-medium nfd-text-gray-900 nfd-mb-1">
                    {__('No report available', 'wp-module-insights')}
                </h3>
                <p className="nfd-text-sm nfd-text-gray-500 nfd-max-w-sm">
                    {__('Run a test to see your website performance, accessibility, best practices, and SEO scores.', 'wp-module-insights')}
                </p>
            </div>
            <div className="nfd-flex nfd-justify-center nfd-mt-6">
                <Button
                    onClick={triggerScan}
                    className="nfd-px-4 nfd-py-2 nfd-bg-gray-900 nfd-text-white nfd-text-sm nfd-font-medium nfd-rounded-md hover:nfd-bg-gray-800 focus:nfd-outline-none focus:nfd-ring-2 focus:nfd-ring-offset-2 focus:nfd-ring-gray-900"
                >
                    {__('Run Test', 'wp-module-insights')}
                </Button>
            </div>
        </>
    );
};

export default EmptyState;

