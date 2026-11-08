// Enemy: monster models, waypoint AI, elemental status visuals and special abilities.
import * as THREE from 'three';
import { ENEMIES } from './config.js';
const T = THREE;
export const buildModel = type => model(type, ENEMIES[type], []); // for guide thumbnails
function model(type, c, mats) { // low-poly monster facing +z
  const s = c.size, g = new T.Group(), K = c.color;
  const P = (geo, col, x, y, z, o = {}) => { const m = new T.Mesh(geo, new T.MeshStandardMaterial({ color: col, roughness: .6, ...o })); m.material.userData.e = o.emissive || 0; m.position.set(x, y, z); m.castShadow = true; g.add(m); mats.push(m.material); return m; };
  const eye = (x, y, z, col = 0xffee00) => { const m = new T.Mesh(new T.SphereGeometry(s * .14, 6, 6), new T.MeshBasicMaterial({ color: col })); m.position.set(x, y, z); g.add(m); };
  const Cn = (r, h, n = 6) => new T.ConeGeometry(r, h, n), Sp = r => new T.SphereGeometry(r, 10, 8), Cy = (a, b, h, n = 6) => new T.CylinderGeometry(a, b, h, n), Cp = (r, h) => new T.CapsuleGeometry(r, h, 4, 8), Bx = (w, h, d) => new T.BoxGeometry(w, h, d);
  const both = f => { f(1); f(-1); }, glow = col => ({ emissive: col, emissiveIntensity: 1 });
  if (type === 'grunt' || type === 'shaman') { // goblin: ears, teeth, belt, red eyes, club (shaman: hat, staff, orb)
    P(Cp(s * .8, s), K, 0, s * 1.5, 0); P(Sp(s * .85), K, 0, s * 3.2, 0); P(Cy(s * .85, s * .85, s * .18, 10), 0x4a2f1a, 0, s * 1.05, 0);
    both(k => { P(Cn(s * .25, s, 4).rotateZ(-k * Math.PI / 2), K, k * s * 1.2, s * 3.3, 0); eye(k * s * .32, s * 3.4, s * .72, 0xff2222); P(Cn(s * .06, s * .22, 4).rotateX(Math.PI), 0xffffff, k * s * .2, s * 2.88, s * .78); });
    P(Cn(s * .15, s * .4, 5).rotateX(Math.PI / 2), 0x4f8f2a, 0, s * 3.1, s * .9);
    if (type === 'shaman') { P(Cn(s * .9, s * 1.3), 0x5b2a8a, 0, s * 4.3, 0); P(Cy(s * .07, s * .07, s * 3.6, 5), 0x5a3a1a, s * 1.1, s * 1.9, s * .3); P(Sp(s * .28), 0x66ffaa, s * 1.1, s * 3.8, s * .3, glow(0x33ff88)); }
    else { P(Cy(s * .12, s * .28, s * 1.6), 0x6b4423, s * 1.1, s * 1.7, s * .4); P(Sp(s * .16), 0x8a8a8a, s * 1.1, s * 2.5, s * .4); }
  } else if (type === 'runner') { // imp: horns, bat wings, glowing belly, tail
    const o = { emissive: 0x551100, emissiveIntensity: .6 };
    P(Cp(s * .7, s * .8), K, 0, s * 1.4, 0, o); P(Sp(s * .8), K, 0, s * 2.9, 0, o); P(Sp(s * .45), 0xff7a1a, 0, s * 1.4, s * .5, glow(0xff5500));
    both(k => { P(Cn(s * .15, s * .8, 5), 0x222222, k * s * .45, s * 3.7, 0); P(Cn(s * .7, s * 1.6, 3).rotateZ(-k * Math.PI / 2.5), 0x7a1d0d, k * s * 1.1, s * 2.1, -s * .3); eye(k * s * .3, s * 3, s * .7); });
    P(Cn(s * .1, s * 1.6, 4).rotateX(-Math.PI / 2.4), K, 0, s * .9, -s * .9);
  } else if (type === 'tank') { // ogre: belly, belt, spiked shoulders, tusks, club
    P(Sp(s * 1.2), K, 0, s * 1.7, 0); P(Sp(s * .7), K, 0, s * 3.3, 0); P(Cy(s * 1.25, s * 1.25, s * .2, 10), 0x3a2a1a, 0, s * 1.5, 0);
    both(k => { P(Cn(s * .14, s * .7, 5), 0xf2ead0, k * s * .35, s * 3.1, s * .6); P(Cp(s * .3, s * 1.2), K, k * s * 1.4, s * 1.8, 0); P(Cn(s * .15, s * .5, 5), 0xcccccc, k * s * 1.35, s * 2.6, 0); eye(k * s * .28, s * 3.5, s * .6, 0xff2222); });
    P(Cy(s * .25, s * .45, s * 2.4), 0x4a3220, s * 1.5, s * 1.9, s * .7);
  } else if (type === 'charger') { // raider: horned helmet, spear
    P(Cp(s * .8, s * 1.1), K, 0, s * 1.6, 0); P(Sp(s * .7), 0xd9a066, 0, s * 3.2, 0); P(Sp(s * .78), 0x6d6d78, 0, s * 3.4, -s * .05);
    both(k => { P(Cn(s * .18, s * 1.1, 5).rotateZ(-k * Math.PI / 3), 0xe8e0c8, k * s * .85, s * 3.7, 0); eye(k * s * .25, s * 3.2, s * .6, 0xff4400); P(Cp(s * .28, s * .9), K, k * s * 1.1, s * 1.7, 0); });
    P(Cy(s * .06, s * .06, s * 3.2, 5).rotateX(Math.PI / 2), 0x5a3a1a, s * 1.3, s * 1.9, s * .5); P(Cn(s * .14, s * .5, 5).rotateX(Math.PI / 2), 0xdddddd, s * 1.3, s * 1.9, s * 2.2);
  } else if (type === 'guardian') { // armored goblin knight with a big round shield
    P(Cp(s * .8, s), K, 0, s * 1.5, 0); P(Sp(s * .8), 0x9aa7b8, 0, s * 3.2, 0); P(Cn(s * .3, s * .9), 0x9aa7b8, 0, s * 4, 0);
    both(k => eye(k * s * .3, s * 3.3, s * .65, 0xffffff));
    P(Cy(s * 1.2, s * 1.2, s * .18, 14).rotateX(Math.PI / 2), 0x6b7a90, s * 1.3, s * 2, s * .5); P(Sp(s * .3), 0xffd166, s * 1.3, s * 2, s * .65, glow(0xaa7700));
  } else if (type === 'warlock') { // robed horned mage with fire orb
    P(Cn(s * 1.1, s * 3, 7), K, 0, s * 1.5, 0); P(Sp(s * .6), 0x3b1a1a, 0, s * 3.3, 0);
    both(k => { P(Cn(s * .14, s * .9, 5), 0x222222, k * s * .4, s * 4, 0); eye(k * s * .25, s * 3.4, s * .5); });
    P(Cy(s * .07, s * .07, s * 3.4, 5), 0x3a2a1a, s * 1.1, s * 1.8, s * .3); P(Sp(s * .3), 0xff6a1a, s * 1.1, s * 3.7, s * .3, glow(0xff4400));
  } else if (type === 'wraith') { // translucent icy ghost
    const o = { transparent: true, opacity: .82, emissive: 0x2288bb, emissiveIntensity: .6 };
    P(Cn(s, s * 3.4, 8), K, 0, s * 1.7, 0, o); P(Sp(s * .6), K, 0, s * 3.5, 0, o);
    both(k => { eye(k * s * .22, s * 3.6, s * .5, 0xffffff); P(Cn(s * .12, s * .7, 4), 0xbff3ff, k * s * .35, s * 4.2, 0, glow(0x88ddff)); });
  } else if (type === 'golem') { // stone golem with glowing cracks
    P(Bx(s * 2.2, s * 2.4, s * 1.6), K, 0, s * 1.9, 0); P(Bx(s * 1.1, s, s), K, 0, s * 3.5, 0); P(Bx(s * 1.6, s * .12, s * .06), 0xff7a00, 0, s * 2.2, s * .82, glow(0xff6600));
    both(k => { P(Bx(s * .8, s * 2, s * .8), K, k * s * 1.6, s * 1.9, 0); P(Bx(s * .9, s * .7, s * .9), 0x5e6168, k * s * 1.4, s * 3.1, 0); eye(k * s * .3, s * 3.55, s * .55, 0xff7a00); });
  } else if (type === 'necro') { // skeleton summoner in robes
    P(Cn(s * 1.1, s * 3, 8), K, 0, s * 1.5, 0); P(Sp(s * .6), 0xe8e4d4, 0, s * 3.3, 0);
    both(k => { eye(k * s * .22, s * 3.4, s * .5, 0x55ff88); P(Cn(s * .12, s * .8, 4), 0xe8e4d4, k * s * .45, s * 4, 0); });
    P(Cy(s * .06, s * .06, s * 3.4, 5), 0x2a2a2a, s * 1.1, s * 1.8, s * .3); P(Sp(s * .3), 0xe8e4d4, s * 1.1, s * 3.7, s * .3); P(Sp(s * .18), 0x55ff88, s * 1.1, s * 3.7, s * .55, glow(0x33ff77));
  } else if (type === 'assassin') { // hooded shadow with glowing daggers
    const o = { transparent: true, opacity: .92, emissive: 0x200a3a, emissiveIntensity: .5 };
    P(Cp(s * .55, s * 1.4), K, 0, s * 1.6, 0, o); P(Sp(s * .55), K, 0, s * 3.2, 0, o); P(Cn(s * .6, s * 1.2), K, 0, s * 3.7, -s * .1, o); P(Cn(s * .9, s * 2.2, 4).rotateX(-Math.PI / 2.6), K, 0, s * 1.6, -s * .7, o);
    both(k => { eye(k * s * .2, s * 3.25, s * .45, 0xbb66ff); P(Bx(s * .1, s * .1, s * 1.1), 0xcfd8ff, k * s * .9, s * 1.6, s * .5, glow(0x6688ff)); });
  } else if (type === 'skeleton') {
    P(Sp(s * .9), K, 0, s * 2.8, 0); P(Cy(s * .35, s * .35, s * 1.6), K, 0, s * 1.3, 0);
    both(k => { eye(k * s * .3, s * 2.9, s * .7, 0x55ff88); P(Cy(s * .12, s * .12, s * 1.2, 4), K, k * s * .6, s * 1.3, 0); });
  } else if (type === 'pebble') {
    P(new T.DodecahedronGeometry(s * 1.2), K, 0, s * 1.2, 0); eye(-s * .3, s * 1.4, s * .9, 0xff7a00); eye(s * .3, s * 1.4, s * .9, 0xff7a00);
  } else { // dragon boss: spikes, wings, tail
    const o = { emissive: 0x551100, emissiveIntensity: .5 };
    P(Cp(s * .9, s * 2.2).rotateX(Math.PI / 2), K, 0, s * 1.6, 0, o); P(Cn(s * .6, s * 1.4).rotateX(Math.PI / 2), K, 0, s * 2.2, s * 2, o); P(Cn(s * .5, s * 2.2).rotateX(-Math.PI / 2), K, 0, s * 1.4, -s * 2.6, o);
    for (let i = 0; i < 3; i++) P(Cn(s * .12, s * .45, 4), 0x222222, 0, s * 2.6, s * (.9 - i * .9));
    both(k => { P(Bx(s * 2, s * .08, s * 1.6), 0x7a1d0d, k * s * 1.8, s * 2.6, 0).rotation.z = k * .35; P(Cn(s * .12, s * .9, 5), 0x222222, k * s * .35, s * 3, s * 1.8); eye(k * s * .3, s * 2.6, s * 1.9); });
  }
  return g;
}
export class Enemy {
  constructor(type, hpMul, wps, scene) {
    const c = ENEMIES[type], s = c.size;
    Object.assign(this, { c, type, wps, i: 1, slow: 0, slowMul: 1, dead: false, reached: false, progress: 0, flash: 0, t: Math.random() * 6,
      hc: c.heal ? c.heal.every : 0, ac: c.atk ? c.atk.every : 0, shield: 0, dots: {}, fxT: 0, auraC: c.aura ? c.aura.every : 0, auraT: 0,
      healT: 0, stun: 0, dc: c.dash ? c.dash.every * .6 : 0, dashT: 0, sc: c.summon ? c.summon.every * .6 : 0, bc: c.blink ? c.blink.every * .7 : 0 });
    this.max = this.hp = c.hp * hpMul; this.mats = [];
    this.g = new T.Group();
    const sh = new T.Mesh(new T.CircleGeometry(s * 1.5, 16).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0, transparent: true, opacity: .3, depthWrite: false }));
    sh.position.y = .02; this.g.add(sh); // ground shadow
    this.m = model(type, c, this.mats); this.g.add(this.m);
    this.flame = new T.Mesh(new T.ConeGeometry(s * 1.1, s * 3, 7), new T.MeshBasicMaterial({ color: 0xff6a00, transparent: true, opacity: .7, depthWrite: false })); // shown while burning
    this.flame.position.y = s * 2.6; this.flame.visible = false; this.g.add(this.flame);
    this.g.position.copy(wps[0]); scene.add(this.g);
    if (c.aura) { // protective bubble (visible while active)
      this.bubble = new T.Mesh(new T.SphereGeometry(c.aura.r, 16, 12), new T.MeshBasicMaterial({ color: 0x66aaff, transparent: true, opacity: .22, depthWrite: false }));
      this.bubble.position.y = .5; this.bubble.visible = false; this.g.add(this.bubble);
    }
    this.bar = new T.Group(); this.barY = s * 5 + .25; // billboarded HP bar
    const bg = new T.Mesh(new T.PlaneGeometry(.5, .07), new T.MeshBasicMaterial({ color: 0x111111, depthTest: false }));
    this.fg = new T.Mesh(new T.PlaneGeometry(.5, .07), new T.MeshBasicMaterial({ color: 0x44ff66, depthTest: false }));
    bg.renderOrder = 10; this.fg.renderOrder = 11; this.fg.position.z = .001; this.bar.add(bg, this.fg); scene.add(this.bar);
  }
  update(dt, cam, game) {
    const c = this.c, pos = this.g.position;
    this.t += dt; this.slow -= dt; this.shield -= dt; this.healT -= dt; this.stun -= dt;
    if (c.dash && (this.dc -= dt) <= 0) { this.dc = c.dash.every; this.dashT = c.dash.dur; } // ability: dash
    let move = (this.stun > 0 ? 0 : c.speed) * (this.slow > 0 ? this.slowMul : 1) * (this.dashT > 0 ? c.dash.mul : 1) * dt; this.dashT -= dt;
    while (move > 0) {
      const tg = this.wps[this.i], d = pos.distanceTo(tg);
      this.g.rotation.y = Math.atan2(tg.x - pos.x, tg.z - pos.z);
      if (d <= move) { pos.copy(tg); move -= d; if (++this.i >= this.wps.length) { this.reached = true; return; } }
      else { pos.addScaledVector(tg.clone().sub(pos).normalize(), move); move = 0; }
    }
    this.progress = this.i * 100 - pos.distanceTo(this.wps[this.i]);
    const fl = this.type === 'wraith' || this.type === 'dragon' ? .15 : .06;
    this.m.position.y = Math.abs(Math.sin(this.t * 8)) * fl; this.m.rotation.z = Math.sin(this.t * 8) * .07; // bob + sway
    this.flash -= dt;
    const burning = !!this.dots.burn; // status tint: burning = red/orange, healed = green, poisoned = purple
    const tint = this.flash > 0 ? 0xffffff : burning ? (Math.sin(this.t * 25) > 0 ? 0xff2200 : 0xff8800) : this.stun > 0 ? 0xffe14d : this.healT > 0 ? 0x22ff66 : this.dots.poison ? 0x7a2fbf : 0;
    for (const m of this.mats) m.emissive.setHex(tint || m.userData.e || (this.slow > 0 ? 0x1188aa : 0));
    this.flame.visible = burning; if (burning) { this.flame.scale.set(1 + Math.sin(this.t * 30) * .15, .8 + Math.random() * .5, 1); this.flame.rotation.y += dt * 6; }
    this.bar.position.copy(pos).y += this.barY; this.bar.quaternion.copy(cam.quaternion);
    for (const k in this.dots) { // burn / poison damage over time
      const d = this.dots[k]; d.t -= dt; this.takeDot(d.dps * dt * (this.shield > 0 ? .5 : 1));
      if (d.t <= 0) delete this.dots[k];
    }
    if (Object.keys(this.dots).length && (this.fxT -= dt) <= 0) { this.fxT = .25; game.fx.burst(pos.clone().setY(c.size * 3), burning ? 0xff7722 : 0x77ff44, 3, .9, .05); }
    const au = c.aura; // ability: bubble, allies inside take 50% less damage
    if (au) {
      if ((this.auraC -= dt) <= 0) { this.auraC = au.every; this.auraT = au.dur; }
      if (this.auraT > 0) { this.auraT -= dt; for (const e of game.enemies) if (!e.dead && e.g.position.distanceTo(pos) <= au.r) e.shield = .3; }
      this.bubble.visible = this.auraT > 0;
    }
    const h = c.heal; // ability: heal nearby allies (they glow green)
    if (h && (this.hc -= dt) <= 0) {
      this.hc = h.every;
      for (const e of game.enemies) if (!e.dead && e.hp < e.max && e.g.position.distanceTo(pos) <= h.r) e.heal(e.max * h.pct);
      game.fx.burst(pos.clone().setY(.6), 0x66ff99, 8, 1.5, .07);
    }
    const a = c.atk; // ability: shoot nearest tower
    if (a && (this.ac -= dt) <= 0) {
      let best = null, bd = a.r;
      for (const tw of game.targets()) { const d = tw.g.position.distanceTo(pos); if (d <= bd) { bd = d; best = tw; } }
      if (best) { this.ac = a.every; game.enemyAttack(this, best); } else this.ac = .3;
    }
    if (c.summon && (this.sc -= dt) <= 0) { // ability: summon minions
      this.sc = c.summon.every; for (let k = 0; k < c.summon.n; k++) game.spawnEnemy(c.summon.type, this);
      game.fx.burst(pos.clone().setY(.4), 0x55ff88, 12, 2.5, .08);
    }
    if (c.blink && (this.bc -= dt) <= 0) { // ability: blink forward along the path
      this.bc = c.blink.every; game.fx.burst(pos.clone().setY(.5), 0xbb66ff, 10, 2, .08); this.advance(c.blink.dist); game.fx.burst(pos.clone().setY(.5), 0xbb66ff, 10, 2, .08);
    }
    if (this.stun > 0 && Math.random() < .35) game.fx.burst(pos.clone().setY(c.size * 4.2), 0xffe14d, 1, 1.2, .05); // stun sparks
    if (this.dashT > 0 && Math.random() < .5) game.fx.burst(pos.clone().setY(.1), 0xd9c9a0, 1, 1, .06);
  }
  setBar() { const r = Math.max(this.hp / this.max, .001); this.fg.scale.x = r; this.fg.position.x = -(1 - r) * .25; }
  heal(v) { this.hp = Math.min(this.max, this.hp + v); this.healT = .9; this.setBar(); }
  takeDot(v) { this.hp -= v; this.setBar(); if (this.hp <= 0) this.dead = true; }
  addDot(kind, dps, t) { const d = this.dots[kind]; if (!d || dps >= d.dps) this.dots[kind] = { dps, t }; else d.t = Math.max(d.t, t); }
  advance(dist) { // move forward along the path (blink)
    const pos = this.g.position;
    while (dist > 0) {
      const tg = this.wps[this.i], d = pos.distanceTo(tg);
      if (d <= dist) { pos.copy(tg); dist -= d; if (++this.i >= this.wps.length) { this.reached = true; return; } }
      else { pos.addScaledVector(tg.clone().sub(pos).normalize(), dist); dist = 0; }
    }
  }
  pushBack(dist) { // wind push: move backwards along the path
    const pos = this.g.position;
    while (dist > 0) {
      const prev = this.wps[this.i - 1], d = pos.distanceTo(prev);
      if (d <= dist) { pos.copy(prev); dist -= d; if (this.i <= 1) break; this.i--; }
      else { pos.addScaledVector(prev.clone().sub(pos).normalize(), dist); dist = 0; }
    }
  }
  hit(d) { if (this.shield > 0) d *= .5; this.hp -= d; this.flash = .08; this.setBar(); if (this.hp <= 0) this.dead = true; }
  stunFor(t) { this.stun = Math.max(this.stun, t * (this.c.resist ?? 1)); } // bosses are harder to stun
  applySlow(mul, t) { this.slowMul = mul; this.slow = t; }
  dispose(scene) {
    scene.remove(this.g, this.bar);
    [this.g, this.bar].forEach(o => o.traverse(m => { m.geometry?.dispose(); m.material?.dispose(); }));
  }
}
