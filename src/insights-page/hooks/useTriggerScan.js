import { useState } from "@wordpress/element";
import apiFetch from "@wordpress/api-fetch";

export const useTriggerScan = () => {
    const [isRunningScan, setIsRunningScan] = useState(NFD_INSIGHTS_DATA.isRunningScan);

    const triggerScan = async () => {
        if (!isRunningScan) {
            try {
                setIsRunningScan(true);
                await apiFetch({ path: '/newfold-insights/v1/performance-scans/run-scan', method: 'POST' });

            } catch (error) {
                console.error('Error triggering scan:', error);
                setIsRunningScan(false);
            }
        }
    };
    return { triggerScan, isRunningScan, setIsRunningScan }
}
