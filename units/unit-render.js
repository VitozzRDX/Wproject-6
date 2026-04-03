/**
 * unit-render.js — рендеринг юнитов на Konva-слое.
 *
 * Отвечает за:
 *   - отрисовку юнитов из unit-store на карте
 *   - стековое смещение юнитов в одном гексе
 *   - выделение юнита кликом (красная рамка, вывод на первый план)
 *   - подсветку 6 соседних гексов после выбора юнита
 *   - перерисовку слоя после движения
 */

import { getAllUnits, getDef } from './unit-store.js';
import { getNeighbors, canMove, moveUnit } from './InfChangeState/inf-move.js';

// ── Геометрия гексов (совпадает с hexgrid.js) ─────────────────────────────
const R        = 112 / 3;
const RX       = 37.35;
const HEX_H    = Math.sqrt(3) * R;
const COL_STEP = 1.5 * RX;
const OFFSET_X = 3;
const OFFSET_Y = -2;

/** Смещение между юнитами в стопке в пикселях (~2мм при 96 DPI) */
const STACK_OFFSET = 6;

// ── Кэш загруженных изображений (живёт между перерисовками) ───────────────
const imageCache = {};

// ── Состояние выделения (одно на весь слой) ────────────────────────────────
let _layer         = null;  // ссылка на Konva-слой, сохраняется для перерисовки
let selectionRect  = null;  // красная рамка вокруг выбранного юнита
let selectedNode   = null;  // Konva.Image выбранного юнита
let selectedZIndex = null;  // исходный z-индекс (для возврата на место)
let selectedUnitId = null;  // id выбранного юнита (для передачи в inf-move)
let neighborShapes = [];    // подсвеченные контуры соседних гексов

// ── Вспомогательные функции ────────────────────────────────────────────────

/** Центр гекса в canvas-координатах */
function hexCenter(col, row) {
  const off = col % 2 === 1 ? HEX_H / 2 : 0;
  return {
    x: col * COL_STEP + OFFSET_X,
    y: HEX_H / 2 + row * HEX_H + off + OFFSET_Y,
  };
}

/**
 * Разбирает метку гекса в индексы колонки и строки.
 * "E5" → { col:4, row:4 },  "BB3" → { col:27, row:2 }
 */
function parseHex(label) {
  const m = label.match(/^([A-Z]+)(\d+)$/);
  const letters = m[1];
  const col = letters.length === 1
    ? letters.charCodeAt(0) - 65
    : 26 + (letters.charCodeAt(0) - 65);
  return { col, row: parseInt(m[2]) - 1 };
}

/** Возвращает плоский массив точек шестиугольника для Konva.Line */
function hexPoints(cx, cy) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i);
    pts.push(cx + RX * Math.cos(a), cy + R * Math.sin(a));
  }
  return pts;
}

/** Загружает изображение, возвращает Promise<HTMLImageElement> */
function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}

/**
 * Снимает выделение: убирает рамку, подсветку соседей,
 * возвращает юнит на исходный z-индекс.
 */
function clearSelection() {
  if (selectionRect)  { selectionRect.destroy(); selectionRect = null; }
  if (selectedNode)   { selectedNode.zIndex(selectedZIndex); selectedNode = null; }
  neighborShapes.forEach(s => s.destroy());
  neighborShapes = [];
  selectedZIndex = null;
  selectedUnitId = null;
}

/**
 * Рисует жёлтые контуры 6 соседних гексов.
 * Каждый контур кликабелен: клик вызывает движение выбранного юнита.
 * @param {string} unitId  — id выбранного юнита
 * @param {string} hexLabel — текущий гекс юнита
 */
function drawNeighborHighlights(unitId, hexLabel) {
  if (!canMove(unitId)) return; // не тратим ресурсы если юнит не может идти

  for (const neighborLabel of getNeighbors(hexLabel)) {
    const { col, row } = parseHex(neighborLabel);
    const { x, y }     = hexCenter(col, row);

    const shape = new Konva.Line({
      points:      hexPoints(x, y),
      closed:      true,
      fill:        'rgba(255, 220, 0, 0.15)',
      stroke:      'rgba(255, 220, 0, 0.7)',
      strokeWidth: 1.5,
      listening:   true,
    });

    // При клике на соседний гекс — двигаем выбранный юнит туда
    shape.on('click', () => {
      const id = selectedUnitId; // запоминаем до clearSelection
      moveUnit(id, neighborLabel);
      redrawLayer(); // перерисовываем слой (async, но не ждём)
    });

    _layer.add(shape);
    neighborShapes.push(shape);
  }
}

// ── Основная логика рендеринга ─────────────────────────────────────────────

/**
 * Заполняет переданный слой юнитами из unit-store.
 * Юниты в одном гексе рисуются со смещением: геометрический центр стопки
 * совпадает с центром гекса.
 * @param {Konva.Layer} layer
 */
async function populateLayer(layer) {
  // Группируем юниты по гексу для расчёта позиции в стопке
  const byHex = new Map();
  for (const unit of getAllUnits()) {
    if (!byHex.has(unit.hex)) byHex.set(unit.hex, []);
    byHex.get(unit.hex).push(unit);
  }

  for (const [hex, stack] of byHex) {
    const { col, row } = parseHex(hex);
    const { x, y }     = hexCenter(col, row);

    for (let i = 0; i < stack.length; i++) {
      const unit = stack[i];
      const def  = getDef(unit.defId);

      // Загружаем изображение (из кэша если уже было)
      if (!imageCache[def.image]) {
        imageCache[def.image] = await loadImage(def.image);
      }
      const img = imageCache[def.image];

      // Смещение i-го юнита из N: геометрический центр стопки = центр гекса
      const shift = (i - (stack.length - 1) / 2) * STACK_OFFSET;

      const konvaImg = new Konva.Image({
        id:    'unit-' + unit.id,
        image: img,
        x:     x - img.naturalWidth  / 2 + shift,
        y:     y - img.naturalHeight / 2 - shift,
      });

      konvaImg.on('click', () => {
        // Повторный клик на уже выбранный юнит — игнорируем
        if (konvaImg === selectedNode) return;

        // Снимаем предыдущее выделение (возвращает старый юнит на место)
        clearSelection();

        // Сохраняем z-индекс и выводим юнит на первый план
        selectedZIndex = konvaImg.zIndex();
        selectedNode   = konvaImg;
        selectedUnitId = unit.id;
        konvaImg.moveToTop();

        // Красная рамка вокруг выбранного юнита
        selectionRect = new Konva.Rect({
          x:           konvaImg.x(),
          y:           konvaImg.y(),
          width:       konvaImg.width(),
          height:      konvaImg.height(),
          stroke:      'red',
          strokeWidth: 1,
          listening:   false,
        });
        layer.add(selectionRect);

        // Подсвечиваем доступные для движения гексы
        drawNeighborHighlights(unit.id, unit.hex);

        layer.batchDraw();
      });

      layer.add(konvaImg);
    }
  }
}

/**
 * Перерисовывает слой с нуля: сбрасывает выделение, очищает слой,
 * заново расставляет юниты из store (с актуальными позициями и стопками).
 * Вызывается после каждого движения.
 */
async function redrawLayer() {
  clearSelection();
  _layer.destroyChildren();
  await populateLayer(_layer);
  _layer.batchDraw();
}

// ── Публичный интерфейс ────────────────────────────────────────────────────

/**
 * Создаёт Konva.Layer, заполняет юнитами и возвращает его.
 * @returns {Promise<Konva.Layer>}
 */
export async function createUnitsLayer() {
  const layer = new Konva.Layer();
  _layer = layer; // сохраняем ссылку для redrawLayer
  await populateLayer(layer);
  layer.draw();
  return layer;
}
