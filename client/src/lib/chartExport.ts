import domtoimage from 'dom-to-image-more';

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
    
    // Fallback: try basic SVG serialization
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
