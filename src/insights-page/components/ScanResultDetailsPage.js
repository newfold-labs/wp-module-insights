import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ScanDiagnostic from './ScanDiagnostics';

const ScanResultDetailsPage = () => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://wp.lndo.site/content/uploads/result.json');

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const json = await response.json();
            setDetails(json);
        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, []);

    const audits = !details ? [] : Object.keys(details?.audits || {})
        .filter(auditKey => {
            const audit = details.audits[auditKey];
            return audit.score !== null && audit.score < 1;
        })
        .map(key => details.audits[key]);

    if (loading) {
        return (
            <div className="nfd-p-6 nfd-flex nfd-justify-center nfd-items-center nfd-h-64">
                <div className="nfd-text-gray-500">{__('Loading scan details...', 'wp-module-insights')}</div>
            </div>
        );
    }

    return (
        <div className="nfd-max-w-[900px] nfd-mx-auto nfd-mt-[3rem]">
            <div className="nfd-flex nfd-justify-between nfd-items-center nfd-border-b nfd-border-gray-100">
                <h1 className="nfd-text-2xl nfd-font-bold nfd-text-gray-900">
                    {__('Scan Result Details', 'wp-module-insights')}
                </h1>
                <div className="nfd-text-sm nfd-text-gray-500">
                    {details?.fetchTime && new Date(details.fetchTime).toLocaleString()}
                </div>
            </div>

            {/* Description */}
            <div className="nfd-mb-8">
                <p className="nfd-text-gray-600">
                    {__('Below is a detailed breakdown of the issues found during the scan. Expand each item to see more details and recommendations for improvement.', 'wp-module-insights')}
                </p>
            </div>
            <ScanDiagnostic audits={audits} />
        </div>
    );
};

export default ScanResultDetailsPage;
