import { useState } from '@wordpress/element';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import './style.scss';

const Accordion = ({ title, score, displayValue, description, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    const getScoreColor = (s) => {
        if (s >= 0.9) return 'nfd-bg-[#167D12]'; // Good
        if (s >= 0.5) return 'nfd-bg-[#E38407]'; // Needs Improvement
        return 'nfd-bg-[#A30013]'; // Poor
    };

    const getScoreTextColor = (s) => {
        if (s >= 0.9) return 'nfd-text-[#167D12]'; // Good
        if (s >= 0.5) return 'nfd-text-[#E38407]'; // Needs Improvement
        return 'nfd-text-[#A30013]'; // Poor
    };

    return (
        <div className={`nfd-border-b nfd-border-gray-200 ${isOpen ? 'nfd-border-solid nfd-border-gray-200' : ''}`}>
            <button
                className={`nfd-w-full nfd-flex nfd-items-center nfd-justify-between nfd-p-4 nfd-text-left nfd-border-none focus:nfd-outline-none nfd-transition-colors ${isOpen ? 'nfd-bg-gray-50' : 'nfd-bg-white hover:nfd-bg-gray-50'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="nfd-flex nfd-items-center nfd-flex-1 nfd-pr-4">
                    {score !== null && (
                        <div className={`nfd-w-3 nfd-h-3 nfd-mr-3 ${getScoreColor(score)}`}></div>
                    )}
                    <span className="nfd-font-medium nfd-text-gray-900">
                        {title}
                        {displayValue && (
                            <span className={`nfd-ml-2 nfd-text-sm ${getScoreTextColor(score)}`}>
                                — {displayValue}
                            </span>
                        )}
                    </span>
                </div>
                <div className="nfd-flex nfd-items-center nfd-gap-4">
                    {isOpen ? (
                        <ChevronUpIcon className="nfd-w-5 nfd-h-5 nfd-text-gray-500" />
                    ) : (
                        <ChevronDownIcon className="nfd-w-5 nfd-h-5 nfd-text-gray-500" />
                    )}
                </div>
            </button>
            {isOpen && (
                <div className="nfd-accordion-content nfd-p-4 nfd-bg-white nfd-text-sm nfd-text-gray-600 nfd-border-t nfd-border-gray-200">
                    <div className="nfd-prose nfd-prose-sm nfd-max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({ node, ...props }) => <p className="nfd-mb-2" {...props} />,
                                a: ({ node, ...props }) => <a className="nfd-text-blue-600 nfd-hover:underline" {...props} />,
                            }}
                        >
                            {description}
                        </ReactMarkdown>
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Accordion;
