/**
 * unit-store.js — хранилище активных юнитов во время игры.
 *
 * Хранит Map: id → экземпляр юнита { id, defId, hex, condition, mfSpent }
 * Загружается из scenarium.js при старте. Является рантаймовой копией
 * сценария — изменения здесь отражают текущее состояние партии.
 */

import { unitDefs } from './unit-defs.js';

/** id → { id, defId, hex, condition, mfSpent } */
const units = new Map();

/**
 * Загружает одну запись из scenarium в хранилище.
 * Вызывается при инициализации из units.js.
 * @param {{ id: string, defId: string, hex: string, condition: string, mfSpent: number }} entry
 */
export function loadUnit(entry) {
  units.set(entry.id, { ...entry });
}

/**
 * Обновляет поля существующего юнита.
 * @param {string} id
 * @param {Object} changes — например { hex: 'G5', mfSpent: 1 }
 */
export function updateUnit(id, changes) {
  const unit = units.get(id);
  if (unit) Object.assign(unit, changes);
}

/** @returns {Object|undefined} юнит по id */
export function getUnit(id) { return units.get(id); }

/** @returns {Object[]} все активные юниты */
export function getAllUnits() { return [...units.values()]; }

/**
 * Возвращает определение типа юнита из unit-defs.
 * @param {string} defId
 * @returns {Object}
 */
export function getDef(defId) { return unitDefs[defId]; }

/** Выводит текущее состояние хранилища в консоль браузера (для отладки) */
export function logUnits() {
  console.log('unit-store:', JSON.stringify([...units.values()], null, 2));
}
