import { __ } from '@wordpress/i18n';
import Accordion from './common/Accordion';

const ScanDiagnostic = ({ audits }) => {
    return <div className="nfd-bg-white nfd-rounded-lg nfd-shadow-sm nfd-border nfd-border-gray-200 nfd-p-6 nfd-max-w-[900px] nfd-mx-auto nfd-mt-[3rem]">
        <div className="nfd-space-y-1">
            <h2 className="nfd-text-lg nfd-font-semibold nfd-text-gray-900 nfd-mb-4">
                {__('Diagnostics', 'wp-module-insights')}
            </h2>
            <div className="nfd-flex nfd-flex-col">
                {audits.length > 0 ? (
                    audits.map((audit, index) => (
                        <Accordion
                            key={audit.id || index}
                            title={audit.title}
                            score={audit.score}
                            description={audit.description}
                        />
                    ))
                ) : (
                    <div className="nfd-p-4 nfd-text-center nfd-text-gray-500 nfd-border nfd-border-gray-200 nfd-rounded-lg">
                        {__('No issues found.', 'wp-module-insights')}
                    </div>
                )}
            </div>
        </div>
    </div>
}

export default ScanDiagnostic;