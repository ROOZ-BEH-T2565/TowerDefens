// Scenery for a level (themed): forest/rocks around the board, big trees/boulders on free tiles, grass tufts, flowers, pebbles.
import * as THREE from "three";
import { GRID, plotsFor } from "./config.js";
const dummy = new THREE.Object3D();
export function buildDecor(scene, grid, L, idx) {
  // returns a Group (remove + dispose it when the level changes)
  let seed = idx * 131 + 7;
  const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    },
    pick = (a) => a[Math.floor(rnd() * a.length)];
  const root = new THREE.Group(),
    th = L.theme,
    F = th.foliage,
    R = th.rock,
    W = (GRID - 1) / 2;
  const inst = (geo, items, shadow = true) => {
    const m = new THREE.InstancedMesh(
      geo,
      new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }),
      items.length,
    );
    items.forEach((it, i) => {
      dummy.position.set(it.x, it.y, it.z);
      dummy.rotation.set(0, it.ry || 0, 0);
      dummy.scale.set(it.s, it.sy ?? it.s, it.s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, new THREE.Color(it.c));
    });
    m.castShadow = shadow;
    m.receiveShadow = true;
    root.add(m);
  };
  const trees = [],
    rocks = [],
    bushes = [];
  for (let n = 0; n < 150; n++) {
    // ring outside the board
    const a = rnd() * 6.283,
      r = 8 + rnd() * 9,
      x = Math.cos(a) * r,
      z = Math.sin(a) * r;
    if (Math.abs(x) < 7.2 && Math.abs(z) < 7.2) continue;
    const k = rnd(),
      s = 0.7 + rnd() * 0.9;
    const front = z > 5.8 && Math.abs(x) < 9; // no tall trees in front of the board (they would hide the front plots)
    if (k < 0.6 && !front)
      trees.push({ x, y: 0, z, s, ry: rnd() * 6, c: pick(F) });
    else if (k < 0.85)
      rocks.push({
        x,
        y: 0.1,
        z,
        s: 0.3 + rnd() * 0.4,
        sy: 0.2 + rnd() * 0.3,
        ry: rnd() * 6,
        c: pick(R),
      });
    else
      bushes.push({
        x,
        y: 0.15,
        z,
        s: 0.3 + rnd() * 0.3,
        sy: 0.25,
        c: pick(F),
      });
  }
  inst(
    new THREE.CylinderGeometry(0.07, 0.1, 0.5, 6).translate(0, 0.25, 0),
    trees.map((t) => ({ ...t, c: 0x5a3a1f })),
  );
  inst(new THREE.ConeGeometry(0.5, 0.95, 7).translate(0, 0.75, 0), trees);
  inst(new THREE.ConeGeometry(0.36, 0.8, 7).translate(0, 1.2, 0), trees);
  inst(new THREE.DodecahedronGeometry(1), rocks);
  inst(new THREE.SphereGeometry(1, 7, 6), bushes);
  const plots = new Set(plotsFor(L).map((p) => p.join(","))),
    sw = L.sweeper ? L.sweeper.join(",") : "",
    free = [];
  const tufts = [],
    flowers = [],
    pebbles = [];
  for (let y = 0; y < GRID; y++)
    for (let x = 0; x < GRID; x++) {
      const k = x + "," + y,
        px = x - W,
        pz = y - W,
        p = grid.pathSet.has(k),
        at = () => ({
          x: px + (rnd() - 0.5) * 0.8,
          z: pz + (rnd() - 0.5) * 0.8,
        });
      if (p) {
        if (rnd() < 0.6)
          pebbles.push({
            ...at(),
            y: 0.02,
            s: 0.04 + rnd() * 0.05,
            sy: 0.03,
            ry: rnd() * 6,
            c: pick(R),
          });
        continue;
      }
      if (plots.has(k) || k === sw) continue; // keep plots and the sweeper tile clear
      free.push([x, y]);
      if (rnd() < 0.7)
        tufts.push({
          ...at(),
          y: 0.02,
          s: 0.07 + rnd() * 0.05,
          sy: 0.08 + rnd() * 0.05,
          c: pick(F),
        });
      if (rnd() < 0.15)
        flowers.push({
          ...at(),
          y: 0.08,
          s: 0.04,
          c: pick([0xffd24a, 0xff7aa8, 0xffffff, 0xb08cff]),
        });
    }
  inst(new THREE.ConeGeometry(1, 1.4, 4).translate(0, 0.7, 0), tufts, false);
  inst(new THREE.SphereGeometry(1, 6, 5), flowers, false);
  inst(new THREE.DodecahedronGeometry(1), pebbles, false);
  const keyTiles = [...plots, ...grid.pathSet];
  if (sw) keyTiles.push(sw);
  const pts = keyTiles.map((k) => k.split(",").map(Number));
  const hides = (x, y) =>
    pts.some(([px, py]) => y - py > 0 && y - py <= 2 && Math.abs(px - x) <= 1); // a tall tree here would cover a plot / path tile behind it
  const mat = (c) =>
    new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 });
  for (let n = 0; n < 11 && free.length; n++) {
    // big trees / boulders on free tiles (not buildable anyway)
    const [x, y] = free.splice(Math.floor(rnd() * free.length), 1)[0],
      g = new THREE.Group();
    g.position.set(x - W, 0, y - W);
    g.rotation.y = rnd() * 6;
    const add = (geo, m, px, py, pz) => {
      const o = new THREE.Mesh(geo, m);
      o.position.set(px, py, pz);
      o.castShadow = true;
      g.add(o);
    };
    if (rnd() < 0.6 && !hides(x, y)) {
      add(
        new THREE.CylinderGeometry(0.1, 0.14, 0.8, 7),
        mat(0x5a3a1f),
        0,
        0.4,
        0,
      );
      add(new THREE.ConeGeometry(0.5, 1, 8), mat(pick(F)), 0, 1.1, 0);
      add(new THREE.ConeGeometry(0.38, 0.85, 8), mat(pick(F)), 0, 1.65, 0);
    } else {
      add(new THREE.DodecahedronGeometry(0.4), mat(pick(R)), 0, 0.3, 0);
      add(new THREE.DodecahedronGeometry(0.25), mat(pick(R)), 0.3, 0.15, 0.2);
      add(
        new THREE.DodecahedronGeometry(0.2),
        mat(pick(R)),
        -0.28,
        0.12,
        -0.18,
      );
    }
    root.add(g);
  }
  scene.add(root);
  return root;
}
