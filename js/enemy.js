// Enemy: low-poly mesh, waypoint-following AI, HP bar, slow effect.
import * as THREE from 'three';
import { ENEMIES } from './config.js';
export class Enemy {
  constructor(type, hpMul, wps, scene) {
    const c = ENEMIES[type], s = c.size;
    Object.assign(this, { c, type, wps, i: 1, slow: 0, slowMul: 1, dead: false, reached: false, progress: 0, flash: 0, t: Math.random() * 6 });
    this.max = this.hp = c.hp * hpMul;
    this.mat = new THREE.MeshStandardMaterial({ color: c.color, roughness: .5, metalness: .2 });
    this.g = new THREE.Group();
    this.body = new THREE.Mesh(new THREE.CapsuleGeometry(s, s * 1.2, 4, 8), this.mat); this.body.position.y = s * 1.6;
    const head = new THREE.Mesh(new THREE.ConeGeometry(s * .7, s * 1.1, 6), this.mat); head.position.y = s * 3.7;
    this.body.castShadow = head.castShadow = true; this.g.add(this.body, head);
    this.g.position.copy(wps[0]); scene.add(this.g);
    // HP bar (billboarded each frame, lives in the scene)
    this.bar = new THREE.Group(); this.barY = s * 5 + .25;
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(.5, .07), new THREE.MeshBasicMaterial({ color: 0x111111, depthTest: false }));
    this.fg = new THREE.Mesh(new THREE.PlaneGeometry(.5, .07), new THREE.MeshBasicMaterial({ color: 0x44ff66, depthTest: false }));
    bg.renderOrder = 10; this.fg.renderOrder = 11; this.fg.position.z = .001; this.bar.add(bg, this.fg); scene.add(this.bar);
  }
  update(dt, cam) {
    this.t += dt; this.slow -= dt;
    let move = this.c.speed * (this.slow > 0 ? this.slowMul : 1) * dt;
    const pos = this.g.position;
    while (move > 0) {
      const tg = this.wps[this.i], d = pos.distanceTo(tg);
      this.g.rotation.y = Math.atan2(tg.x - pos.x, tg.z - pos.z);
      if (d <= move) { pos.copy(tg); move -= d; if (++this.i >= this.wps.length) { this.reached = true; return; } }
      else { pos.addScaledVector(tg.clone().sub(pos).normalize(), move); move = 0; }
    }
    this.progress = this.i * 100 - pos.distanceTo(this.wps[this.i]);
    this.body.position.y = this.c.size * 1.6 + Math.abs(Math.sin(this.t * 8)) * .06; // walk bob
    this.flash -= dt; this.mat.emissive.setHex(this.flash > 0 ? 0xffffff : this.slow > 0 ? 0x1188aa : 0);
    this.bar.position.copy(pos).y += this.barY; this.bar.quaternion.copy(cam.quaternion);
  }
  hit(d) { this.hp -= d; this.flash = .08; const r = Math.max(this.hp / this.max, 0); this.fg.scale.x = r || .001; this.fg.position.x = -(1 - r) * .25; if (this.hp <= 0) this.dead = true; }
  applySlow(mul, t) { this.slowMul = mul; this.slow = t; }
  dispose(scene) {
    scene.remove(this.g, this.bar);
    [this.g, this.bar].forEach(o => o.traverse(m => { m.geometry?.dispose(); if (m.material && m.material !== this.mat) m.material.dispose(); }));
    this.mat.dispose();
  }
}
