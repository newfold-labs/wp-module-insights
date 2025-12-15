import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

const useScans = (pollingInterval = 120000) => {
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);
    const firstScan = useRef(true);

    const fetchScans = useCallback(async () => {
        if (firstScan.current) {
            setLoading(true);
        }
        try {
            const fetchedScans = await apiFetch({ path: '/newfold-insights/v1/performance-scans' });
            // Only update if data changed (simple stringify check)
            setScans(prev => JSON.stringify(prev) === JSON.stringify(fetchedScans) ? prev : fetchedScans);
            firstScan.current = false;
        } catch (error) {
            console.error('Error fetching scans:', error);
            // On error we can keep previous scans
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchScans();

        const timer = setInterval(() => {
            fetchScans();
        }, pollingInterval);

        return () => clearInterval(timer);
    }, [fetchScans, pollingInterval]);

    return {
        scans,
        loading,
        refetch: fetchScans
    };
};

export default useScans;
