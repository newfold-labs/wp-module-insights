import { createContext, useContext, useState, useEffect, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

const getLatestScan = ( scans ) => {
	if ( scans.length === 0 ) {
		return null;
	}
	return scans.reduce( ( latest, current ) => {
		return new Date( latest.updatedAt ) > new Date( current.updatedAt ) ? latest : current;
	} );
}

const InsightsContext = createContext();

export const useInsights = () => useContext( InsightsContext );

export const InsightsProvider = ( { children } ) => {
	const [ scans, setScans ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ isRunningScan, setIsRunningScan ] = useState( NFD_INSIGHTS_DATA.isRunningScan );
	const firstScan = useRef( true );
	const prevLatestScan = useRef( false );
	const latestScan = getLatestScan( scans );


	const fetchScans = async () => {
		firstScan.current && setLoading( true );
		try {
			const fetchedScans = await apiFetch( { path: '/newfold-insights/v1/performance-scans' } );

			setScans( prev => JSON.stringify( prev ) === JSON.stringify( fetchedScans ) ? prev : fetchedScans );

			firstScan.current = false;
		} catch ( error ) {
			console.error( 'Error fetching scans:', error );
		} finally {
			setLoading( false );
		}
	};

	useEffect( () => {
		if(!prevLatestScan.current) {
			prevLatestScan.current = latestScan;
			return;
		}

		if (
			prevLatestScan.current?.createdAt &&
			latestScan?.createdAt &&
			new Date(prevLatestScan.current?.createdAt).valueOf() < new Date( latestScan?.createdAt ).valueOf()
		) {
			prevLatestScan.current = latestScan;
			setIsRunningScan( false);
		}
	}, [ latestScan ] );

	useEffect( () => {
		fetchScans();

		const timer = setInterval( () => {
			fetchScans();
		}, 2 * 60 * 1000 );

		return () => clearInterval( timer );
	}, [] );

	const value = {
		scans,
		setScans,
		latestScan,
		loading,
		isRunningScan,
		setIsRunningScan
	};

	return <InsightsContext.Provider value={ value }>{ children }</InsightsContext.Provider>;
};
