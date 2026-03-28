// flat-top hexagons
const R = 112 / 3;  // радиус по Y (~37.33)
const RX = 37.35;       // радиус по X — увеличь для растяжения ширины
const OFFSET_X = 3; // сдвиг сетки по X
const OFFSET_Y = -2; // сдвиг сетки по Y
const HEX_H = Math.sqrt(3) * R;
const COL_STEP = 1.5 * RX;
const ROW_STEP = HEX_H;

const COLS = 33;
const ROWS = 31;

function colLabel(col) {
  const letter = String.fromCharCode(65 + (col % 26));
  return col < 26 ? letter : letter + letter;
}

function hexCorners(cx, cy) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    pts.push(cx + RX * Math.cos(angle), cy + R * Math.sin(angle));
  }
  return pts;
}

export function createHexGrid() {
  const layer = new Konva.Layer();

  for (let col = 0; col < COLS; col++) {
    const cx = col * COL_STEP + OFFSET_X;
    const offset = col % 2 === 1 ? HEX_H / 2 : 0;

    // Row 0 — только нечётные колонки (B, D, F...), прямо над B1, D1...
    if (col % 2 === 1) {
      const cy0 = HEX_H / 2 + (-1) * ROW_STEP + HEX_H / 2 + OFFSET_Y;
      layer.add(new Konva.Line({
        points: hexCorners(cx, cy0),
        stroke: 'rgba(255, 0, 0, 0.4)',
        strokeWidth: 1, closed: true, listening: false,
      }));
      layer.add(new Konva.Text({
        x: cx - RX, y: cy0 - R / 2,
        width: RX * 2, height: R,
        text: '0' + ((col + 1) / 2),
        fontSize: 8, fill: 'rgba(0,0,0,0.6)',
        align: 'center', verticalAlign: 'middle', listening: false,
      }));
    }

    for (let row = 0; row < ROWS; row++) {
      const cy = HEX_H / 2 + row * ROW_STEP + offset + OFFSET_Y;

      const hex = new Konva.Line({
        points: hexCorners(cx, cy),
        stroke: 'rgba(255, 0, 0, 0.4)',
        strokeWidth: 1,
        closed: true,
        listening: false,
      });

      layer.add(hex);

      layer.add(new Konva.Text({
        x: cx - RX, y: cy - R / 2,
        width: RX * 2, height: R,
        text: colLabel(col) + (row + 1),
        fontSize: 8,
        fill: 'rgba(0,0,0,0.6)',
        align: 'center',
        verticalAlign: 'middle',
        listening: false,
      }));
    }
  }

  return layer;
}
