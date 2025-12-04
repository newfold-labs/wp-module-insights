const getOrCreateTooltip = (chart) => {
    let tooltipEl = chart.canvas.parentNode.querySelector('div');

    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.classList.add('chartjs-tooltip');
        tooltipEl.style.background = 'rgba(255, 255, 255, 0.95)';
        tooltipEl.style.borderRadius = '3px';
        tooltipEl.style.color = 'black';
        tooltipEl.style.opacity = 1;
        tooltipEl.style.pointerEvents = 'none';
        tooltipEl.style.position = 'absolute';
        tooltipEl.style.transform = 'translate(-50%, 0)';
        tooltipEl.style.transition = 'all .1s ease';

        const table = document.createElement('table');
        table.style.margin = '0px';

        tooltipEl.appendChild(table);
        chart.canvas.parentNode.appendChild(tooltipEl);
    }

    return tooltipEl;
};

export const externalTooltipHandler = (context) => {
    const { chart, tooltip } = context;
    const tooltipEl = getOrCreateTooltip(chart);

    if (tooltip.opacity === 0) {
        tooltipEl.style.opacity = 0;
        return;
    }
    if (tooltip.body) {
        const titleLines = tooltip.title || [];
        const bodyLines = tooltip.body.map(b => b.lines);

        const tableHead = document.createElement('thead');

        titleLines.forEach(title => {
            const tr = document.createElement('tr');
            tr.style.borderWidth = 0;

            const th = document.createElement('th');
            th.style.borderWidth = 0;
            const text = document.createTextNode(title);

            th.appendChild(text);
            tr.appendChild(th);
            tableHead.appendChild(tr);
        });

        const tableBody = document.createElement('tbody');
        bodyLines.forEach((body, i) => {
            const colors = tooltip.labelColors[i];

            const span = document.createElement('span');
            span.style.background = colors.borderColor;
            span.style.marginRight = '10px';
            span.style.height = '10px';
            span.style.width = '10px';
            span.style.display = 'inline-block';
            span.style.borderRadius = '50%';

            const tr = document.createElement('tr');
            tr.style.backgroundColor = 'inherit';
            tr.style.borderWidth = 0;

            const td = document.createElement('td');
            td.style.borderWidth = 0;

            const text = document.createTextNode(body);

            td.appendChild(span);
            td.appendChild(text);
            tr.appendChild(td);
            tableBody.appendChild(tr);
        });

        const tableRoot = tooltipEl.querySelector('table');

        while (tableRoot.firstChild) {
            tableRoot.firstChild.remove();
        }

        tableRoot.appendChild(tableHead);
        tableRoot.appendChild(tableBody);
    }

    const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;

    const avgY =
        tooltip.dataPoints.reduce((sum, dp) => sum + dp.element.y, 0) /
        tooltip.dataPoints.length;

    const chartMiddleX = chart.width / 2;
    const caretX = tooltip.caretX;

    tooltipEl.style.opacity = 1;
    tooltipEl.style.left = '0px';
    tooltipEl.style.top = '0px';
    tooltipEl.style.transform = 'translate(0, 0)';

    const { width: tooltipWidth } = tooltipEl.getBoundingClientRect();

    let left;
    const margin = 15;

    tooltipEl.classList.remove('chartjs-tooltip--left', 'chartjs-tooltip--right');

    if (caretX < chartMiddleX) {
        left = positionX + caretX + margin;
        tooltipEl.classList.add('chartjs-tooltip--right');
    } else {
        left = positionX + caretX - tooltipWidth - margin;
        tooltipEl.classList.add('chartjs-tooltip--left');
    }

    const top = positionY + avgY;

    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
    tooltipEl.style.transform = 'translate(0, -50%)';

    tooltipEl.style.font = tooltip.options.bodyFont.string;
    tooltipEl.style.padding = tooltip.options.padding + 'px ' + tooltip.options.padding + 'px';
};