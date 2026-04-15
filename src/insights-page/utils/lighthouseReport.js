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
	'server-response-time',
];

/**
 * Thresholds for mapping numeric values to the tri-color bar (aligned with Lighthouse / web.dev guidance).
 * g1 = good upper bound, g2 = needs-improvement upper bound, g3 = display cap (poor zone ends here).
 *
 * @type {Record<string, { g1: number, g2: number, g3: number }>}
 */
const LAB_METRIC_BAR_THRESHOLDS = {
	'first-contentful-paint': { g1: 1800, g2: 3000, g3: 10000 },
	'largest-contentful-paint': { g1: 2500, g2: 4000, g3: 12000 },
	'total-blocking-time': { g1: 200, g2: 600, g3: 2000 },
	'cumulative-layout-shift': { g1: 0.1, g2: 0.25, g3: 1 },
	'speed-index': { g1: 3400, g2: 5800, g3: 12000 },
	'server-response-time': { g1: 800, g2: 1800, g3: 4000 },
};

/**
 * @param {number} value Raw metric value (ms or unitless for CLS).
 * @param {{ g1: number, g2: number, g3: number }} t Thresholds.
 * @return {'good'|'ni'|'poor'}
 */
function tierFromThresholds( value, t ) {
	if ( value <= t.g1 ) {
		return 'good';
	}
	if ( value <= t.g2 ) {
		return 'ni';
	}
	return 'poor';
}

/**
 * Map a metric value to marker position (0–100%) on a bar with three equal visual segments (green / orange / red).
 *
 * @param {number} value Raw metric value.
 * @param {{ g1: number, g2: number, g3: number }} t Thresholds.
 * @return {number} Percent from left (0–100).
 */
function valueToBarPercent( value, t ) {
	const v = Math.max( 0, value );
	const third = 100 / 3;
	if ( v <= t.g1 ) {
		return ( t.g1 > 0 ? ( v / t.g1 ) * third : 0 );
	}
	if ( v <= t.g2 ) {
		return third + ( ( v - t.g1 ) / ( t.g2 - t.g1 ) ) * third;
	}
	if ( v >= t.g3 ) {
		return 100;
	}
	return 2 * third + ( ( v - t.g2 ) / ( t.g3 - t.g2 ) ) * third;
}

/**
 * Marker position and tier for PageSpeed-style lab metric bars.
 *
 * @param {string} auditId Lighthouse audit id.
 * @param {number|null|undefined} numericValue Audit numeric value, if present.
 * @param {number|null|undefined} score Lighthouse audit score 0–1, used when numeric value is missing.
 * @return {{ leftPercent: number, tier: 'good'|'ni'|'poor' }}
 */
export function getLabMetricBarState( auditId, numericValue, score ) {
	const t = LAB_METRIC_BAR_THRESHOLDS[ auditId ];
	if ( ! t ) {
		return { leftPercent: 50, tier: 'ni' };
	}
	if ( typeof numericValue === 'number' && ! Number.isNaN( numericValue ) ) {
		return {
			leftPercent: Math.min( 100, Math.max( 0, valueToBarPercent( numericValue, t ) ) ),
			tier: tierFromThresholds( numericValue, t ),
		};
	}
	if ( typeof score === 'number' && ! Number.isNaN( score ) ) {
		if ( score >= 0.9 ) {
			return { leftPercent: 100 / 6, tier: 'good' };
		}
		if ( score >= 0.5 ) {
			return { leftPercent: 50, tier: 'ni' };
		}
		return { leftPercent: 100 - 100 / 6, tier: 'poor' };
	}
	return { leftPercent: 0, tier: 'good' };
}

/**
 * @param {Object} audits Lighthouse audits map.
 * @param {string[]} ids Audit IDs to include.
 * @return {{ id: string, title: string, displayValue: string, score: number|null, numericValue: number|null }[]}
 */
export function getLabMetricRows( audits, ids ) {
	const rows = [];
	for ( const id of ids ) {
		const audit = audits[ id ];
		if ( ! audit || typeof audit !== 'object' ) {
			continue;
		}
		const displayValue = formatAuditDisplayValue( audit, id );
		if ( displayValue === '' && audit.score === null ) {
			continue;
		}
		const score =
			typeof audit.score === 'number' && ! Number.isNaN( audit.score )
				? audit.score
				: null;
		const numericValue =
			typeof audit.numericValue === 'number' && ! Number.isNaN( audit.numericValue )
				? audit.numericValue
				: null;
		rows.push( {
			id,
			title: typeof audit.title === 'string' ? audit.title : id,
			displayValue: displayValue || '—',
			score,
			numericValue,
		} );
	}
	return rows;
}

/**
 * @param {Object} audit Lighthouse audit.
 * @param {string} [auditId] Audit key when `audit.id` may be absent.
 * @return {string}
 */
function formatAuditDisplayValue( audit, auditId ) {
	const id = typeof audit.id === 'string' ? audit.id : auditId || '';
	if ( id === 'server-response-time' && typeof audit.numericValue === 'number' && ! Number.isNaN( audit.numericValue ) ) {
		return `${ Math.round( audit.numericValue ) } ms`;
	}
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
