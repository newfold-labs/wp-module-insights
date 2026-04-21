import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Accordion from './common/Accordion';

const formatValue = (value, type) => {
    if (value === undefined || value === null) return '';
    switch (type) {
        case 'bytes':
            return `${(value / 1024).toFixed(1)} KiB`;
        case 'ms':
        case 'timespanMs':
            return `${Math.round(value)} ms`;
        case 'url':
            // If the value is a string that looks like a URL, truncate it for display
            if (typeof value === 'string' && value.length > 50) {
                return <span title={value}>{value.substring(0, 50)}...</span>;
            }
            return value;
        case 'code':
            if (!value) return '';
            return <code>{value}</code>;
        case 'source-location':
            if (value.url) {
                return <a href={value.url} target="_blank" rel="noopener noreferrer" className="nfd-text-blue-600 nfd-hover:underline">
                    {value.url}: {value.line}:{value.column}
                </a>
            }
            return '';
        case 'node':
            return value.nodeLabel || value.snippet || '';
        default:
            if (typeof value === 'object' && value !== null) {
                return JSON.stringify(value);
            }
            return value;
    }
};

const renderDetails = (details) => {
    if (!details || !details.items || details.items.length === 0) return null;

    if (details.type === 'table' || details.type === 'opportunity') {
        return (
            <div className="nfd-mt-4 nfd-overflow-x-auto">
                <table className="nfd-w-full nfd-text-left nfd-border-collapse nfd-text-sm">
                    <thead>
                        <tr className="nfd-border-b nfd-border-solid nfd-border-gray-200">
                            {details.headings.map((heading, index) => (
                                <th key={index} className="nfd-py-2 nfd-pr-4 nfd-font-normal nfd-text-gray-600 first:nfd-pl-2">
                                    {heading.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {details.items.map((item, rowIndex) => {
                            const hasSubItems = item.subItems && item.subItems.items && item.subItems.items.length > 0;

                            // Check raw values for empty content to avoid rendering empty rows
                            const isRowEmpty = details.headings.every(heading => {
                                const val = item[heading.key];
                                if (val === undefined || val === null) return true;
                                if (typeof val === 'string' && val.trim() === '') return true;
                                if (heading.valueType === 'node' && (!val || (!val.nodeLabel && !val.snippet))) return true;
                                if (heading.valueType === 'code' && !val) return true;
                                if (heading.valueType === 'source-location' && (!val || !val.url)) return true;
                                // For other types, if it's truthy, assume it has content
                                return false;
                            });

                            if (isRowEmpty && !hasSubItems) {
                                return null;
                            }

                            return (
                                <Fragment key={rowIndex}>
                                    <tr
                                        key={`item-${rowIndex}-main`}
                                        className={`nfd-border-b nfd-border-solid nfd-border-gray-100 last:nfd-border-0 ${hasSubItems ? 'nfd-bg-gray-50' : 'hover:nfd-bg-gray-50'}`}
                                    >
                                        {details.headings.map((heading, colIndex) => {
                                            let value = item[heading.key];
                                            const isUrl = heading.valueType === 'url';

                                            return (
                                                <td key={colIndex} className={`nfd-py-2 nfd-pr-4 nfd-align-top first:nfd-pl-2 ${isUrl ? 'nfd-break-all' : ''} ${hasSubItems && colIndex === 0 ? 'nfd-font-medium nfd-text-gray-900' : ''}`}>
                                                    {formatValue(value, heading.valueType)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    {hasSubItems && item.subItems.items.map((subItem, subIndex) => (
                                        <Fragment key={`${rowIndex}-sub-${subIndex}`}>
                                            {(() => {
                                                // Determine values for this sub-row to check emptiness
                                                const subItemValues = details.headings.map(heading => {
                                                    const key = heading.subItemsHeading ? heading.subItemsHeading.key : heading.key;
                                                    const val = subItem[key];
                                                    // If value type differs for subitem, we might need to handle that, but usually formatValue can take the type from heading or subItemsHeading
                                                    const type = heading.subItemsHeading ? heading.subItemsHeading.valueType : heading.valueType;
                                                    return formatValue(val, type);
                                                });

                                                const isSubRowEmpty = subItemValues.every(val => !val || (typeof val === 'string' && val.trim() === ''));

                                                if (isSubRowEmpty) return null;

                                                return (
                                                    <tr
                                                        key={`item-${rowIndex}-sub-${subIndex}`}
                                                        className="nfd-border-b nfd-border-solid nfd-border-gray-100 last:nfd-border-0 hover:nfd-bg-gray-50"
                                                    >
                                                        {details.headings.map((heading, colIndex) => {
                                                            const key = heading.subItemsHeading ? heading.subItemsHeading.key : heading.key;
                                                            let value = subItem[key];
                                                            const valueType = heading.subItemsHeading ? heading.subItemsHeading.valueType : heading.valueType;

                                                            const isFirstCol = colIndex === 0;
                                                            const isUrl = valueType === 'url';

                                                            return (
                                                                <td key={colIndex} className={`nfd-py-2 nfd-pr-4 nfd-align-top ${isFirstCol ? 'nfd-pl-8' : ''} ${isUrl ? 'nfd-break-all' : ''}`}>
                                                                    {formatValue(value, valueType)}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })()}
                                        </Fragment>
                                    ))}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }
    return null;
};

const ScanDiagnostic = ({ audits }) => {
    return (
        <section
            className="nfd-mt-2 nfd-rounded-xl nfd-border nfd-border-gray-200 nfd-bg-white nfd-p-6 nfd-shadow-sm"
            aria-labelledby="nfd-scan-diagnostics-heading"
        >
            <h2
                id="nfd-scan-diagnostics-heading"
                className="nfd-mb-1 nfd-text-lg nfd-font-semibold nfd-text-gray-900"
            >
                { __( 'Diagnostics', 'wp-module-insights' ) }
            </h2>
            <p className="nfd-mb-6 nfd-text-sm nfd-text-gray-600">
                { __(
                    'Issues that affected your scores. Expand an item for the full audit and data.',
                    'wp-module-insights'
                ) }
            </p>
            <div className="nfd-flex nfd-flex-col nfd-rounded-lg nfd-border nfd-border-gray-200 nfd-overflow-hidden">
                { audits.length > 0 ? (
                    audits.map( ( audit, index ) => (
                        <Accordion
                            key={ audit.id || index }
                            title={ audit.title }
                            score={ audit.score }
                            displayValue={ audit.displayValue }
                            description={ audit.description }
                        >
                            { renderDetails( audit.details ) }
                        </Accordion>
                    ) )
                ) : (
                    <div className="nfd-bg-gray-50 nfd-p-8 nfd-text-center nfd-text-sm nfd-text-gray-600">
                        { __( 'No failing audits for this run.', 'wp-module-insights' ) }
                    </div>
                ) }
            </div>
        </section>
    );
};

export default ScanDiagnostic;