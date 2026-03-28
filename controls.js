const SPEED = 10;
const keys = {};

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

export function startControls(...layers) {
  function loop() {
    let dx = 0, dy = 0;
    if (keys['KeyW']) dy += SPEED;
    if (keys['KeyS']) dy -= SPEED;
    if (keys['KeyA']) dx += SPEED;
    if (keys['KeyD']) dx -= SPEED;

    if (dx !== 0 || dy !== 0) {
      layers.forEach(l => { l.x(l.x() + dx); l.y(l.y() + dy); l.batchDraw(); });
    }

    requestAnimationFrame(loop);
  }
  loop();
}
