import jsPDF from 'jspdf';

interface ChartData {
  label: string;
  value: number;
}

interface ChartSeries {
  name: string;
  data: ChartData[];
  color: string;
}

interface DrawChartOptions {
  doc: jsPDF;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  series: ChartSeries[];
  formatValue?: (value: number) => string;
}

export function drawLineChart(options: DrawChartOptions): void {
  const { doc, x, y, width, height, title, series, formatValue = (v) => `$${(v / 1000000).toFixed(1)}M` } = options;

  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, width, height, 'F');
  doc.setDrawColor(220, 220, 225);
  doc.setLineWidth(0.2);
  doc.rect(x, y, width, height, 'S');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(45, 74, 94);
  doc.text(title, x + width / 2, y + 10, { align: 'center' });

  const legendHeight = 10;
  const xAxisHeight = 12;
  const yAxisWidth = 32;
  const topPadding = 18;
  const rightPadding = 10;

  const chartX = x + yAxisWidth;
  const chartY = y + topPadding;
  const chartWidth = width - yAxisWidth - rightPadding;
  const chartHeight = height - topPadding - xAxisHeight - legendHeight;

  let minVal = Infinity;
  let maxVal = -Infinity;
  series.forEach(s => {
    s.data.forEach(d => {
      if (d.value < minVal) minVal = d.value;
      if (d.value > maxVal) maxVal = d.value;
    });
  });

  const range = maxVal - minVal || 1;
  minVal = Math.max(0, minVal - range * 0.05);
  maxVal = maxVal + range * 0.05;

  doc.setDrawColor(230, 230, 235);
  doc.setLineWidth(0.08);
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const gridY = chartY + chartHeight - (i / gridLines) * chartHeight;
    doc.setLineDashPattern([1, 1.5], 0);
    doc.line(chartX, gridY, chartX + chartWidth, gridY);

    const val = minVal + (i / gridLines) * (maxVal - minVal);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 130);
    doc.text(formatValue(val), chartX - 3, gridY + 1.5, { align: 'right' });
  }
  doc.setLineDashPattern([], 0);

  if (series.length > 0 && series[0].data.length > 0) {
    const dataPoints = series[0].data.length;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 130);
    series[0].data.forEach((d, i) => {
      const pointX = chartX + (i / Math.max(dataPoints - 1, 1)) * chartWidth;
      doc.text(d.label, pointX, chartY + chartHeight + 6, { align: 'center' });
    });
  }

  series.forEach((s) => {
    const [r, g, b] = hexToRgb(s.color);
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.6);

    const dataPoints = s.data.length;
    let prevX = 0;
    let prevY = 0;

    s.data.forEach((d, i) => {
      const pointX = chartX + (i / Math.max(dataPoints - 1, 1)) * chartWidth;
      const normalizedValue = (d.value - minVal) / (maxVal - minVal);
      const pointY = chartY + chartHeight - normalizedValue * chartHeight;

      if (i > 0) {
        doc.line(prevX, prevY, pointX, pointY);
      }

      doc.setFillColor(r, g, b);
      doc.circle(pointX, pointY, 0.9, 'F');

      prevX = pointX;
      prevY = pointY;
    });
  });

  const legendY = y + height - legendHeight / 2 - 1;
  const totalLegendWidth = series.reduce((sum, s) => {
    return sum + doc.getTextWidth(s.name) * (7 / doc.getFontSize()) + 8;
  }, 0);
  let legendX = x + (width - totalLegendWidth) / 2;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  series.forEach((s) => {
    const [r, g, b] = hexToRgb(s.color);

    doc.setFillColor(r, g, b);
    doc.roundedRect(legendX, legendY - 1.5, 4, 3, 0.5, 0.5, 'F');

    doc.setTextColor(80, 80, 90);
    doc.text(s.name, legendX + 5.5, legendY + 0.8);
    legendX += doc.getTextWidth(s.name) + 10;
  });
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}
