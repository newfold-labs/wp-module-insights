/* globals NFD_INSIGHTS_DATA */
import { useEffect } from '@wordpress/element';
import { useInsights } from '../context/InsightsContext';
import apiFetch from '@wordpress/api-fetch';

export const useTriggerScan = () => {
	const {isRunningScan, setIsRunningScan } = useInsights();

	const triggerScan = async () => {
		if ( ! isRunningScan ) {
			try {
				setIsRunningScan( true );
				await apiFetch( { path: '/newfold-insights/v1/performance-scans/run-scan', method: 'POST' } );

			} catch ( error ) {
				console.error( 'Error triggering scan:', error );
				setIsRunningScan( false );
			}
		}
	};

	return { triggerScan, isRunningScan, setIsRunningScan };
}
