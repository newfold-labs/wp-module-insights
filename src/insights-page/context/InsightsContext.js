import { createContext, useContext, useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

const InsightsContext = createContext();

export const useInsights = () => useContext(InsightsContext);

export const InsightsProvider = ({ children }) => {
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchScans = async () => {
        setLoading(true);
        try {
            const fetchedScans = await apiFetch({ path: '/newfold-insights/v1/performance-scans' });
            setScans(fetchedScans);
        } catch (error) {
            console.error('Error fetching scans:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScans();
    }, []);

    const triggerScan = async () => {
        try {
            await apiFetch({ path: '/newfold-insights/v1/performance-scans', method: 'POST' });
            setTimeout(() => fetchScans(), 2000);
        } catch (error) {
            console.error('Error triggering scan:', error);
        }
    };

    const value = {
        scans,
        latestScan: scans.length > 0 ? scans[0] : null,
        loading,
        triggerScan,
    };

    return <InsightsContext.Provider value={value}>{children}</InsightsContext.Provider>;
};
