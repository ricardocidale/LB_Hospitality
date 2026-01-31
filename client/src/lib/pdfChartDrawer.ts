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
  
  // Draw subtle background
  doc.setFillColor(252, 252, 253);
  doc.rect(x, y, width, height, 'F');
  doc.setDrawColor(240, 240, 242);
  doc.setLineWidth(0.1);
  doc.rect(x, y, width, height, 'S');
  
  // Draw title - lighter and smaller
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 110);
  doc.text(title, x + 5, y + 7);
  
  const chartX = x + 22;
  const chartY = y + 12;
  const chartWidth = width - 30;
  const chartHeight = height - 24;
  
  // Find min/max values
  let minVal = Infinity;
  let maxVal = -Infinity;
  series.forEach(s => {
    s.data.forEach(d => {
      if (d.value < minVal) minVal = d.value;
      if (d.value > maxVal) maxVal = d.value;
    });
  });
  
  // Add padding to range
  const range = maxVal - minVal;
  minVal = Math.max(0, minVal - range * 0.1);
  maxVal = maxVal + range * 0.1;
  
  // Draw light grid lines
  doc.setDrawColor(235, 235, 240);
  doc.setLineWidth(0.1);
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const gridY = chartY + chartHeight - (i / gridLines) * chartHeight;
    doc.setLineDashPattern([0.5, 1], 0);
    doc.line(chartX, gridY, chartX + chartWidth, gridY);
    
    // Y-axis labels - lighter
    const val = minVal + (i / gridLines) * (maxVal - minVal);
    doc.setFontSize(5);
    doc.setTextColor(150, 150, 160);
    doc.text(formatValue(val), x + 2, gridY + 0.8);
  }
  doc.setLineDashPattern([], 0);
  
  // Draw X-axis labels
  if (series.length > 0 && series[0].data.length > 0) {
    const dataPoints = series[0].data.length;
    series[0].data.forEach((d, i) => {
      const pointX = chartX + (i / (dataPoints - 1)) * chartWidth;
      doc.setFontSize(5);
      doc.setTextColor(150, 150, 160);
      doc.text(d.label, pointX - 2, chartY + chartHeight + 4);
    });
  }
  
  // Draw lines for each series - thinner and smoother
  series.forEach((s) => {
    const [r, g, b] = hexToRgb(s.color);
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.4);
    
    const dataPoints = s.data.length;
    let prevX = 0;
    let prevY = 0;
    
    s.data.forEach((d, i) => {
      const pointX = chartX + (i / (dataPoints - 1)) * chartWidth;
      const normalizedValue = (d.value - minVal) / (maxVal - minVal);
      const pointY = chartY + chartHeight - normalizedValue * chartHeight;
      
      if (i > 0) {
        doc.line(prevX, prevY, pointX, pointY);
      }
      
      // Draw small dot
      doc.setFillColor(r, g, b);
      doc.circle(pointX, pointY, 0.6, 'F');
      
      prevX = pointX;
      prevY = pointY;
    });
  });
  
  // Draw compact legend at bottom
  const legendY = y + height - 3;
  let legendX = chartX + 10;
  doc.setFontSize(5);
  series.forEach((s) => {
    const [r, g, b] = hexToRgb(s.color);
    doc.setFillColor(r, g, b);
    doc.circle(legendX, legendY, 0.8, 'F');
    doc.setTextColor(100, 100, 110);
    doc.text(s.name, legendX + 2, legendY + 0.6);
    legendX += 25;
  });
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}
