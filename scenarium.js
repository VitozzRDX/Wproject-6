/**
 * scenarium.js — единственный источник правды о расстановке и состоянии юнитов.
 *
 * Каждая запись описывает конкретный юнит на поле:
 *   id        — уникальный идентификатор экземпляра юнита ('u_1', 'u_2', ...)
 *   defId     — ключ из unit-defs.js (тип/подтип юнита)
 *   hex       — текущий гекс ('F5', 'BB3', ...)
 *   condition — боевое состояние ('ready' | ... — будет расширяться)
 *   mfSpent   — потрачено очков движения в текущем ходу (сбрасывается в начале хода)
 *
 * Порядок работы:
 *   - Добавить юнит → написать новую запись здесь
 *   - Переместить → изменить hex здесь
 *   - Состояние → изменить нужное поле здесь
 */
export const scenarium = {

  units: [
    { id: 'u_1', defId: 'ge_inf_467_1', hex: 'F5', condition: 'ready', mfSpent: 0 },
    { id: 'u_2', defId: 'ge_inf_467_1', hex: 'F5', condition: 'ready', mfSpent: 0 },
    { id: 'u_3', defId: 'ge_inf_467_1', hex: 'F5', condition: 'ready', mfSpent: 0 },
    { id: 'u_4', defId: 'ge_inf_467_1', hex: 'F5', condition: 'ready', mfSpent: 0 },
    { id: 'u_5', defId: 'ge_inf_467_1', hex: 'F5', condition: 'ready', mfSpent: 0 },
    { id: 'u_6', defId: 'ge_inf_467_1', hex: 'F5', condition: 'ready', mfSpent: 0 },
  ],

};
