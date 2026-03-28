import { hexMap } from './hexmap.js?v=2';

const R = 112 / 3;
const RX = 37.35;
const OFFSET_X = 3;
const OFFSET_Y = -2;
const HEX_H = Math.sqrt(3) * R;
const COL_STEP = 1.5 * RX;
const MAP_H = 645;

function parseHex(label) {
  const m = label.match(/^([A-Z]+)(\d+)$/);
  const letters = m[1];
  const row = parseInt(m[2]) - 1;
  const col = letters.length === 1 ? letters.charCodeAt(0) - 65 : 26 + (letters.charCodeAt(0) - 65);
  return { col, row };
}

function hexPolygon(col, row) {
  const cx = col * COL_STEP + OFFSET_X;
  const cy = HEX_H / 2 + row * HEX_H + (col % 2 === 1 ? HEX_H / 2 : 0) + OFFSET_Y;
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i);
    return [cx + RX * Math.cos(a), cy + R * Math.sin(a)];
  });
}

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function isBrushColor(r, g, b) {
  return Math.abs(r - 123) < 25 && Math.abs(g - 165) < 25 && Math.abs(b - 85) < 25;
}

export async function createBrushLayer(mapImages) {
  const layer = new Konva.Layer();
  const brushHexes = Object.entries(hexMap)
    .filter(([, t]) => t.includes('brush'))
    .map(([label]) => parseHex(label));

  if (!brushHexes.length) { layer.draw(); return layer; }

  const W = 1800;
  const allPts = brushHexes.flatMap(({ col, row }) => hexPolygon(col, row));
  const minX = Math.max(0, Math.floor(Math.min(...allPts.map(p => p[0])) - 2));
  const maxX = Math.min(W - 1, Math.ceil(Math.max(...allPts.map(p => p[0])) + 2));
  const minY = Math.max(0, Math.floor(Math.min(...allPts.map(p => p[1])) - 2));
  const maxY = Math.ceil(Math.max(...allPts.map(p => p[1])) + 2);

  const hexPolygons = brushHexes.map(({ col, row }) => hexPolygon(col, row));

  // Собираем данные из всех трёх изображений
  const imgH = MAP_H;
  const fullData = new Uint8ClampedArray(W * (imgH * 3) * 4);
  for (let i = 0; i < 3; i++) {
    const oc = document.createElement('canvas');
    oc.width = W; oc.height = imgH;
    oc.getContext('2d').drawImage(mapImages[i], 0, 0);
    const d = oc.getContext('2d').getImageData(0, 0, W, imgH).data;
    fullData.set(d, i * W * imgH * 4);
  }

  const totalH = imgH * 3;
  const mask = new Uint8Array(W * totalH);
  for (let y = minY; y <= Math.min(maxY, totalH - 1); y++) {
    for (let x = minX; x <= maxX; x++) {
      const i = y * W + x;
      const r = fullData[i*4], g = fullData[i*4+1], b = fullData[i*4+2];
      if (!isBrushColor(r, g, b)) continue;
      if (hexPolygons.some(poly => pointInPolygon(x, y, poly))) mask[i] = 1;
    }
  }

  // Дилатация 2px
  const dilated = mask.slice();
  for (let pass = 0; pass < 2; pass++) {
    const src = dilated.slice();
    for (let y = minY + 1; y < Math.min(maxY, totalH - 1); y++) {
      for (let x = minX + 1; x < maxX; x++) {
        const idx = y * W + x;
        if (!dilated[idx] && (src[idx-1] || src[idx+1] || src[idx-W] || src[idx+W])) dilated[idx] = 1;
      }
    }
  }

  // Connected components
  const label = new Int32Array(W * totalH);
  const blobs = [];
  for (let y = minY; y <= Math.min(maxY, totalH - 1); y++) {
    for (let x = minX; x <= maxX; x++) {
      const idx = y * W + x;
      if (!dilated[idx] || label[idx]) continue;
      const stack = [idx], pixels = [];
      label[idx] = blobs.length + 1;
      let x0 = x, x1 = x, y0 = y, y1 = y;
      while (stack.length) {
        const cur = stack.pop(); pixels.push(cur);
        const cy2 = Math.floor(cur / W), cx2 = cur % W;
        if (cx2 < x0) x0 = cx2; if (cx2 > x1) x1 = cx2;
        if (cy2 < y0) y0 = cy2; if (cy2 > y1) y1 = cy2;
        for (const n of [cur-1, cur+1, cur-W, cur+W]) {
          if (n >= 0 && n < W*totalH && dilated[n] && !label[n]) { label[n] = blobs.length + 1; stack.push(n); }
        }
      }
      if (pixels.length > 150) blobs.push({ pixels, x0, y0, x1, y1 });
    }
  }

  for (const blob of blobs) {
    const pw = blob.x1 - blob.x0 + 1, ph = blob.y1 - blob.y0 + 1;
    const bc = document.createElement('canvas');
    bc.width = pw; bc.height = ph;
    const bctx = bc.getContext('2d');
    const imgData = bctx.createImageData(pw, ph);
    const set = new Set(blob.pixels);
    for (const idx of blob.pixels) {
      const gx = idx % W, gy = Math.floor(idx / W);
      if ([idx-1,idx+1,idx-W,idx+W].some(n => !set.has(n))) {
        const li = ((gy - blob.y0) * pw + (gx - blob.x0)) * 4;
        imgData.data[li] = 70; imgData.data[li+1] = 130; imgData.data[li+2] = 180; imgData.data[li+3] = 255;
      }
    }
    bctx.putImageData(imgData, 0, 0);
    layer.add(new Konva.Image({ x: blob.x0, y: blob.y0, image: bc, width: pw, height: ph, listening: false }));
  }

  layer.draw();
  return layer;
}
