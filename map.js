function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}

export async function initMap(containerId) {
  const stage = new Konva.Stage({
    container: containerId,
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const layer = new Konva.Layer();
  stage.add(layer);

  const files = ['1.gif', '2.gif', '3.gif'];
  let y = 0;

  for (const src of files) {
    const img = await loadImage(src);
    layer.add(new Konva.Image({ x: 0, y, image: img, width: img.naturalWidth, height: img.naturalHeight }));
    y += img.naturalHeight;
  }

  layer.draw();
  return { stage, layer };
}
