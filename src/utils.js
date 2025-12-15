const IMPORTANT_FIELDS = [
    'accessibilityScore',
    'seoScore',
    'bestPracticesScore',
    'performanceScore',
];

const getDateKey = (dateString) => {
    // If it's already ISO-like 2023-01-01..., just slice. 
    // Otherwise fallback to Date object.
    if (!dateString) return '1970-01-01';
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateString)) {
        return dateString.slice(0, 10);
    }
    return new Date(dateString).toISOString().slice(0, 10);
};

const getTs = (s) => new Date(s.updatedAt ?? s.createdAt).getTime();

export const aggregateScansByDayAverage = (scans) => {
    if (!Array.isArray(scans)) return [];

    const grouped = scans.reduce((acc, scan) => {
        const dateKey = getDateKey(scan.createdAt);

        if (!acc[dateKey]) {
            acc[dateKey] = {
                count: 0,
                ...Object.fromEntries(IMPORTANT_FIELDS.map(f => [f, 0]))
            };
        }

        acc[dateKey].count++;
        IMPORTANT_FIELDS.forEach(field => {
            if (typeof scan[field] === 'number') {
                acc[dateKey][field] += scan[field];
            }
        });

        return acc;
    }, {});

    return Object.entries(grouped)
        .map(([date, data]) => {
            const { count, ...sums } = data;
            const averages = {};

            IMPORTANT_FIELDS.forEach(field => {
                averages[field] = count > 0 ? sums[field] / count : 0;
            });

            return {
                date,
                ...averages,
            };
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
};

export const aggregateScansByDayLatest = (scans) => {
    if (!Array.isArray(scans)) return [];

    const grouped = scans.reduce((acc, scan) => {
        const dateKey = getDateKey(scan.createdAt);

        const curr = acc[dateKey];
        if (!curr || getTs(scan) > getTs(curr)) {
            acc[dateKey] = scan;
        }

        return acc;
    }, {});

    return Object.entries(grouped)
        .map(([date, scan]) => {
            const out = { date };
            IMPORTANT_FIELDS.forEach((f) => (out[f] = scan[f]));
            return out;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
};