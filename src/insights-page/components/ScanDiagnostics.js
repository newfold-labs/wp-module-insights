import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Accordion = ({ title, score, description }) => {
    const [isOpen, setIsOpen] = useState(false);

    const getScoreColor = (s) => {
        if (s >= 0.9) return 'nfd-bg-[#167D12]'; // Good
        if (s >= 0.5) return 'nfd-bg-[#E38407]'; // Needs Improvement
        return 'nfd-bg-[#A30013]'; // Poor
    };

    return (
        <div className={"nfd-border-0 nfd-border-t-[1px] nfd-border-solid nfd-border-[#ddd] nfd-overflow-hidden first:nfd-border-0"}>
            <button
                className={`nfd-w-full nfd-flex nfd-items-center nfd-justify-between nfd-p-4 nfd-text-left nfd-border-none focus:nfd-outline-none nfd-transition-colors ${isOpen ? 'nfd-bg-gray-100' : 'nfd-bg-white hover:nfd-bg-gray-100'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="nfd-font-medium nfd-text-gray-900 nfd-flex-1 nfd-pr-4">{title}</span>
                <div className="nfd-flex nfd-items-center nfd-gap-4">
                    {score !== null && (
                        <div className="nfd-flex nfd-items-center nfd-gap-2">
                            <span className={`nfd-w-3 nfd-h-3 nfd-rounded-full ${getScoreColor(score)}`}></span>
                            <span className="nfd-text-sm nfd-font-medium nfd-text-gray-600">{Math.round(score * 100)}</span>
                        </div>
                    )}
                    {isOpen ? (
                        <ChevronUpIcon className="nfd-w-5 nfd-h-5 nfd-text-gray-500" />
                    ) : (
                        <ChevronDownIcon className="nfd-w-5 nfd-h-5 nfd-text-gray-500" />
                    )}
                </div>
            </button>
            {isOpen && (
                <div className="nfd-p-4 nfd-pt-0 nfd-bg-gray-100 nfd-border-t nfd-border-gray-200 nfd-text-sm nfd-text-gray-600">
                    <div className="nfd-prose nfd-prose-sm nfd-max-w-none nfd-pr-[6rem]">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({ node, ...props }) => <span {...props} />,
                            }}
                        >
                            {description}
                        </ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
};

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