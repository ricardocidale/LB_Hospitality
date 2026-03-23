import domtoimage from "dom-to-image-more";

interface ChartScreenshot {
  title: string;
  dataUrl: string;
  aspectRatio?: number;
}

const SECTION_MAP: Array<{ selector: string; title: string }> = [
  { selector: '[data-export-section="investment-performance"]', title: "Investment Performance" },
  { selector: '[data-export-section="revenue-anoi-chart"]', title: "Revenue & ANOI Projection" },
  { selector: '[data-export-section="usali-waterfall-chart"]', title: "USALI Profit Waterfall" },
];

export async function captureOverviewCharts(
  container: HTMLElement,
): Promise<ChartScreenshot[]> {
  const screenshots: ChartScreenshot[] = [];

  for (const { selector, title } of SECTION_MAP) {
    const el = container.querySelector<HTMLElement>(selector);
    if (!el) continue;

    try {
      const rect = el.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) continue;

      const scale = 2;
      const dataUrl = await domtoimage.toPng(el, {
        width: rect.width * scale,
        height: rect.height * scale,
        bgcolor: "#ffffff",
        style: {
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        },
        quality: 1,
      });

      screenshots.push({
        title,
        dataUrl,
        aspectRatio: rect.width / rect.height,
      });
    } catch (err) {
      console.warn(`[chart-capture] Failed to capture "${title}":`, err);
    }
  }

  return screenshots;
}
