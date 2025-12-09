import { __ } from '@wordpress/i18n';

const ScanResultDetailsPage = () => {
    return (
        <div className="nfd-p-6">
            <h1 className="nfd-text-2xl nfd-font-bold nfd-mb-4">
                {__('Scan Result Details', 'wp-module-insights')}
            </h1>
            <p className="nfd-text-gray-600">
                {__('This is the details page for a specific scan result.', 'wp-module-insights')}
            </p>
        </div>
    );
};

export default ScanResultDetailsPage;
