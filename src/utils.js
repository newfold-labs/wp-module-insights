const IMPORTANT_FIELDS = [
    'accessibilityScore',
    'seoScore',
    'bestPracticesScore',
    'performanceScore',
];

export const aggregateScansByDayAverage = (scans) => {
    const grouped = scans.reduce((acc, scan) => {
        const dateObj = new Date(scan.createdAt);

        const dateKey = dateObj.toISOString().slice(0, 10);

        if (!acc[dateKey]) {
            acc[dateKey] = { count: 0 };
            IMPORTANT_FIELDS.forEach(field => {
                acc[dateKey][field] = 0;
            });
        }

        acc[dateKey].count++;
        IMPORTANT_FIELDS.forEach(field => {
            acc[dateKey][field] += scan[field];
        });

        return acc;
    }, {});

    return Object.entries(grouped)
        .map(([date, data]) => {
            const { count, ...sums } = data;
            const averages = {};

            IMPORTANT_FIELDS.forEach(field => {
                averages[field] = sums[field] / count;
            });

            return {
                date,
                ...averages,
            };
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
};

const getTs = (s) => new Date(s.updatedAt ?? s.createdAt).getTime();

export const aggregateScansByDayLatest = (scans) => {
    const grouped = scans.reduce((acc, scan) => {
        const dateObj = new Date(scan.createdAt);
        const dateKey = dateObj.toISOString().slice(0, 10);

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