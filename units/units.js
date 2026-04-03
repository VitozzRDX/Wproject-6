/**
 * units.js — точка входа системы юнитов.
 *
 * Загружает юниты из scenarium в unit-store,
 * создаёт Konva-слой с рендерингом и возвращает его в main.js.
 */

import { loadUnit, logUnits } from './unit-store.js';
import { createUnitsLayer } from './unit-render.js';
import { scenarium } from '../scenarium.js';

/**
 * Инициализирует систему юнитов: загружает сценарий, строит слой.
 * @param {Konva.Stage} stage
 * @returns {Promise<Konva.Layer>}
 */
export async function initUnits(stage) {
  // Загружаем все юниты из сценария в рантаймовое хранилище
  scenarium.units.forEach(loadUnit);

  const unitsLayer = await createUnitsLayer();
  stage.add(unitsLayer);

  logUnits(); // вывод в консоль для отладки
  return unitsLayer;
}
