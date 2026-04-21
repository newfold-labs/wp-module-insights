import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';
import { Button, Spinner } from '@newfold/ui-component-library';
import ScanDiagnostic from './ScanDiagnostics';
import ScoreGauge from './LighthouseReport/ScoreGauge';
import ScanResultHeader from './scan-result-details/ScanResultHeader';
import LabMetricsCards from './scan-result-details/LabMetricsCards';
import PageSpeedScoreLegend from './scan-result-details/PageSpeedScoreLegend';
import { REPORT_QUERY_KEY } from '../constants';
import {
	getCategoryScoresForDisplay,
	getFailingAuditsList,
	getLabMetricRows,
	LAB_METRIC_AUDIT_IDS,
	normalizeLighthouseReport,
} from '../utils/lighthouseReport';

const CATEGORY_DEFS = [
	{ key: 'performance', label: __( 'Performance', 'wp-module-insights' ) },
	{ key: 'accessibility', label: __( 'Accessibility', 'wp-module-insights' ) },
	{ key: 'best-practices', label: __( 'Best Practices', 'wp-module-insights' ) },
	{ key: 'seo', label: __( 'SEO', 'wp-module-insights' ) },
];

const ScanResultDetailsPage = ( { scanId } ) => {
	const [ details, setDetails ] = useState( null );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState( null );

	const backToInsightsUrl = useMemo( () => {
		if ( ! scanId ) {
			return null;
		}
		return addQueryArgs(
			removeQueryArgs( window.location.href, 'scan-result' ),
			{ [ REPORT_QUERY_KEY ]: String( scanId ) }
		);
	}, [ scanId ] );

	const loadDetails = useCallback( async () => {
		if ( ! scanId ) {
			setLoading( false );
			setError( __( 'Missing scan identifier.', 'wp-module-insights' ) );
			return;
		}
		setLoading( true );
		setError( null );
		setDetails( null );
		try {
			const data = await apiFetch( {
				path: `/newfold-insights/v1/performance-scans/scan-details?jobId=${ encodeURIComponent(
					String( scanId )
				) }`,
			} );
			setDetails( data );
		} catch ( err ) {
			const message =
				err?.message ||
				__( 'Unable to load this scan. Try again or return to Site Insights.', 'wp-module-insights' );
			setError( message );
			setDetails( null );
			// eslint-disable-next-line no-console
			console.error( 'Scan details fetch failed:', err );
		} finally {
			setLoading( false );
		}
	}, [ scanId ] );

	useEffect( () => {
		loadDetails();
	}, [ loadDetails ] );

	const normalized = useMemo(
		() => ( details ? normalizeLighthouseReport( details ) : null ),
		[ details ]
	);

	const categoryScores = useMemo( () => {
		if ( ! normalized ) {
			return [];
		}
		return getCategoryScoresForDisplay( normalized.categories, CATEGORY_DEFS );
	}, [ normalized ] );

	const labMetrics = useMemo( () => {
		if ( ! normalized?.audits ) {
			return [];
		}
		return getLabMetricRows( normalized.audits, LAB_METRIC_AUDIT_IDS );
	}, [ normalized ] );

	const failingAudits = useMemo( () => {
		if ( ! normalized?.audits ) {
			return [];
		}
		return getFailingAuditsList( normalized.audits );
	}, [ normalized ] );

	const displayUrl =
		normalized?.finalUrl || normalized?.requestedUrl || '';
	const formFactor =
		normalized?.configSettings?.formFactor ||
		normalized?.configSettings?.emulatedFormFactor ||
		'';

	return (
		<div className="nfd-max-w-6xl nfd-mx-auto nfd-px-4 nfd-pt-6 nfd-pb-12">
			<ScanResultHeader
				backToInsightsUrl={ backToInsightsUrl }
				displayUrl={ displayUrl }
				fetchTime={ normalized?.fetchTime || '' }
				formFactor={ formFactor }
				lighthouseVersion={ normalized?.lighthouseVersion || '' }
			/>

			{ loading && (
				<div className="nfd-flex nfd-justify-center nfd-py-16">
					<Spinner />
				</div>
			) }

			{ ! loading && error && (
				<div
					className="nfd-mb-8 nfd-rounded-lg nfd-border nfd-border-red-200 nfd-bg-red-50 nfd-p-4 nfd-text-sm nfd-text-red-900"
					role="alert"
				>
					<p className="nfd-m-0 nfd-font-medium">{ error }</p>
					<div className="nfd-mt-3 nfd-flex nfd-flex-wrap nfd-gap-3">
						<Button
							onClick={ loadDetails }
							disabled={ loading }
							className="nfd-border-0 nfd-bg-gray-900 nfd-px-4 nfd-py-2 nfd-text-sm nfd-font-medium nfd-text-white nfd-rounded-md hover:nfd-bg-gray-800 focus:nfd-outline-none focus:nfd-ring-2 focus:nfd-ring-offset-2 focus:nfd-ring-gray-900 disabled:nfd-opacity-50"
						>
							{ __( 'Retry', 'wp-module-insights' ) }
						</Button>
						{ backToInsightsUrl && (
							<a
								href={ backToInsightsUrl }
								className="nfd-inline-flex nfd-items-center nfd-text-sm nfd-font-medium nfd-text-blue-800 nfd-underline"
							>
								{ __( 'Back to Site Insights', 'wp-module-insights' ) }
							</a>
						) }
					</div>
				</div>
			) }

			{ ! loading && ! error && normalized && (
				<>
					{ categoryScores.length > 0 && (
						<section
							className="nfd-mb-6 nfd-rounded-xl nfd-border nfd-border-gray-200 nfd-bg-white nfd-p-6 nfd-shadow-sm"
							aria-labelledby="nfd-category-scores-heading"
						>
							<h2
								id="nfd-category-scores-heading"
								className="nfd-mb-6 nfd-text-lg nfd-font-semibold nfd-text-gray-900"
							>
								{ __( 'Scores', 'wp-module-insights' ) }
							</h2>
							<div className="nfd-grid nfd-grid-cols-2 nfd-justify-items-center nfd-gap-8 md:nfd-grid-cols-4">
								{ categoryScores.map( ( item ) => (
									<ScoreGauge
										key={ item.key }
										label={ item.label }
										score={ item.score }
									/>
								) ) }
							</div>
							<PageSpeedScoreLegend />
						</section>
					) }

					<LabMetricsCards metrics={ labMetrics } />

					<ScanDiagnostic audits={ failingAudits } />
				</>
			) }
		</div>
	);
};

export default ScanResultDetailsPage;
