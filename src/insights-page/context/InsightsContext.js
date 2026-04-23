import { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from '@wordpress/element';
import { getQueryArgs, addQueryArgs, removeQueryArgs } from '@wordpress/url';
import useScans from '../hooks/useScans';
import { REPORT_QUERY_KEY } from '../constants';
import { getScanJobId } from '../../utils';

const getLatestScan = (scans) => {
    if (!Array.isArray(scans) || scans.length === 0) {
        return null;
    }
    return scans.reduce((latest, current) => {
        return new Date(latest.updatedAt) > new Date(current.updatedAt) ? latest : current;
    });
};

const sortScansNewestFirst = (scans) => {
    if (!Array.isArray(scans)) {
        return [];
    }
    return [...scans].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
};

const InsightsContext = createContext();

export const useInsights = () => useContext(InsightsContext);

/**
 * Pinned job id for the Lighthouse summary, or null to follow the newest scan.
 * Stored as string so numeric ids (e.g. 0) are never dropped by truthiness checks.
 *
 * @param {unknown} raw
 * @returns {string|null}
 */
const normalizePinnedJobIdFromQuery = (raw) => {
    if (raw == null || raw === '') {
        return null;
    }
    if (Array.isArray(raw)) {
        const last = raw[raw.length - 1];
        return last == null || last === '' ? null : String(last);
    }
    return String(raw);
};

export const InsightsProvider = ({ children }) => {
    const { scans, loading } = useScans();
    const [isRunningScan, setIsRunningScan] = useState(NFD_INSIGHTS_DATA.isRunningScan);
    const [selectedReportJobId, setSelectedReportJobIdState] = useState(() => {
        const q = getQueryArgs(window.location.search);
        return normalizePinnedJobIdFromQuery(q[REPORT_QUERY_KEY]);
    });

    const prevLatestScan = useRef(false);
    const latestScan = getLatestScan(scans);
    const scansSorted = useMemo(() => sortScansNewestFirst(scans), [scans]);

    const activeReportScan = useMemo(() => {
        if (!scansSorted.length) {
            return null;
        }
        if (selectedReportJobId !== null) {
            const found = scansSorted.find(
                (s) => String(getScanJobId(s) ?? '') === selectedReportJobId
            );
            if (found) {
                return found;
            }
        }
        return latestScan;
    }, [scansSorted, selectedReportJobId, latestScan]);

    useEffect(() => {
        if (!loading && Array.isArray(scans) && selectedReportJobId !== null) {
            const exists = scans.some(
                (s) => String(getScanJobId(s) ?? '') === selectedReportJobId
            );
            if (!exists) {
                setSelectedReportJobIdState(null);
                const url = removeQueryArgs(window.location.href, REPORT_QUERY_KEY);
                window.history.replaceState(null, '', url);
            }
        }
    }, [loading, scans, selectedReportJobId]);

    const setActiveReportJobId = useCallback((jobId) => {
        const pinned = normalizePinnedJobIdFromQuery(jobId);
        setSelectedReportJobIdState(pinned);
        const url =
            pinned !== null
                ? addQueryArgs(window.location.href, { [REPORT_QUERY_KEY]: pinned })
                : removeQueryArgs(window.location.href, REPORT_QUERY_KEY);
        window.history.replaceState(null, '', url);
    }, []);

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
        scansSorted,
        latestScan,
        activeReportScan,
        selectedReportJobId,
        setActiveReportJobId,
        loading,
        isRunningScan,
        setIsRunningScan
    };

    return <InsightsContext.Provider value={value}>{children}</InsightsContext.Provider>;
};
