// Tower: silhouettes that evolve per level (6 levels), targeting, firing and special abilities.
import * as THREE from 'three';
import { TOWERS, UPGRADE_INFLATION, STEP, MAX_LEVEL, UP_MULT } from './config.js';
import { Projectile } from './projectile.js';
const LCOL = [0x888888, 0xcd7f32, 0xc0c0c0, 0xffd700, 0x66e0ff, 0xff66ff]; // trim colour per level
export class Tower {
  constructor(type, x, y, pos, scene) {
    Object.assign(this, { type, x, y, def: TOWERS[type], level: 1, cd: 0, flash: 0, scene, stun: 0, gone: false, shots: 0 });
    this.spent = this.def.cost;
    this.g = new THREE.Group(); this.g.position.copy(pos);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.42, .45, .12, 16), new THREE.MeshStandardMaterial({ color: 0x1d2433, roughness: .6, metalness: .5 }));
    base.position.y = .06; base.receiveShadow = true; this.g.add(base);
    this.build(); scene.add(this.g); this.hp = this.maxHp; this.initBar();
  }
  get dmg() { return this.def.dmg * Math.pow(1.4, this.level - 1); }
  get range() { return this.def.range * (1 + .1 * (this.level - 1)); }
  get rate() { return this.def.rate * (1 + .12 * (this.level - 1)); }
  get multi() { return this.type === 'sniper' && this.level >= 4 ? this.level - 2 : 1; } // sniper: multi-shot from level 4
  get maxHp() { return this.def.hp * (1 + .3 * (this.level - 1)); }
  upgradeCost(wave = 0) { // pricier each level and every STEP waves
    return this.level >= MAX_LEVEL ? null : Math.round(this.def.cost * UP_MULT[this.level - 1] * (1 + UPGRADE_INFLATION * Math.floor(wave / STEP)));
  }
  sellValue() { return Math.floor(this.spent * .5); }
  initBar() {
    const T = THREE; this.bar = new T.Group();
    const bg = new T.Mesh(new T.PlaneGeometry(.7, .08), new T.MeshBasicMaterial({ color: 0x111111, depthTest: false }));
    this.fg = new T.Mesh(new T.PlaneGeometry(.7, .08), new T.MeshBasicMaterial({ color: 0x44ff66, depthTest: false }));
    bg.renderOrder = 10; this.fg.renderOrder = 11; this.fg.position.z = .001; this.bar.add(bg, this.fg);
    this.bar.position.copy(this.g.position).y += 1.6; this.bar.visible = false; this.scene.add(this.bar);
  }
  updBar(cam) {
    const r = Math.max(this.hp / this.maxHp, .001);
    this.bar.visible = this.hp < this.maxHp || this.stun > 0; this.fg.scale.x = r; this.fg.position.x = -(1 - r) * .35;
    this.fg.material.color.setHex(this.stun > 0 ? 0x66ccff : 0x44ff66); this.bar.quaternion.copy(cam.quaternion);
  }
  build() { // (re)build the top section; each level adds visible upgrades
    if (this.top) this.g.remove(this.top);
    const T = THREE, d = this.def, L = this.level, top = new T.Group();
    const m = new T.MeshStandardMaterial({ color: d.color, roughness: .4, metalness: .5, emissive: d.color, emissiveIntensity: .1 + .06 * L });
    const dk = new T.MeshStandardMaterial({ color: 0x2b2f3a, roughness: .6, metalness: .6 });
    const lm = new T.MeshStandardMaterial({ color: LCOL[L - 1], metalness: .9, roughness: .25, emissive: L > 1 ? LCOL[L - 1] : 0, emissiveIntensity: .35 });
    const add = (geo, mat, x, y, z, grp = top) => { const o = new T.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = true; grp.add(o); return o; };
    const ring = (y, r) => add(new T.TorusGeometry(r, .035, 6, 18).rotateX(Math.PI / 2), lm, 0, y, 0);
    const Cy = (a, b, h, n = 12) => new T.CylinderGeometry(a, b, h, n), Sp = r => new T.SphereGeometry(r, 10, 8);
    const gun = (r1, r2, len) => Cy(r1, r2, len, 10).rotateX(Math.PI / 2);
    let tip = [0, .7, 0]; this.crystal = null; this.spin = null;
    if (this.type === 'cannon') {
      add(Cy(.28, .34, .4, 16), m, 0, .3, 0);
      if (L >= 3) { add(gun(.07, .09, .55), dk, -.13, .55, .3); add(gun(.07, .09, .55), dk, .13, .55, .3); } else add(gun(.08, .1, .55), dk, 0, .55, .3);
      tip = [0, .55, .6];
      if (L >= 2) ring(.45, .3);
      if (L >= 4) ring(.18, .37);
      if (L >= 5) for (const k of [1, -1]) add(new T.BoxGeometry(.1, .3, .26), lm, k * .33, .35, 0);
      if (L >= 6) add(Sp(.13), lm, 0, .78, -.12);
    } else if (this.type === 'sniper') {
      add(Cy(.12, .2, 1, 8), m, 0, .6, 0); add(new T.BoxGeometry(.3, .12, .3), dk, 0, 1.15, 0);
      if (L >= 5) { add(gun(.035, .045, .9), dk, -.07, 1.15, .45); add(gun(.035, .045, .9), dk, .07, 1.15, .45); } else add(gun(.04, .05, .9), dk, 0, 1.15, .45);
      tip = [0, 1.15, .9];
      if (L >= 2) ring(.5, .17);
      if (L >= 3) add(Sp(.08), lm, .12, 1.25, .2);
      if (L >= 4) ring(.85, .14);
      if (L >= 6) add(new T.ConeGeometry(.03, .5, 5), lm, 0, 1.5, 0);
    } else if (this.type === 'freezer') {
      this.crystal = add(new T.OctahedronGeometry(.32), m, 0, .7, 0); this.crystal.scale.y = 1.7; add(Cy(.25, .3, .2, 6), dk, 0, .2, 0);
      this.spin = new T.Group(); this.spin.position.y = .7; top.add(this.spin);
      for (let i = 0; i < L - 1; i++) { const a = i / (L - 1) * Math.PI * 2; add(new T.OctahedronGeometry(.1), lm, Math.cos(a) * .5, Math.sin(i) * .15, Math.sin(a) * .5, this.spin); }
      if (L >= 3) ring(.3, .3);
    } else if (this.type === 'fire') { // brazier with flames that grow per level
      add(Cy(.26, .34, .45, 10), dk, 0, .32, 0); add(Cy(.34, .28, .12, 10), m, 0, .6, 0);
      const fl = new T.MeshStandardMaterial({ color: 0xff7722, emissive: 0xff4400, emissiveIntensity: 1.2 });
      this.spin = new T.Group(); this.spin.position.y = .8; top.add(this.spin);
      add(new T.ConeGeometry(.2 + .02 * L, .5 + .06 * L, 7), fl, 0, .25, 0, this.spin);
      for (let i = 0; i < L - 1; i++) { const a = i / (L - 1) * Math.PI * 2; add(new T.ConeGeometry(.09, .3, 5), fl, Math.cos(a) * .22, .1, Math.sin(a) * .22, this.spin); }
      tip = [0, .95, 0];
      if (L >= 2) ring(.5, .34);
      if (L >= 4) ring(.2, .38);
      if (L >= 5) for (const k of [1, -1]) add(Cy(.04, .04, .5, 6), lm, k * .3, .45, 0);
      if (L >= 6) add(Sp(.12), lm, 0, 1.35, 0);
    } else if (this.type === 'tesla') { // coil: more rings and spikes per level
      add(Cy(.2, .3, .5, 8), dk, 0, .35, 0); add(Cy(.12, .18, .6, 8), m, 0, .85, 0);
      for (let i = 0; i < 2 + Math.ceil(L / 2); i++) ring(.55 + i * .17, Math.max(.1, .2 - i * .02));
      add(Sp(.16 + .01 * L), new T.MeshStandardMaterial({ color: 0xbfe4ff, emissive: 0x66bbff, emissiveIntensity: 1.5 }), 0, 1.3, 0); tip = [0, 1.3, 0];
      if (L >= 3) for (const k of [1, -1]) add(Cy(.025, .025, .5, 5), lm, k * .28, .8, 0);
      if (L >= 5) add(new T.ConeGeometry(.05, .4, 5), lm, 0, 1.6, 0);
    } else if (this.type === 'mortar') { // squat tilted barrel
      add(Cy(.34, .4, .3, 10), dk, 0, .22, 0); add(Cy(.18, .26, .6, 10).rotateX(Math.PI / 4), m, 0, .6, .1); tip = [0, .95, .35];
      if (L >= 2) ring(.4, .36);
      if (L >= 3) add(Cy(.1, .12, .5, 8).rotateX(Math.PI / 4), dk, .28, .55, .1);
      if (L >= 4) ring(.28, .4);
      if (L >= 5) for (const k of [1, -1]) add(Sp(.1), lm, k * .35, .4, -.1);
      if (L >= 6) add(Sp(.12), lm, 0, .8, -.2);
    } else { // poison: bubbling cauldron
      add(Cy(.3, .2, .4), dk, 0, .3, 0);
      add(Cy(.27, .27, .03), new T.MeshStandardMaterial({ color: 0x66dd33, emissive: 0x44aa11, emissiveIntensity: .9 }), 0, .5, 0);
      tip = [0, .6, 0]; ring(.48, .3);
      this.spin = new T.Group(); this.spin.position.y = .65; top.add(this.spin);
      for (let i = 0; i < L + 1; i++) { const a = i / (L + 1) * Math.PI * 2; add(Sp(.07 + .01 * L), m, Math.cos(a) * .18, Math.sin(i * 2) * .1, Math.sin(a) * .18, this.spin); }
      if (L >= 4) add(new T.ConeGeometry(.05, .3, 5), lm, .22, .5, 0);
    }
    this.muz = new T.Mesh(new T.SphereGeometry(.1, 8, 8), new T.MeshBasicMaterial({ color: d.proj }));
    this.muz.position.set(...tip); this.muz.visible = false; top.add(this.muz);
    top.scale.setScalar(1 + .07 * (L - 1)); this.top = top; this.g.add(top);
  }
  update(dt, enemies, game) {
    this.cd -= dt; this.stun -= dt; this.updBar(game.sc.cam);
    if (this.flash > 0 && (this.flash -= dt) <= 0) this.muz.visible = false;
    if (this.crystal) this.crystal.rotation.y += dt * 1.5;
    if (this.spin) this.spin.rotation.y += dt * 2;
    const p = this.g.position, r = this.range, list = [];
    for (const e of enemies) {
      if (e.dead) continue;
      const dx = e.g.position.x - p.x, dz = e.g.position.z - p.z;
      if (dx * dx + dz * dz <= r * r) list.push(e);
    }
    if (!list.length || this.stun > 0) return; // stunned towers can't fire
    list.sort((a, b) => b.progress - a.progress); // furthest along the path first
    const best = list[0];
    if (this.type === 'cannon' || this.type === 'sniper' || this.type === 'mortar') this.top.rotation.y = Math.atan2(best.g.position.x - p.x, best.g.position.z - p.z);
    if (this.cd <= 0) {
      this.cd = 1 / this.rate; this.muz.visible = true; this.flash = .07;
      const from = new THREE.Vector3(); this.muz.getWorldPosition(from);
      for (let k = 0; k < Math.min(this.multi, list.length); k++) game.projectiles.push(new Projectile(from, list[k], this, this.scene));
      game.audio.play('shoot', this.type);
      this.shots++; if (this.def.nova && this.level >= 3 && this.shots % 10 === 0) game.nova(this); // nova unlocks at level 3
    }
  }
  static broken(type, pos, scene) { // distinct ruined version of each tower, left behind after it explodes
    const T = THREE, g = new T.Group(), col = TOWERS[type].color; g.position.copy(pos);
    const ch = new T.MeshStandardMaterial({ color: new T.Color(col).multiplyScalar(.35), roughness: .9, metalness: .2 }), dk = new T.MeshStandardMaterial({ color: 0x23262e, roughness: .9 });
    const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new T.Mesh(geo, mat); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; g.add(o); return o; };
    const Cy = (a, b, h, n = 8) => new T.CylinderGeometry(a, b, h, n), glow = (c, i = 1.2) => new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i });
    add(Cy(.42, .45, .1, 14), dk, 0, .05, 0);
    if (type === 'cannon') { add(Cy(.28, .34, .25, 10), ch, 0, .2, 0, .15, 0, .1); add(Cy(.08, .1, .5), dk, .3, .12, .25, 0, 0, Math.PI / 2.2); }
    else if (type === 'sniper') { add(Cy(.12, .2, .45), ch, 0, .3, 0, .2, 0, -.15); add(Cy(.04, .05, .9, 6), dk, .1, .08, .45, Math.PI / 2, 0, .2); add(new T.BoxGeometry(.25, .1, .25), dk, -.25, .1, -.1, .3, .5, .2); }
    else if (type === 'freezer') { const ice = new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .35, roughness: .3, transparent: true, opacity: .85 }); for (let i = 0; i < 5; i++) { const a = i * 1.3; add(new T.OctahedronGeometry(.1 + .05 * (i % 2)), ice, Math.cos(a) * .28, .1 + .1 * (i % 3 === 0), Math.sin(a) * .28, i, i * .7, 0); } add(new T.ConeGeometry(.12, .45, 5), ice, 0, .25, 0, .25, 0, .2); }
    else if (type === 'poison') { add(Cy(.3, .2, .3, 12), dk, .05, .2, 0, 0, 0, 1.2); add(Cy(.34, .34, .02, 14), glow(0x66dd33, .8), .15, .11, .15); }
    else if (type === 'fire') { add(Cy(.34, .28, .12, 10), ch, .1, .12, 0, .9, 0, 0); add(Cy(.05, .06, .5, 6), dk, -.2, .1, .2, 0, 0, Math.PI / 2); add(new T.ConeGeometry(.1, .25, 6), glow(0xff7722), 0, .2, 0); }
    else if (type === 'tesla') { add(Cy(.2, .3, .3), dk, 0, .2, 0); add(Cy(.1, .14, .5), ch, .15, .15, .1, 0, 0, 1.1); for (let i = 0; i < 3; i++) add(new T.TorusGeometry(.18 - .03 * i, .03, 6, 14), ch, .3 + i * .12, .05, .05 + i * .08, Math.PI / 2, 0, 0); add(new T.SphereGeometry(.08, 8, 8), glow(0xbfe4ff, 1.4), 0, .35, 0); }
    else { add(Cy(.34, .4, .2, 10), dk, 0, .15, 0); add(Cy(.18, .26, .55, 10), ch, .2, .15, .1, 0, 0, 1.2); add(new T.SphereGeometry(.12, 8, 8), dk, -.25, .12, .2); }
    scene.add(g); return g;
  }
  dispose() { this.gone = true; this.scene.remove(this.g, this.bar); this.g.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); }
}
