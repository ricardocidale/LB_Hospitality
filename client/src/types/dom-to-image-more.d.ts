declare module 'dom-to-image-more' {
  const domToImage: {
    toPng(node: Node, options?: any): Promise<string>;
    toJpeg(node: Node, options?: any): Promise<string>;
    toBlob(node: Node, options?: any): Promise<Blob>;
    toSvg(node: Node, options?: any): Promise<string>;
    toPixelData(node: Node, options?: any): Promise<Uint8ClampedArray>;
  };
  export default domToImage;
}
