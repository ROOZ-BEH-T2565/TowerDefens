// Tile grid, path, build-tile logic.
import * as THREE from 'three';
import { GRID, PATH } from './config.js';
export const wp = (x, y) => new THREE.Vector3(x - (GRID - 1) / 2, 0, y - (GRID - 1) / 2);
export class Grid {
  constructor(scene) {
    this.pathSet = new Set(); this.occ = new Map(); this.meshes = []; this.hl = null;
    for (let i = 0; i < PATH.length - 1; i++) { // rasterize straight segments into path tiles
      const [ax, ay] = PATH[i], [bx, by] = PATH[i + 1], dx = Math.sign(bx - ax), dy = Math.sign(by - ay);
      let x = ax, y = ay;
      for (;;) { this.pathSet.add(x + ',' + y); if (x === bx && y === by) break; x += dx; y += dy; }
    }
    this.waypoints = PATH.map(([x, y]) => wp(x, y));
    const geo = new THREE.BoxGeometry(.96, .2, .96);
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
      const p = this.pathSet.has(x + ',' + y);
      const mat = new THREE.MeshStandardMaterial(p
        ? { color: 0xd4a24c, roughness: .7, emissive: 0x553300, emissiveIntensity: .5 }
        : { color: (x + y) % 2 ? 0x2c3e5a : 0x32476a, roughness: .8, emissive: 0x000000 });
      const m = new THREE.Mesh(geo, mat); m.position.copy(wp(x, y)); m.position.y = -.1;
      m.receiveShadow = true; m.userData = { x, y, path: p }; scene.add(m); this.meshes.push(m);
    }
    const base = new THREE.Mesh(new THREE.BoxGeometry(.7, .8, .7), new THREE.MeshStandardMaterial({ color: 0xff4d6d, emissive: 0xff2244, emissiveIntensity: .6 }));
    base.position.copy(this.waypoints.at(-1)).y = .4; base.castShadow = true; scene.add(base);
    const spawn = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .5, 16), new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x22d3ee, emissiveIntensity: .6 }));
    spawn.position.copy(this.waypoints[0]).y = .25; scene.add(spawn);
  }
  isBuildable(x, y) { return !this.pathSet.has(x + ',' + y) && !this.occ.has(x + ',' + y); }
  highlight(x, y) { // glow on the selected tile
    if (this.hl) this.hl.material.emissive.setHex(0);
    this.hl = x == null ? null : this.meshes[y * GRID + x];
    if (this.hl) { this.hl.material.emissive.setHex(0x1a8aa0); }
  }
}
