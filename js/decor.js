// Scenery: forest/rocks around the board, blocked decorative tiles, grass tufts, flowers and pebbles (instanced for speed).
import * as THREE from 'three';
import { GRID, DECOR_TILES } from './config.js';
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const dummy = new THREE.Object3D();
function inst(scene, geo, items, shadow = true) { // one InstancedMesh with per-item transform + colour
  const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: .9 }), items.length);
  items.forEach((it, i) => {
    dummy.position.set(it.x, it.y, it.z); dummy.rotation.set(0, it.ry || 0, 0); dummy.scale.set(it.s, it.sy ?? it.s, it.s); dummy.updateMatrix();
    m.setMatrixAt(i, dummy.matrix); m.setColorAt(i, new THREE.Color(it.c));
  });
  m.castShadow = shadow; m.receiveShadow = true; scene.add(m); return m;
}
const pick = a => a[Math.floor(rnd() * a.length)];
export function buildDecor(scene, grid) {
  const G = [0x2f7a3a, 0x3a8a3f, 0x2a6a35, 0x4a9a45], R = [0x7a7d85, 0x6a6d75, 0x8a8c92];
  const trees = [], rocks = [], bushes = [];
  for (let n = 0; n < 150; n++) { // ring outside the board
    const a = rnd() * 6.283, r = 8 + rnd() * 9, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.abs(x) < 7.2 && Math.abs(z) < 7.2) continue;
    const k = rnd(), s = .7 + rnd() * .9;
    if (k < .6) trees.push({ x, y: 0, z, s, ry: rnd() * 6, c: pick(G) });
    else if (k < .85) rocks.push({ x, y: .1, z, s: .3 + rnd() * .4, sy: .2 + rnd() * .3, ry: rnd() * 6, c: pick(R) });
    else bushes.push({ x, y: .15, z, s: .3 + rnd() * .3, sy: .25, c: pick(G) });
  }
  const trunk = new THREE.CylinderGeometry(.07, .1, .5, 6).translate(0, .25, 0);
  inst(scene, trunk, trees.map(t => ({ ...t, c: 0x5a3a1f })));
  inst(scene, new THREE.ConeGeometry(.5, .95, 7).translate(0, .75, 0), trees);
  inst(scene, new THREE.ConeGeometry(.36, .8, 7).translate(0, 1.2, 0), trees);
  inst(scene, new THREE.DodecahedronGeometry(1), rocks);
  inst(scene, new THREE.SphereGeometry(1, 7, 6), bushes);
  // small flora on tiles (does not block building) + pebbles on the path
  const tufts = [], flowers = [], pebbles = [], W = (GRID - 1) / 2;
  for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
    const px = x - W, pz = y - W, p = grid.pathSet.has(x + ',' + y);
    const at = () => ({ x: px + (rnd() - .5) * .8, z: pz + (rnd() - .5) * .8 });
    if (p) { if (rnd() < .6) pebbles.push({ ...at(), y: .02, s: .04 + rnd() * .05, sy: .03, ry: rnd() * 6, c: pick(R) }); continue; }
    if (rnd() < .7) tufts.push({ ...at(), y: .02, s: .07 + rnd() * .05, sy: .08 + rnd() * .05, c: pick(G) });
    if (rnd() < .15) flowers.push({ ...at(), y: .08, s: .04, c: pick([0xffd24a, 0xff7aa8, 0xffffff, 0xb08cff]) });
  }
  inst(scene, new THREE.ConeGeometry(1, 1.4, 4).translate(0, .7, 0), tufts, false);
  inst(scene, new THREE.SphereGeometry(1, 6, 5), flowers, false);
  inst(scene, new THREE.DodecahedronGeometry(1), pebbles, false);
  // blocked decorative tiles: big trees and boulders you cannot build on
  const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: .9 });
  for (const [x, y, kind] of DECOR_TILES) {
    const g = new THREE.Group(); g.position.set(x - W, 0, y - W); g.rotation.y = rnd() * 6;
    const add = (geo, m, px, py, pz, sc = 1) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.scale.setScalar(sc); o.castShadow = true; g.add(o); };
    if (kind === 'tree') { add(new THREE.CylinderGeometry(.1, .14, .8, 7), mat(0x5a3a1f), 0, .4, 0); add(new THREE.ConeGeometry(.5, 1, 8), mat(0x2f7a3a), 0, 1.1, 0); add(new THREE.ConeGeometry(.38, .85, 8), mat(0x3a8a3f), 0, 1.65, 0); }
    else { add(new THREE.DodecahedronGeometry(.4), mat(0x7a7d85), 0, .3, 0, 1); add(new THREE.DodecahedronGeometry(.25), mat(0x6a6d75), .3, .15, .2); add(new THREE.DodecahedronGeometry(.2), mat(0x8a8c92), -.28, .12, -.18); }
    scene.add(g);
  }
}
