// Tower: distinct 3D silhouettes, targeting, firing, upgrades.
import * as THREE from 'three';
import { TOWERS } from './config.js';
import { Projectile } from './projectile.js';
export class Tower {
  constructor(type, x, y, pos, scene) {
    Object.assign(this, { type, x, y, def: TOWERS[type], level: 1, cd: 0, flash: 0, scene });
    this.spent = this.def.cost;
    this.g = new THREE.Group(); this.g.position.copy(pos);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.42, .45, .12, 16), new THREE.MeshStandardMaterial({ color: 0x1d2433, roughness: .6, metalness: .5 }));
    base.position.y = .06; base.receiveShadow = true; this.g.add(base);
    this.build(); scene.add(this.g);
  }
  get dmg() { return this.def.dmg * Math.pow(1.6, this.level - 1); }
  get range() { return this.def.range * (1 + .12 * (this.level - 1)); }
  get rate() { return this.def.rate * (1 + .15 * (this.level - 1)); }
  upgradeCost() { return this.level >= 3 ? null : Math.round(this.def.cost * (this.level === 1 ? .8 : 1.2)); }
  sellValue() { return Math.floor(this.spent * .5); }
  get meshes() { const a = []; this.g.traverse(o => o.isMesh && a.push(o)); return a; }
  build() { // (re)build the rotating top section; scaled up per level
    if (this.top) this.g.remove(this.top);
    const d = this.def, top = new THREE.Group(), T = THREE;
    const m = new T.MeshStandardMaterial({ color: d.color, roughness: .4, metalness: .5, emissive: d.color, emissiveIntensity: .15 });
    const dk = new T.MeshStandardMaterial({ color: 0x2b2f3a, roughness: .6, metalness: .6 });
    const add = (geo, mat, x, y, z) => { const o = new T.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = true; top.add(o); return o; };
    let tip = [0, .7, 0]; this.crystal = null;
    if (this.type === 'cannon') { add(new T.CylinderGeometry(.28, .34, .4, 16), m, 0, .3, 0); add(new T.CylinderGeometry(.08, .1, .55, 10).rotateX(Math.PI / 2), dk, 0, .55, .3); tip = [0, .55, .6]; }
    else if (this.type === 'sniper') { add(new T.CylinderGeometry(.12, .2, 1, 8), m, 0, .6, 0); add(new T.BoxGeometry(.3, .12, .3), dk, 0, 1.15, 0); add(new T.CylinderGeometry(.04, .05, .9, 8).rotateX(Math.PI / 2), dk, 0, 1.15, .45); tip = [0, 1.15, .9]; }
    else { this.crystal = add(new T.OctahedronGeometry(.32), m, 0, .7, 0); this.crystal.scale.y = 1.7; add(new T.CylinderGeometry(.25, .3, .2, 6), dk, 0, .2, 0); }
    this.muz = new T.Mesh(new T.SphereGeometry(.1, 8, 8), new T.MeshBasicMaterial({ color: d.proj }));
    this.muz.position.set(...tip); this.muz.visible = false; top.add(this.muz);
    top.scale.setScalar(1 + .12 * (this.level - 1));
    this.top = top; this.g.add(top);
    this.g.traverse(o => { if (o.isMesh) o.userData = { x: this.x, y: this.y }; });
  }
  update(dt, enemies, game) {
    this.cd -= dt;
    if (this.flash > 0 && (this.flash -= dt) <= 0) this.muz.visible = false;
    if (this.crystal) this.crystal.rotation.y += dt * 1.5;
    const p = this.g.position, r = this.range; let best = null;
    for (const e of enemies) { // target = enemy furthest along the path within range
      if (e.dead) continue;
      const dx = e.g.position.x - p.x, dz = e.g.position.z - p.z;
      if (dx * dx + dz * dz <= r * r && (!best || e.progress > best.progress)) best = e;
    }
    if (!best) return;
    if (!this.crystal) this.top.rotation.y = Math.atan2(best.g.position.x - p.x, best.g.position.z - p.z);
    if (this.cd <= 0) {
      this.cd = 1 / this.rate; this.muz.visible = true; this.flash = .07;
      const from = new THREE.Vector3(); this.muz.getWorldPosition(from);
      game.projectiles.push(new Projectile(from, best, this, this.scene));
      game.audio.play('shoot', this.type);
    }
  }
  dispose() { this.scene.remove(this.g); this.g.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); }
}
