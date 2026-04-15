import { __, sprintf } from '@wordpress/i18n';
import { Button, Spinner } from '@newfold/ui-component-library';
import { NewfoldRuntime } from '@newfold/wp-module-runtime';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import classnames from 'classnames';
import { ReactComponent as LighthouseLogoIcon } from '../../../../assets/icons/lighthouse-logo.svg';
import { ReactComponent as EmptyStateInsightsIcon } from '../../../../assets/icons/empty-state-insights.svg';
import { useLighthouseInsights } from '../../hooks/useLighthouseInsights';
import { useTriggerScanEmbed } from '../../hooks/useTriggerScanEmbed';
import LighthouseReportScoresSection from './LighthouseReportScoresSection';
import LighthouseScoreLegend from './LighthouseScoreLegend';

/** @type {string} See LighthouseScoreLegend.js */
const TEXT_DOMAIN =
	process.env.NFD_INSIGHTS_TEXT_DOMAIN || 'wp-module-insights';

/**
 * Tools → Site Insights (`tools.php?page=nfd-insights`).
 * `NewfoldRuntime.adminUrl` is a function `(path) => admin_url + path`, not a string.
 *
 * @param {Object|null} insightsHome `window.NFD_INSIGHTS_HOME` when localized.
 * @return {string} Full admin URL.
 */
const getInsightsToolsPageUrl = ( insightsHome ) => {
	if ( typeof NewfoldRuntime?.adminUrl === 'function' ) {
		return NewfoldRuntime.adminUrl( 'tools.php?page=nfd-insights' );
	}
	const base =
		insightsHome?.adminUrl ||
		( typeof window !== 'undefined' && window.NewfoldRuntime?.admin_url ) ||
		'/wp-admin/';
	const normalized = base.endsWith( '/' ) ? base : `${ base }/`;
	return `${ normalized }tools.php?page=nfd-insights`;
};

const LighthouseReportEmpty = ( {
	isRunningScan,
	triggerScan,
	isTryingToRun,
} ) => (
	<>
		<div className="nfd-flex nfd-flex-col nfd-items-center nfd-justify-center nfd-py-2 nfd-text-center nfd--mt-8">
			<EmptyStateInsightsIcon className="nfd-min-w-[200px] nfd-max-w-[300px] nfd-w-[40%]" />
			<h3 className="nfd-mb-1 nfd-mt-8 nfd-text-base nfd-font-medium nfd-text-gray-900">
				{ isRunningScan
					? __(
							'Your report is being generated',
							TEXT_DOMAIN
					  )
					: __( 'No insights yet.', TEXT_DOMAIN ) }
			</h3>
			<p className="nfd-mt-1 nfd-max-w-lg nfd-text-sm nfd-text-gray-500">
				{ isRunningScan
					? __(
							'This usually takes a few minutes. You can refresh or come back later, results will show up once ready.',
							TEXT_DOMAIN
					  )
					: __(
							'Run your first test to generate performance, accessibility, and SEO data.',
							TEXT_DOMAIN
					  ) }
			</p>
		</div>
		<div className="nfd-mb-4 nfd-mt-2 nfd-flex nfd-justify-center">
			<Button
				variant="primary"
				onClick={ triggerScan }
				disabled={ isTryingToRun || isRunningScan }
				className={ classnames(
					'nfd-flex nfd-items-center nfd-gap-2',
					{ 'nfd-pl-3': isTryingToRun }
				) }
			>
				{ isTryingToRun && <Spinner /> }
				{ __( 'Run Scan', TEXT_DOMAIN ) }
			</Button>
		</div>
	</>
);

/**
 * @param {Object}  props
 * @param {Object}  props.report
 * @param {string}  props.insightsPageUrl
 * @param {boolean} [props.isDashboardWidget] Hides the “No Data” legend tier in the narrow wp-admin widget.
 */
const LighthouseReportWithData = ( {
	report,
	insightsPageUrl,
	isDashboardWidget = false,
} ) => {
	const lastChecked = report.createdAt || report.updatedAt;

	return (
		<div>
			<LighthouseReportScoresSection report={ report } />
			<LighthouseScoreLegend hideNoDataTier={ isDashboardWidget } />
			<div className="nfd-flex nfd-w-full nfd-flex-row nfd-items-center nfd-justify-between nfd-gap-4">
				<span className="nfd-min-w-0 nfd-flex-1 nfd-text-sm nfd-text-gray-500">
					{ sprintf(
						/* translators: %s: formatted date/time */
						__( 'Last checked %s', TEXT_DOMAIN ),
						new Date( lastChecked ).toLocaleString()
					) }
				</span>
				<Button
					as="a"
					href={ insightsPageUrl }
					variant="secondary"
					className="nfd-inline-flex nfd-shrink-0 nfd-items-center nfd-gap-1"
				>
					{ __( 'Open Site Insights', TEXT_DOMAIN ) }
					<ArrowTopRightOnSquareIcon width={ 18 } />
				</Button>
			</div>
		</div>
	);
};

/**
 * Lighthouse summary for Bluehost Home and the wp-admin dashboard widget (bundled by wp-plugin-bluehost).
 * Data + REST match the Site Insights page. Text domain is `wp-module-insights` in the Insights
 * webpack build and `wp-plugin-bluehost` when bundled into wp-plugin-bluehost (DefinePlugin).
 *
 * @param {Object}  props
 * @param {boolean} [props.isDashboardWidget] wp-admin dashboard widget (Bluehost); trims legend for space.
 */
const LighthouseReportEmbed = ( { isDashboardWidget = false } = {} ) => {
	const insightsHome =
		typeof window !== 'undefined' ? window.NFD_INSIGHTS_HOME : null;
	const canScan =
		( typeof window !== 'undefined' &&
			window.NewfoldRuntime?.capabilities?.canScanPerformance === true ) ||
		insightsHome?.canScanPerformance === true;

	const {
		latestScan: report,
		loading,
		isRunningScan,
		setIsRunningScan,
		refetch: refetchScans,
	} = useLighthouseInsights();

	const { triggerScan, isTryingToRun } = useTriggerScanEmbed(
		isRunningScan,
		setIsRunningScan,
		refetchScans
	);

	if ( ! canScan ) {
		return null;
	}

	const insightsPageUrl = getInsightsToolsPageUrl( insightsHome );

	return (
		<div
			className="nfd-mb-6 nfd-rounded-lg nfd-border nfd-border-gray-200 nfd-bg-white nfd-p-6 nfd-shadow-sm"
			data-cy="lighthouse-report-section"
			data-test-id="lighthouse-report-section"
		>
			<div className="nfd-mb-8 nfd-flex nfd-items-center nfd-gap-2">
				<LighthouseLogoIcon className="nfd-h-6 nfd-w-6" />
				<h2 className="nfd-text-lg nfd-font-semibold nfd-text-gray-900">
					{ __( 'Lighthouse Report', TEXT_DOMAIN ) }
				</h2>
			</div>

			{ loading && (
				<div className="nfd-p-6 nfd-text-center">
					{ __( 'Loading…', TEXT_DOMAIN ) }
				</div>
			) }

			{ ! loading && ! report && (
				<LighthouseReportEmpty
					isRunningScan={ isRunningScan }
					isTryingToRun={ isTryingToRun }
					triggerScan={ triggerScan }
				/>
			) }

			{ ! loading && report && (
				<LighthouseReportWithData
					report={ report }
					insightsPageUrl={ insightsPageUrl }
					isDashboardWidget={ isDashboardWidget }
				/>
			) }
		</div>
	);
};

export default LighthouseReportEmbed;
