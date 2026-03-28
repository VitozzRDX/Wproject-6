export function createForestLayer() {
  return new Promise(resolve => {
    const layer = new Konva.Layer();
    const img = new Image();
    img.src = 'forest_cache.png';
    img.onload = () => {
      layer.add(new Konva.Image({ x: 0, y: 0, image: img, width: img.naturalWidth, height: img.naturalHeight, listening: false }));
      layer.draw();
      resolve(layer);
    };
  });
}
