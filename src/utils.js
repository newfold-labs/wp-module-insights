const FIELDS_TO_AVERAGE = [
    'accessibilityScore',
    'seoScore',
    'bestPracticesScore',
    'performanceScore',
];

export const aggregateScansByDay = (scans) => {
    const grouped = scans.reduce((acc, scan) => {
        const dateObj = new Date(scan.createdAt);

        const dateKey = dateObj.toISOString().slice(0, 10);

        if (!acc[dateKey]) {
            acc[dateKey] = { count: 0 };
            FIELDS_TO_AVERAGE.forEach(field => {
                acc[dateKey][field] = 0;
            });
        }

        acc[dateKey].count++;
        FIELDS_TO_AVERAGE.forEach(field => {
            acc[dateKey][field] += scan[field];
        });

        return acc;
    }, {});

    return Object.entries(grouped)
        .map(([date, data]) => {
            const { count, ...sums } = data;
            const averages = {};

            FIELDS_TO_AVERAGE.forEach(field => {
                averages[field] = sums[field] / count;
            });

            return {
                date,
                ...averages,
            };
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
};