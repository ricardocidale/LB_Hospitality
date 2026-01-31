export async function svgToDataUrl(svgElement: SVGElement): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svgElement);
      
      svgString = svgString.replace(/url\(#/g, `url(${window.location.href}#`);
      
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const rect = svgElement.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
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
        reject(e);
      };
      
      img.src = url;
    } catch (error) {
      reject(error);
    }
  });
}

export async function captureChartAsImage(containerRef: HTMLDivElement): Promise<string | null> {
  try {
    const svg = containerRef.querySelector('svg');
    if (!svg) {
      console.warn('No SVG found in chart container');
      return null;
    }
    
    return await svgToDataUrl(svg as SVGElement);
  } catch (error) {
    console.error('Error capturing chart:', error);
    return null;
  }
}
