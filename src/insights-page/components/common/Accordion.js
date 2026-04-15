import { useState } from '@wordpress/element';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import './style.scss';

const Accordion = ({ title, score, displayValue, description, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    const getScoreTextColor = (s) => {
        if (s >= 0.9) return 'nfd-text-[#0cce6b]';
        if (s >= 0.5) return 'nfd-text-[#ffa400]';
        return 'nfd-text-[#ff4e42]';
    };

    return (
        <div className="nfd-group">
            <button
                type="button"
                aria-expanded={ isOpen }
                className={ `nfd-w-full nfd-flex nfd-items-center nfd-justify-between nfd-gap-3 nfd-border-y-0 nfd-border-r-0 nfd-border-l-4 nfd-border-solid nfd-p-4 nfd-pl-3 nfd-text-left nfd-transition-colors focus:nfd-outline-none focus-visible:nfd-ring-2 focus-visible:nfd-ring-inset focus-visible:nfd-ring-blue-500 ${
                    isOpen ? 'nfd-bg-gray-50' : 'nfd-bg-white hover:nfd-bg-gray-50'
                }` }
                style={ {
                    borderLeftColor:
                        score !== null && score !== undefined
                            ? score >= 0.9
                                ? '#0cce6b'
                                : score >= 0.5
                                    ? '#ffa400'
                                    : '#ff4e42'
                            : '#dadce0',
                } }
                onClick={ () => setIsOpen( ! isOpen ) }
            >
                <div className="nfd-flex nfd-min-w-0 nfd-items-center nfd-flex-1 nfd-pr-2">
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
                <div className="nfd-accordion-content nfd-border-t nfd-border-gray-200 nfd-bg-white nfd-p-4 nfd-text-sm nfd-text-gray-600">
                    <div className="nfd-prose nfd-prose-sm nfd-max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({ node, ...props }) => <p className="nfd-mb-2" {...props} />,
                                a: ({ node, ...props }) => <a className="nfd-text-blue-600 nfd-hover:underline" {...props} />,
                            }}
                        >
                            { description || '' }
                        </ReactMarkdown>
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Accordion;
