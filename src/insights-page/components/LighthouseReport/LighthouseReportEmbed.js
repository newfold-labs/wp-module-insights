/* eslint-disable @wordpress/i18n-text-domain -- TEXT_DOMAIN from DefinePlugin for Bluehost bundle */
import { __, sprintf } from '@wordpress/i18n';
import { Button, Spinner } from '@newfold/ui-component-library';
import { NewfoldRuntime } from '@newfold/wp-module-runtime';
import classnames from 'classnames';
import { ReactComponent as LighthouseLogoIcon } from '../../../../assets/icons/lighthouse-logo.svg';
import { ReactComponent as EmptyStateInsightsIcon } from '../../../../assets/icons/empty-state-insights.svg';
import { useLighthouseInsights } from '../../hooks/useLighthouseInsights';
import { useTriggerScanEmbed } from '../../hooks/useTriggerScanEmbed';
import LighthouseReportScoresSection from './LighthouseReportScoresSection';
import LighthouseScoreLegend from './LighthouseScoreLegend';
import { formatRelativeTime } from '../../utils/formatRelativeTime';

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
	isDashboardWidget = false,
} ) => (
	<>
		<div
			className={ classnames(
				'nfd-flex nfd-flex-col nfd-items-center nfd-justify-center nfd-py-2 nfd-text-center',
				! isDashboardWidget && 'nfd--mt-8'
			) }
		>
			<EmptyStateInsightsIcon className="nfd-min-w-[200px] nfd-max-w-[300px] nfd-w-[40%]" />
			<h3 className="nfd-mb-1 nfd-mt-8 nfd-text-base nfd-font-medium nfd-text-gray-900">
				{ isRunningScan
					? __( 'Your report is being generated', TEXT_DOMAIN )
					: __( 'No insights yet.', TEXT_DOMAIN ) }
			</h3>
			<p className="nfd-mt-1 nfd-max-w-lg nfd-text-sm nfd-text-gray-700">
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
				className={ classnames( 'nfd-flex nfd-items-center nfd-gap-2', {
					'nfd-pl-3': isTryingToRun,
				} ) }
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
 * @param {boolean} [props.isDashboardWidget] Compact embed (Bluehost home / wp-admin widget).
 */
const LighthouseReportWithData = ( {
	report,
	insightsPageUrl,
	isDashboardWidget = false,
} ) => {
	const lastChecked = report.createdAt || report.updatedAt;
	const lastCheckedLabel = isDashboardWidget
		? formatRelativeTime( lastChecked, TEXT_DOMAIN )
		: new Date( lastChecked ).toLocaleString();

	return (
		<>
			<LighthouseReportScoresSection
				report={ report }
				isDashboardWidget={ isDashboardWidget }
			/>
			{ ! isDashboardWidget && <LighthouseScoreLegend /> }
			<div
				className={ classnames(
					'nfd-flex nfd-w-full nfd-flex-row nfd-items-center nfd-justify-between nfd-gap-4',
					isDashboardWidget && 'nfd-pb-[17px]'
				) }
			>
				<span className="nfd-min-w-0 nfd-flex-1 nfd-text-sm nfd-text-gray-800">
					{ sprintf(
						/* translators: %s: date/time or relative time */
						__( 'Last checked %s', TEXT_DOMAIN ),
						lastCheckedLabel
					) }
				</span>
				<Button
					as="a"
					href={ insightsPageUrl }
					variant="secondary"
					className="nfd-inline-flex nfd-shrink-0 nfd-items-center nfd-gap-1"
				>
					{ __( 'Open Site Insights', TEXT_DOMAIN ) }
				</Button>
			</div>
		</>
	);
};

/**
 * Lighthouse summary for Bluehost Home and the wp-admin dashboard widget (bundled by wp-plugin-bluehost).
 * Data + REST match the Site Insights page. Text domain is `wp-module-insights` in the Insights
 * webpack build and `wp-plugin-bluehost` when bundled into wp-plugin-bluehost (DefinePlugin).
 *
 * @param {Object}  props
 * @param {boolean} [props.isDashboardWidget] wp-admin dashboard widget (Bluehost); compact UI.
 */
const LighthouseReportEmbed = ( { isDashboardWidget = false } = {} ) => {
	const insightsHome =
		typeof window !== 'undefined' ? window.NFD_INSIGHTS_HOME : null;
	const canScan =
		( typeof window !== 'undefined' &&
			window.NewfoldRuntime?.capabilities?.canScanPerformance ===
				true ) ||
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

	const rootClassName = classnames(
		isDashboardWidget
			? 'nfd-mb-0 nfd-border-0 nfd-bg-transparent nfd-p-0 nfd-shadow-none'
			: 'nfd-mb-6 nfd-rounded-lg nfd-border nfd-border-gray-200 nfd-bg-white nfd-p-6 nfd-shadow-sm'
	);

	return (
		<div
			className={ rootClassName }
			data-cy="lighthouse-report-section"
			data-test-id="lighthouse-report-section"
		>
			{ ! isDashboardWidget && (
				<div className="nfd-mb-8 nfd-flex nfd-items-center nfd-gap-2">
					<LighthouseLogoIcon className="nfd-h-6 nfd-w-6" />
					<h2 className="nfd-text-lg nfd-font-semibold nfd-text-gray-900">
						{ __( 'Lighthouse Report', TEXT_DOMAIN ) }
					</h2>
				</div>
			) }

			{ loading && (
				<div
					className={ classnames(
						'nfd-text-center nfd-text-gray-800',
						isDashboardWidget ? 'nfd-py-2' : 'nfd-p-6'
					) }
				>
					{ __( 'Loading…', TEXT_DOMAIN ) }
				</div>
			) }

			{ ! loading && ! report && (
				<LighthouseReportEmpty
					isRunningScan={ isRunningScan }
					isTryingToRun={ isTryingToRun }
					triggerScan={ triggerScan }
					isDashboardWidget={ isDashboardWidget }
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
