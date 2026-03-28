import { hexMap } from './hexmap.js?v=32';

const R = 112 / 3;
const RX = 37.35;
const OFFSET_X = 3;
const OFFSET_Y = -2;
const HEX_H = Math.sqrt(3) * R;
const COL_STEP = 1.5 * RX;
const ROW_STEP = HEX_H;

function colIndex(label) {
  if (label.length === 2) return 26 + (label.charCodeAt(0) - 65);
  return label.charCodeAt(0) - 65;
}

function hexCorners(cx, cy) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    pts.push(cx + RX * Math.cos(angle), cy + R * Math.sin(angle));
  }
  return pts;
}

export function createRoadsLayer() {
  const layer = new Konva.Layer();

  for (const [label, terrains] of Object.entries(hexMap)) {
    let col, row;
    if (/^0\d+$/.test(label)) {
      // Ряд 0: метка вида "04" → нечётная колонка, row = -1
      col = parseInt(label) * 2 - 1;
      row = -1;
    } else {
      col = colIndex(label.replace(/\d+/g, ''));
      row = parseInt(label.match(/\d+/)[0]) - 1;
    }
    const cx = col * COL_STEP + OFFSET_X;
    const offset = col % 2 === 1 ? HEX_H / 2 : 0;
    const cy = HEX_H / 2 + row * ROW_STEP + offset + OFFSET_Y;

    for (const terrain of terrains) {
      const color = terrain === 'pavedRoad'
        ? 'rgba(180,180,180,0.5)'
        : terrain === 'crestLine'
        ? 'rgba(180,120,40,0.35)'
        : terrain === 'hill'
        ? 'rgba(160,82,45,0.3)'
        : terrain === 'woodenBuilding'
        ? 'rgba(101,67,33,0.55)'
        : terrain === 'stoneBuilding'
        ? 'rgba(80,80,80,0.55)'
        : terrain === 'orchard'
        ? 'rgba(144,238,144,0.45)'
        : terrain === 'brush'
        ? 'rgba(173,216,230,0.5)'
        : terrain === 'forest'
        ? 'rgba(0,80,0,0.4)'
        : 'rgba(255,220,0,0.35)';

      layer.add(new Konva.Line({
        points: hexCorners(cx, cy),
        fill: color,
        closed: true,
        listening: false,
      }));
    }
  }

  layer.draw();
  return layer;
}
