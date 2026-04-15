import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';
import ScanDiagnostic from './ScanDiagnostics';
import { Spinner } from '@newfold/ui-component-library';
import { REPORT_QUERY_KEY } from '../constants';

const Heading = ({ details, backToInsightsUrl }) => {
	return <>
		{ backToInsightsUrl && (
			<div className="nfd-mb-4">
				<a
					href={ backToInsightsUrl }
					className="nfd-inline-flex nfd-items-center nfd-gap-1 nfd-text-sm nfd-font-medium nfd-text-blue-600 nfd-no-underline hover:nfd-underline"
				>
					{ __( 'Back to Site Insights', 'wp-module-insights' ) }
				</a>
			</div>
		) }
		<div className="nfd-flex nfd-justify-between nfd-items-center nfd-border-b nfd-border-gray-100">
			<h1 className="nfd-text-2xl nfd-font-bold nfd-text-gray-900">
				{__('Scan Result Details', 'wp-module-insights')}
			</h1>
			{
				details &&
				<div className="nfd-text-sm nfd-text-gray-500">
					{details?.fetchTime && new Date(details.fetchTime).toLocaleString()}
				</div>
			}
		</div>
		<div className="nfd-mb-8">
			<p className="nfd-text-gray-600">
				{__('Below is a detailed breakdown of the issues found during the scan. Expand each item to see more details and recommendations for improvement.', 'wp-module-insights')}
			</p>
		</div>
	</>

}

const ScanResultDetailsPage = ({ scanId }) => {
	const [details, setDetails] = useState(null);
	const [loading, setLoading] = useState(true);

	const backToInsightsUrl = useMemo( () => {
		if ( ! scanId ) {
			return null;
		}
		return addQueryArgs(
			removeQueryArgs( window.location.href, 'scan-result' ),
			{ [ REPORT_QUERY_KEY ]: String( scanId ) }
		);
	}, [ scanId ] );

	useEffect(() => {
		if (!scanId) {
			setLoading(false);
			return;
		}

		setLoading(true);
		apiFetch({
			path: `/newfold-insights/v1/performance-scans/scan-details?jobId=${scanId}`,
		})
			.then(setDetails)
			.catch((error) => console.error('Error fetching details:', error))
			.finally(() => setLoading(false));
	}, [scanId]);

	const audits = !details ? [] : Object.keys(details?.audits || {})
		.filter(auditKey => {
			const audit = details.audits[auditKey];
			return audit.score !== null && audit.score < 1;
		})
		.map(key => details.audits[key]);

	if (loading) {
		return (
			<div className="nfd-max-w-[900px] nfd-mx-auto nfd-mt-[3rem]">
				<Heading backToInsightsUrl={ backToInsightsUrl } />
				<Spinner />
			</div>
		);
	}

	return (
		<div className="nfd-max-w-[900px] nfd-mx-auto nfd-mt-[3rem]">
			<Heading details={details} backToInsightsUrl={ backToInsightsUrl } />
			<ScanDiagnostic audits={audits} />
		</div>
	);
};

export default ScanResultDetailsPage;
