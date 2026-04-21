import { __, _n, sprintf } from '@wordpress/i18n';

const MS = 1000;
const MINUTE = 60 * MS;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * Short relative time for compact UI (e.g. dashboard widget).
 *
 * @param {string|number|Date} input ISO string, timestamp, or Date.
 * @return {string} Relative phrase, short date, or empty string if invalid.
 */
export function formatRelativeTime( input ) {
	const d = input instanceof Date ? input : new Date( input );
	if ( Number.isNaN( d.getTime() ) ) {
		return '';
	}
	const diffMs = Date.now() - d.getTime();
	if ( diffMs < 0 ) {
		return d.toLocaleString();
	}

	/** Under one minute: treat as “just now” (avoids “0 min ago”). */
	if ( diffMs < MINUTE ) {
		return __( 'just now', 'wp-module-insights' );
	}

	const minutes = Math.floor( diffMs / MINUTE );
	if ( minutes < 60 ) {
		return sprintf(
			/* translators: %d: number of minutes */
			_n( '%d min ago', '%d mins ago', minutes, 'wp-module-insights' ),
			minutes
		);
	}

	const hours = Math.floor( diffMs / HOUR );
	if ( hours < 24 ) {
		return sprintf(
			/* translators: %d: number of hours */
			_n( '%d hour ago', '%d hours ago', hours, 'wp-module-insights' ),
			hours
		);
	}

	const days = Math.floor( diffMs / DAY );
	if ( days < 7 ) {
		return sprintf(
			/* translators: %d: number of days */
			_n( '%d day ago', '%d days ago', days, 'wp-module-insights' ),
			days
		);
	}

	const weeks = Math.floor( diffMs / WEEK );
	if ( weeks < 52 ) {
		return sprintf(
			/* translators: %d: number of weeks */
			_n( '%d week ago', '%d weeks ago', weeks, 'wp-module-insights' ),
			weeks
		);
	}

	return d.toLocaleDateString( undefined, {
		month: 'short',
		day: 'numeric',
		year:
			d.getFullYear() !== new Date().getFullYear()
				? 'numeric'
				: undefined,
	} );
}
