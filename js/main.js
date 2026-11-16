// Bootstrap, input (tap, drag-pan, pinch / wheel zoom) and game loop.
import * as THREE from "three";
import { Scene3D } from "./scene3d.js";
import { Grid } from "./grid.js";
import { AudioManager } from "./audio.js";
import { Game } from "./game.js";
import { UIManager } from "./ui.js";
import { RemoteGame } from "./net.js";
const sc = new Scene3D(document.getElementById("view"));
const grid = new Grid(sc.scene),
  audio = new AudioManager(),
  game = new Game(sc, grid, audio),
  ui = new UIManager(game, audio, sc);
const remote = new RemoteGame(sc, grid, audio); // multiplayer client view (the host uses the normal Game)
game.ui = ui;
remote.ui = ui;
ui.attach(remote);
game.start(0, ["cannon"]);
ui.init(); // level 1 renders behind the menus
addEventListener("pointerdown", () => audio.unlock()); // unlock audio on first interaction

const ray = new THREE.Raycaster(),
  v2 = new THREE.Vector2(),
  cv = sc.r.domElement,
  ptrs = new Map();
let downPt = null,
  moved = false,
  pinch = 0;
const span = () => {
  const [a, b] = [...ptrs.values()];
  return Math.hypot(a.x - b.x, a.y - b.y);
};
function pick(e) {
  // tap on a tile
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
}
cv.addEventListener("pointerdown", (e) => {
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 1) {
    downPt = [e.clientX, e.clientY];
    moved = false;
  } else {
    moved = true;
    pinch = span();
  }
});
cv.addEventListener("pointermove", (e) => {
  const p = ptrs.get(e.pointerId);
  if (!p) return;
  const dx = e.clientX - p.x,
    dy = e.clientY - p.y;
  p.x = e.clientX;
  p.y = e.clientY;
  if (ptrs.size === 2) {
    const d = span();
    if (pinch) sc.zoomBy(pinch / d);
    pinch = d;
  } // pinch zoom
  else if (ptrs.size === 1) {
    if (!moved && Math.hypot(e.clientX - downPt[0], e.clientY - downPt[1]) > 10)
      moved = true;
    else if (moved) sc.pan(dx, dy);
  } // drag pan
});
cv.addEventListener("pointerup", (e) => {
  if (!ptrs.delete(e.pointerId)) return;
  if (ptrs.size === 0) {
    pinch = 0;
    if (!moved) pick(e);
  }
});
cv.addEventListener("pointercancel", (e) => {
  ptrs.delete(e.pointerId);
  pinch = 0;
});
cv.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    sc.zoomBy(e.deltaY > 0 ? 1.1 : 1 / 1.1);
  },
  { passive: false },
);
// Auto-pause when the tab is hidden
document.addEventListener("visibilitychange", () => {
  if (document.hidden) ui.show("settings");
});

let last = performance.now();
(function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  requestAnimationFrame(frame); // schedule first so one error can't kill the loop
  try {
    const g = ui.game;
    for (let i = 0, n = g.remote ? 1 : ui.speed; i < n; i++) g.update(dt);
    if (ui.net.host) ui.net.host.tick(dt);
    ui.tick(dt);
    sc.update(dt);
  } catch (err) {
    console.error(err);
  }
})(last);
