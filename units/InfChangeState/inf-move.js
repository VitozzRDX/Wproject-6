/**
 * inf-move.js — логика движения пехотных юнитов.
 *
 * Отвечает за:
 *   - вычисление соседних гексов (getNeighbors)
 *   - проверку возможности движения (canMove)
 *   - выполнение движения с обновлением состояния (moveUnit)
 *
 * Стоимость движения сейчас: 1 mf за любой гекс.
 * В дальнейшем стоимость будет зависеть от типа местности и других условий.
 */

import { getUnit, getDef, updateUnit } from '../unit-store.js';

// Размеры сетки (совпадают с hexgrid.js)
const COLS = 33;
const ROWS = 31;

/**
 * Преобразует буквенно-цифровую метку гекса в индексы колонки и строки.
 * "E5" → { col:4, row:4 },  "BB3" → { col:27, row:2 }
 * @param {string} label
 * @returns {{ col: number, row: number }}
 */
function parseHex(label) {
  const m = label.match(/^([A-Z]+)(\d+)$/);
  const letters = m[1];
  const col = letters.length === 1
    ? letters.charCodeAt(0) - 65
    : 26 + (letters.charCodeAt(0) - 65); // AA=26, BB=27, CC=28...
  return { col, row: parseInt(m[2]) - 1 };
}

/**
 * Преобразует индексы колонки и строки в метку гекса.
 * col=4, row=4 → "E5",  col=27, row=2 → "BB3"
 * @param {number} col
 * @param {number} row
 * @returns {string}
 */
function hexLabel(col, row) {
  const l = String.fromCharCode(65 + (col % 26));
  return (col < 26 ? l : l + l) + (row + 1);
}

/**
 * Возвращает метки 6 соседних гексов для данного гекса.
 *
 * Нечётные колонки смещены вниз на HEX_H/2, поэтому соседи разные
 * в зависимости от чётности колонки:
 *
 *   Чётная колонка:     Нечётная колонка:
 *   (col-1, row-1)      (col-1, row)
 *   (col-1, row)        (col-1, row+1)
 *   (col+1, row-1)      (col+1, row)
 *   (col+1, row)        (col+1, row+1)
 *   (col,   row-1)      (col,   row-1)
 *   (col,   row+1)      (col,   row+1)
 *
 * @param {string} label — метка исходного гекса
 * @returns {string[]} массив меток (от 3 до 6 элементов, меньше — у края карты)
 */
export function getNeighbors(label) {
  const { col, row } = parseHex(label);
  const isOdd = col % 2 === 1;

  const candidates = isOdd
    ? [[col-1, row], [col-1, row+1], [col+1, row], [col+1, row+1], [col, row-1], [col, row+1]]
    : [[col-1, row-1], [col-1, row], [col+1, row-1], [col+1, row], [col, row-1], [col, row+1]];

  // Фильтруем гексы за пределами карты
  return candidates
    .filter(([c, r]) => c >= 0 && c < COLS && r >= 0 && r < ROWS)
    .map(([c, r]) => hexLabel(c, r));
}

/**
 * Проверяет, может ли юнит сделать хотя бы один шаг (остался хотя бы 1 mf).
 * @param {string} unitId
 * @returns {boolean}
 */
export function canMove(unitId) {
  const unit = getUnit(unitId);
  if (!unit) return false;
  const def = getDef(unit.defId);
  return (def.mf - unit.mfSpent) >= 1;
}

/**
 * Перемещает юнит в указанный гекс и тратит 1 mf.
 * Предполагается, что targetHex — допустимый сосед; проверка условий местности
 * будет добавлена позже.
 *
 * @param {string} unitId
 * @param {string} targetHex — метка целевого гекса
 * @returns {boolean} true если движение выполнено, false если невозможно
 */
export function moveUnit(unitId, targetHex) {
  if (!canMove(unitId)) return false;
  updateUnit(unitId, {
    hex:      targetHex,
    mfSpent:  getUnit(unitId).mfSpent + 1,
  });
  return true;
}
