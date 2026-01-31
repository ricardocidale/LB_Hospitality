export async function captureChartAsImage(containerRef: HTMLDivElement): Promise<string | null> {
  try {
    const svg = containerRef.querySelector('svg');
    if (!svg) {
      console.warn('No SVG found in chart container');
      return null;
    }

    const clonedSvg = svg.cloneNode(true) as SVGElement;
    
    const rect = svg.getBoundingClientRect();
    clonedSvg.setAttribute('width', String(rect.width));
    clonedSvg.setAttribute('height', String(rect.height));
    
    const defs = clonedSvg.querySelector('defs');
    if (defs) {
      const gradients = defs.querySelectorAll('linearGradient, radialGradient');
      gradients.forEach((gradient) => {
        const id = gradient.getAttribute('id');
        if (id) {
          const elements = clonedSvg.querySelectorAll(`[stroke="url(#${id})"], [fill="url(#${id})"]`);
          elements.forEach((el) => {
            const stroke = el.getAttribute('stroke');
            const fill = el.getAttribute('fill');
            
            if (stroke === `url(#${id})`) {
              const stops = gradient.querySelectorAll('stop');
              if (stops.length > 0) {
                const color = stops[0].getAttribute('stop-color') || '#000';
                el.setAttribute('stroke', color);
              }
            }
            if (fill === `url(#${id})`) {
              const stops = gradient.querySelectorAll('stop');
              if (stops.length > 0) {
                const color = stops[0].getAttribute('stop-color') || '#000';
                el.setAttribute('fill', color);
              }
            }
          });
        }
      });
    }
    
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        console.error('Image load error:', e);
        reject(new Error('Failed to load SVG as image'));
      };
      
      img.src = url;
    });
  } catch (error) {
    console.error('Error capturing chart:', error);
    return null;
  }
}
