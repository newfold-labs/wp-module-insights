import { useState } from '@wordpress/element';
import { useInsights } from '../context/InsightsContext';
import apiFetch from '@wordpress/api-fetch';

export const useTriggerScan = () => {
	const { isRunningScan, setIsRunningScan } = useInsights();
	const [ isTryingToRun, setIsTryingToRun ] = useState( false );

	const triggerScan = async () => {
		if ( ! isTryingToRun && ! isRunningScan ) {
			try {
				setIsTryingToRun( true );
				await apiFetch( { path: '/newfold-insights/v1/performance-scans/run-scan', method: 'POST' } );
				setIsRunningScan( true );
			} catch ( error ) {
				console.error( 'Error triggering scan:', error );
			}finally {
				setIsTryingToRun( false );
			}
		}
	};

	return { triggerScan, isRunningScan, setIsRunningScan, isTryingToRun };
}
