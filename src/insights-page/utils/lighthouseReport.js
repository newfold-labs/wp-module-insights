/**
 * Helpers for Lighthouse JSON (LHR) returned from scan-details.
 * Supports both a bare LHR object and payloads wrapped in `lighthouseResult`.
 *
 * @param {Object|null|undefined} raw Raw JSON from the REST endpoint.
 * @return {{
 *   categories: Object,
 *   audits: Object,
 *   finalUrl: string,
 *   requestedUrl: string,
 *   fetchTime: string,
 *   configSettings: Object,
 *   lighthouseVersion: string,
 * }}
 */
export function normalizeLighthouseReport( raw ) {
	if ( ! raw || typeof raw !== 'object' ) {
		return {
			categories: {},
			audits: {},
			finalUrl: '',
			requestedUrl: '',
			fetchTime: '',
			configSettings: {},
			lighthouseVersion: '',
		};
	}
	const root =
		raw.lighthouseResult && typeof raw.lighthouseResult === 'object'
			? raw.lighthouseResult
			: raw;
	return {
		categories: root.categories && typeof root.categories === 'object' ? root.categories : {},
		audits: root.audits && typeof root.audits === 'object' ? root.audits : {},
		finalUrl: typeof root.finalUrl === 'string' ? root.finalUrl : '',
		requestedUrl: typeof root.requestedUrl === 'string' ? root.requestedUrl : '',
		fetchTime: typeof root.fetchTime === 'string' ? root.fetchTime : '',
		configSettings:
			root.configSettings && typeof root.configSettings === 'object'
				? root.configSettings
				: {},
		lighthouseVersion:
			typeof root.lighthouseVersion === 'string' ? root.lighthouseVersion : '',
	};
}

/**
 * @param {Object} categories Lighthouse categories map.
 * @param {{ key: string, label: string }[]} defs Ordered category definitions.
 * @return {{ key: string, label: string, score: number }[]}
 */
export function getCategoryScoresForDisplay( categories, defs ) {
	const out = [];
	for ( const def of defs ) {
		const cat = categories[ def.key ];
		const s = cat?.score;
		if ( typeof s !== 'number' || Number.isNaN( s ) ) {
			continue;
		}
		out.push( {
			key: def.key,
			label: def.label,
			score: Math.round( s * 100 ),
		} );
	}
	return out;
}

/** Lab metrics shown in PageSpeed-style order (subset of Lighthouse performance audits). */
export const LAB_METRIC_AUDIT_IDS = [
	'first-contentful-paint',
	'largest-contentful-paint',
	'total-blocking-time',
	'cumulative-layout-shift',
	'speed-index',
];

/**
 * @param {Object} audits Lighthouse audits map.
 * @param {string[]} ids Audit IDs to include.
 * @return {{ id: string, title: string, displayValue: string, score: number|null }[]}
 */
export function getLabMetricRows( audits, ids ) {
	const rows = [];
	for ( const id of ids ) {
		const audit = audits[ id ];
		if ( ! audit || typeof audit !== 'object' ) {
			continue;
		}
		const displayValue = formatAuditDisplayValue( audit );
		if ( displayValue === '' && audit.score === null ) {
			continue;
		}
		const score =
			typeof audit.score === 'number' && ! Number.isNaN( audit.score )
				? audit.score
				: null;
		rows.push( {
			id,
			title: typeof audit.title === 'string' ? audit.title : id,
			displayValue: displayValue || '—',
			score,
		} );
	}
	return rows;
}

/**
 * @param {Object} audit Lighthouse audit.
 * @return {string}
 */
function formatAuditDisplayValue( audit ) {
	if ( typeof audit.displayValue === 'string' && audit.displayValue.trim() !== '' ) {
		return audit.displayValue;
	}
	if ( typeof audit.numericValue === 'number' && ! Number.isNaN( audit.numericValue ) ) {
		const id = audit.id || '';
		if ( id === 'cumulative-layout-shift' ) {
			return audit.numericValue.toFixed( 3 );
		}
		return `${ Math.round( audit.numericValue ) } ms`;
	}
	return '';
}

/**
 * Audits that represent failing or partial checks (score &lt; 1), excluding not-applicable.
 *
 * @param {Object} audits Lighthouse audits map.
 * @return {Object[]}
 */
export function getFailingAuditsList( audits ) {
	const list = Object.keys( audits )
		.map( ( key ) => audits[ key ] )
		.filter( ( audit ) => {
			if ( ! audit || typeof audit !== 'object' ) {
				return false;
			}
			if ( audit.score === null || audit.score === undefined ) {
				return false;
			}
			return audit.score < 1;
		} );

	list.sort( ( a, b ) => {
		const sa = typeof a.score === 'number' ? a.score : 1;
		const sb = typeof b.score === 'number' ? b.score : 1;
		if ( sa !== sb ) {
			return sa - sb;
		}
		const ta = typeof a.title === 'string' ? a.title : '';
		const tb = typeof b.title === 'string' ? b.title : '';
		return ta.localeCompare( tb );
	} );

	return list;
}
