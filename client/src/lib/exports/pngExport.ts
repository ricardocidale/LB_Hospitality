/**
 * pngExport.ts — Export DOM elements (tables and charts) as PNG images
 *
 * Uses the dom-to-image-more library to capture HTML elements as high-resolution
 * PNG screenshots that can be downloaded or embedded in other documents. Three
 * functions are provided:
 *
 *   - exportTablePNG: Captures a financial table, optionally collapsing
 *     expanded/accordion rows for a clean screenshot. Temporarily removes
 *     cell borders for a cleaner look.
 *
 *   - exportChartPNG: Captures any chart element (e.g., Recharts SVG graphs)
 *     at a configurable resolution.
 *
 *   - captureChartAsImage: Returns a data URL (base64 PNG) instead of
 *     triggering a download — used when the image needs to be embedded in a
 *     PDF or PowerPoint export. Includes an SVG-based fallback if dom-to-image
 *     fails (which can happen with certain CSS features).
 */
import domtoimage from 'dom-to-image-more';

interface TablePNGOptions {
  element: HTMLElement;
  filename: string;
  scale?: number;
  collapseAccordions?: boolean;
}

/**
 * Capture a financial table DOM element as a PNG and trigger a browser download.
 * Temporarily collapses expandable rows and removes cell borders for a cleaner
 * screenshot, then restores everything afterward.
 */
export async function exportTablePNG(options: TablePNGOptions): Promise<void> {
  const { element, filename, scale = 2, collapseAccordions = true } = options;

  const hiddenRows: HTMLElement[] = [];

  try {
    if (collapseAccordions) {
      const expandableRows = element.querySelectorAll<HTMLElement>('[data-expandable-row="true"]');
      expandableRows.forEach(row => {
        if (row.style.display !== 'none') {
          hiddenRows.push(row);
          row.style.display = 'none';
        }
      });
    }

    element.style.border = 'none';
    const cells = element.querySelectorAll<HTMLElement>('td, th');
    const originalStyles: string[] = [];
    cells.forEach(cell => {
      originalStyles.push(cell.style.cssText);
      cell.style.border = 'none';
      cell.style.borderBottom = '1px solid #f0f0f0';
    });

    const dataUrl = await domtoimage.toPng(element, {
      bgcolor: '#ffffff',
      quality: 1,
      style: { transform: `scale(${scale})`, transformOrigin: 'top left' },
      width: element.scrollWidth * scale,
      height: element.scrollHeight * scale,
    });

    cells.forEach((cell, i) => {
      cell.style.cssText = originalStyles[i];
    });
    element.style.border = '';

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error exporting table as PNG:', error);
  } finally {
    hiddenRows.forEach(row => {
      row.style.display = '';
    });
  }
}

interface ChartPNGOptions {
  element: HTMLElement;
  filename: string;
  width?: number;
  height?: number;
  scale?: number;
}

/**
 * Capture a chart DOM element as a PNG and trigger a browser download.
 * Uses a 2x scale by default for retina-quality output.
 */
export async function exportChartPNG(options: ChartPNGOptions): Promise<void> {
  const { element, filename, width, height, scale = 2 } = options;

  try {
    const pngOptions: any = {
      bgcolor: '#ffffff',
      quality: 1,
      style: {
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      },
    };

    if (width && height) {
      pngOptions.width = width;
      pngOptions.height = height;
    } else {
      pngOptions.width = element.offsetWidth * scale;
      pngOptions.height = element.offsetHeight * scale;
    }

    const dataUrl = await domtoimage.toPng(element, pngOptions);

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error exporting chart as PNG:', error);
  }
}

/**
 * Capture a chart container as a base64 PNG data URL (for embedding in PDFs
 * or slides, not for direct download). If dom-to-image fails (e.g., due to
 * CORS or unsupported CSS), falls back to manually serializing the SVG element,
 * rendering it on a canvas, and extracting a PNG from the canvas.
 */
export async function captureChartAsImage(containerRef: HTMLDivElement): Promise<string | null> {
  try {
    const dataUrl = await domtoimage.toPng(containerRef, {
      bgcolor: '#ffffff',
      quality: 1,
      width: containerRef.offsetWidth * 2,
      height: containerRef.offsetHeight * 2,
      style: {
        transform: 'scale(2)',
        transformOrigin: 'top left',
      }
    });

    return dataUrl;
  } catch (error) {
    console.error('Error capturing chart with dom-to-image:', error);

    try {
      const svg = containerRef.querySelector('svg');
      if (!svg) {
        return null;
      }

      const clonedSvg = svg.cloneNode(true) as SVGElement;
      const rect = svg.getBoundingClientRect();
      clonedSvg.setAttribute('width', String(rect.width));
      clonedSvg.setAttribute('height', String(rect.height));

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);
      const encodedData = btoa(unescape(encodeURIComponent(svgString)));
      const dataUri = `data:image/svg+xml;base64,${encodedData}`;

      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = rect.width * 2;
          canvas.height = rect.height * 2;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.scale(2, 2);
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = dataUri;
      });
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return null;
    }
  }
}
