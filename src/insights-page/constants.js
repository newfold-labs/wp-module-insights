/**
 * Query arg for which performance scan powers the Lighthouse summary on the main Insights page.
 * Distinct from `scan-result`, which opens the full diagnostics view.
 */
export const REPORT_QUERY_KEY = 'report';

/** Anchor for scroll-into-view when choosing a scan from Scan history or Performance chart. */
export const LIGHTHOUSE_REPORT_SECTION_ID = 'nfd-insights-lighthouse-report';

/**
 * Scrolls the Site Insights Lighthouse Report card into view (smooth).
 * No-op in non-browser environments.
 */
export function scrollToLighthouseReportSection() {
	if ( typeof document === 'undefined' ) {
		return;
	}
	document.getElementById( LIGHTHOUSE_REPORT_SECTION_ID )?.scrollIntoView( {
		behavior: 'smooth',
		block: 'start',
	} );
}
