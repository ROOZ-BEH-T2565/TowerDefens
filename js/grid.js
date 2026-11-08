// Tile grid for the current level: path, fixed build plots (the only buildable tiles), themed colours.
import * as THREE from 'three';
import { GRID, pathTiles, plotsFor } from './config.js';
export const wp = (x, y) => new THREE.Vector3(x - (GRID - 1) / 2, 0, y - (GRID - 1) / 2);
export class Grid {
  constructor(scene) { this.scene = scene; this.occ = new Map(); this.meshes = []; this.hl = null; this.root = null; this.pathSet = new Set(); this.plotSet = new Set(); this.waypoints = []; }
  load(L) { // (re)build everything for a level
    if (this.root) { this.scene.remove(this.root); this.root.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); }
    const root = this.root = new THREE.Group(), th = L.theme;
    this.meshes = []; this.occ.clear(); this.hl = null; this.pathSet = pathTiles(L.path);
    const plots = plotsFor(L); this.plotSet = new Set(plots.map(p => p.join(','))); this.waypoints = L.path.map(([x, y]) => wp(x, y));
    const geo = new THREE.BoxGeometry(.96, .2, .96), light = c => new THREE.Color(c).lerp(new THREE.Color(0xffffff), .2);
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
      const k = x + ',' + y, p = this.pathSet.has(k), pl = this.plotSet.has(k), base = th.tile[(x + y) % 2];
      const mat = new THREE.MeshStandardMaterial(p ? { color: th.path, roughness: .7, emissive: new THREE.Color(th.path).multiplyScalar(.25) } : { color: pl ? light(base) : base, roughness: .8, emissive: 0x000000 });
      const m = new THREE.Mesh(geo, mat); m.position.copy(wp(x, y)); m.position.y = -.1; m.receiveShadow = true; m.userData = { x, y, path: p, plot: pl };
      root.add(m); this.meshes.push(m);
    }
    const padM = new THREE.MeshBasicMaterial({ color: 0x66e0ff, transparent: true, opacity: .75 }), discM = new THREE.MeshBasicMaterial({ color: 0x66e0ff, transparent: true, opacity: .14 });
    for (const [x, y] of plots) { // glowing pad marks every build plot
      const r = new THREE.Mesh(new THREE.RingGeometry(.33, .41, 28).rotateX(-Math.PI / 2), padM), d = new THREE.Mesh(new THREE.CircleGeometry(.33, 24).rotateX(-Math.PI / 2), discM);
      r.position.copy(wp(x, y)).y = .012; d.position.copy(r.position); root.add(r, d);
    }
    const base = new THREE.Mesh(new THREE.BoxGeometry(.7, .8, .7), new THREE.MeshStandardMaterial({ color: 0xff4d6d, emissive: 0xff2244, emissiveIntensity: .6 }));
    base.position.copy(this.waypoints.at(-1)).y = .4; base.castShadow = true;
    const spawn = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .5, 16), new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x22d3ee, emissiveIntensity: .6 }));
    spawn.position.copy(this.waypoints[0]).y = .25; root.add(base, spawn);
    this.scene.add(root);
  }
  isBuildable(x, y) { const k = x + ',' + y; return this.plotSet.has(k) && !this.occ.has(k); }
  highlight(x, y) { // glow on the selected tile
    if (this.hl) this.hl.material.emissive.setHex(0);
    this.hl = x == null ? null : this.meshes[y * GRID + x];
    if (this.hl) this.hl.material.emissive.setHex(0x1a8aa0);
  }
}
