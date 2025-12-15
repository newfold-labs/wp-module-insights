import { createContext, useContext, useState, useEffect, useRef } from '@wordpress/element';
import useScans from '../hooks/useScans';

const getLatestScan = (scans) => {
    if (!Array.isArray(scans) || scans.length === 0) {
        return null;
    }
    return scans.reduce((latest, current) => {
        return new Date(latest.updatedAt) > new Date(current.updatedAt) ? latest : current;
    });
}

const InsightsContext = createContext();

export const useInsights = () => useContext(InsightsContext);

export const InsightsProvider = ({ children }) => {
    const { scans, loading } = useScans();
    const [isRunningScan, setIsRunningScan] = useState(NFD_INSIGHTS_DATA.isRunningScan);

    const prevLatestScan = useRef(false);
    const latestScan = getLatestScan(scans);

    useEffect(() => {
        if (!prevLatestScan.current) {
            prevLatestScan.current = latestScan;
            return;
        }

        if (
            prevLatestScan.current?.createdAt &&
            latestScan?.createdAt &&
            new Date(prevLatestScan.current.createdAt).valueOf() < new Date(latestScan.createdAt).valueOf()
        ) {
            prevLatestScan.current = latestScan;
            setIsRunningScan(false);
        }
    }, [latestScan]);

    const value = {
        scans,
        latestScan,
        loading,
        isRunningScan,
        setIsRunningScan
    };

    return <InsightsContext.Provider value={value}>{children}</InsightsContext.Provider>;
};
