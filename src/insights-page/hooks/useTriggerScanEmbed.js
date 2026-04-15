import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Trigger-scan for embeds that do not use InsightsContext (Bluehost Home, dashboard widget).
 *
 * @param {boolean}  isRunningScan    Scan lock / in-progress.
 * @param {Function} setIsRunningScan
 * @param {Function} [refetchScans]   Optional: call after successful POST to pull new data sooner than poll interval.
 */
export function useTriggerScanEmbed(
	isRunningScan,
	setIsRunningScan,
	refetchScans
) {
	const [ isTryingToRun, setIsTryingToRun ] = useState( false );

	const triggerScan = async () => {
		if ( ! isTryingToRun && ! isRunningScan ) {
			try {
				setIsTryingToRun( true );
				await apiFetch( {
					path: '/newfold-insights/v1/performance-scans/run-scan',
					method: 'POST',
				} );
				setIsRunningScan( true );
				if ( typeof refetchScans === 'function' ) {
					refetchScans();
				}
			} catch ( error ) {
				// eslint-disable-next-line no-console
				console.error( 'Error triggering scan:', error );
			} finally {
				setIsTryingToRun( false );
			}
		}
	};

	return { triggerScan, isTryingToRun };
}
