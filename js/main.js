import * as THREE from "three";
import { Scene3D } from "./scene3d.js";
import { Grid } from "./grid.js";
import { AudioManager } from "./audio.js";
import { Game } from "./game.js";
import { UIManager } from "./ui.js";
const sc = new Scene3D(document.getElementById("view"));
const grid = new Grid(sc.scene),
  audio = new AudioManager(),
  game = new Game(sc, grid, audio),
  ui = new UIManager(game, audio, sc);
game.ui = ui;
game.reset();
ui.init(); // reset first so HUD has state to display
addEventListener("pointerdown", () => audio.unlock()); // unlock audio on first interaction

// Click/tap picking (ignores drags)
const ray = new THREE.Raycaster(),
  v2 = new THREE.Vector2(),
  cv = sc.r.domElement;
let down = null;
cv.addEventListener("pointerdown", (e) => (down = [e.clientX, e.clientY]));
cv.addEventListener("pointerup", (e) => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 10)
    return;
  const r = cv.getBoundingClientRect();
  v2.set(
    ((e.clientX - r.left) / r.width) * 2 - 1,
    -((e.clientY - r.top) / r.height) * 2 + 1,
  );
  ray.setFromCamera(v2, sc.cam);
  const hit = ray
    .intersectObjects(game.pickables(), false)
    .find((h) => h.object.userData.x !== undefined);
  ui.pickTile(hit ? hit.object.userData : null);
});
// Auto-pause when the tab is hidden
document.addEventListener("visibilitychange", () => {
  if (document.hidden && !game.paused) document.getElementById("pause").click();
});

let last = performance.now();
(function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  requestAnimationFrame(frame); // schedule first so one error can't kill the loop
  try {
    game.update(dt);
    ui.tick(dt);
    sc.update(dt);
  } catch (err) {
    console.error(err);
  }
})(last);
