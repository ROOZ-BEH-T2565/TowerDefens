// Enemy: monster models (goblin, imp, ogre, shaman, warlock, wraith, dragon), waypoint AI, abilities.
import * as THREE from "three";
import { ENEMIES } from "./config.js";
const T = THREE;
function model(type, c, mats) {
  // builds a low-poly monster facing +z
  const s = c.size,
    g = new T.Group(),
    K = c.color;
  const P = (geo, col, x, y, z, o = {}) => {
    const m = new T.Mesh(
      geo,
      new T.MeshStandardMaterial({ color: col, roughness: 0.6, ...o }),
    );
    m.material.userData.e = o.emissive || 0;
    m.position.set(x, y, z);
    m.castShadow = true;
    g.add(m);
    mats.push(m.material);
    return m;
  };
  const eye = (x, y, z, col = 0xffee00) => {
    const m = new T.Mesh(
      new T.SphereGeometry(s * 0.14, 6, 6),
      new T.MeshBasicMaterial({ color: col }),
    );
    m.position.set(x, y, z);
    g.add(m);
  };
  const Cn = (r, h, n = 6) => new T.ConeGeometry(r, h, n),
    Sp = (r) => new T.SphereGeometry(r, 10, 8),
    Cy = (a, b, h, n = 6) => new T.CylinderGeometry(a, b, h, n),
    Cp = (r, h) => new T.CapsuleGeometry(r, h, 4, 8);
  const both = (f) => {
      f(1);
      f(-1);
    },
    glow = (col) => ({ emissive: col, emissiveIntensity: 1 });
  if (type === "grunt" || type === "shaman") {
    // goblin: big pointy ears, red eyes, club (shaman: hat, staff, orb)
    P(Cp(s * 0.8, s), K, 0, s * 1.5, 0);
    P(Sp(s * 0.85), K, 0, s * 3.2, 0);
    both((k) => {
      P(
        Cn(s * 0.25, s, 4).rotateZ((-k * Math.PI) / 2),
        K,
        k * s * 1.2,
        s * 3.3,
        0,
      );
      eye(k * s * 0.32, s * 3.4, s * 0.72, 0xff2222);
    });
    P(
      Cn(s * 0.15, s * 0.4, 5).rotateX(Math.PI / 2),
      0x4f8f2a,
      0,
      s * 3.1,
      s * 0.9,
    );
    if (type === "shaman") {
      P(Cn(s * 0.9, s * 1.3), 0x5b2a8a, 0, s * 4.3, 0);
      P(
        Cy(s * 0.07, s * 0.07, s * 3.6, 5),
        0x5a3a1a,
        s * 1.1,
        s * 1.9,
        s * 0.3,
      );
      P(Sp(s * 0.28), 0x66ffaa, s * 1.1, s * 3.8, s * 0.3, glow(0x33ff88));
    } else
      P(Cy(s * 0.12, s * 0.28, s * 1.6), 0x6b4423, s * 1.1, s * 1.7, s * 0.4);
  } else if (type === "runner") {
    // imp: horns, bat wings, tail
    const o = { emissive: 0x551100, emissiveIntensity: 0.6 };
    P(Cp(s * 0.7, s * 0.8), K, 0, s * 1.4, 0, o);
    P(Sp(s * 0.8), K, 0, s * 2.9, 0, o);
    both((k) => {
      P(Cn(s * 0.15, s * 0.8, 5), 0x222222, k * s * 0.45, s * 3.7, 0);
      P(
        Cn(s * 0.7, s * 1.6, 3).rotateZ((-k * Math.PI) / 2.5),
        0x7a1d0d,
        k * s * 1.1,
        s * 2.1,
        -s * 0.3,
      );
      eye(k * s * 0.3, s * 3, s * 0.7);
    });
    P(Cn(s * 0.1, s * 1.6, 4).rotateX(-Math.PI / 2.4), K, 0, s * 0.9, -s * 0.9);
  } else if (type === "tank") {
    // ogre: huge belly, tusks, club
    P(Sp(s * 1.2), K, 0, s * 1.7, 0);
    P(Sp(s * 0.7), K, 0, s * 3.3, 0);
    both((k) => {
      P(Cn(s * 0.14, s * 0.7, 5), 0xf2ead0, k * s * 0.35, s * 3.1, s * 0.6);
      P(Cp(s * 0.3, s * 1.2), K, k * s * 1.4, s * 1.8, 0);
      eye(k * s * 0.28, s * 3.5, s * 0.6, 0xff2222);
    });
    P(Cy(s * 0.25, s * 0.45, s * 2.4), 0x4a3220, s * 1.5, s * 1.9, s * 0.7);
  } else if (type === "guardian") {
    // armored goblin knight with a big round shield
    P(Cp(s * 0.8, s), K, 0, s * 1.5, 0);
    P(Sp(s * 0.8), 0x9aa7b8, 0, s * 3.2, 0);
    P(Cn(s * 0.3, s * 0.9), 0x9aa7b8, 0, s * 4, 0);
    both((k) => eye(k * s * 0.3, s * 3.3, s * 0.65, 0xffffff));
    P(
      Cy(s * 1.2, s * 1.2, s * 0.18, 14).rotateX(Math.PI / 2),
      0x6b7a90,
      s * 1.3,
      s * 2,
      s * 0.5,
    );
    P(Sp(s * 0.3), 0xffd166, s * 1.3, s * 2, s * 0.65, glow(0xaa7700));
  } else if (type === "warlock") {
    // robed horned mage with fire orb
    P(Cn(s * 1.1, s * 3, 7), K, 0, s * 1.5, 0);
    P(Sp(s * 0.6), 0x3b1a1a, 0, s * 3.3, 0);
    both((k) => {
      P(Cn(s * 0.14, s * 0.9, 5), 0x222222, k * s * 0.4, s * 4, 0);
      eye(k * s * 0.25, s * 3.4, s * 0.5);
    });
    P(Cy(s * 0.07, s * 0.07, s * 3.4, 5), 0x3a2a1a, s * 1.1, s * 1.8, s * 0.3);
    P(Sp(s * 0.3), 0xff6a1a, s * 1.1, s * 3.7, s * 0.3, glow(0xff4400));
  } else if (type === "wraith") {
    // translucent icy ghost
    const o = {
      transparent: true,
      opacity: 0.82,
      emissive: 0x2288bb,
      emissiveIntensity: 0.6,
    };
    P(Cn(s, s * 3.4, 8), K, 0, s * 1.7, 0, o);
    P(Sp(s * 0.6), K, 0, s * 3.5, 0, o);
    both((k) => {
      eye(k * s * 0.22, s * 3.6, s * 0.5, 0xffffff);
      P(
        Cn(s * 0.12, s * 0.7, 4),
        0xbff3ff,
        k * s * 0.35,
        s * 4.2,
        0,
        glow(0x88ddff),
      );
    });
  } else {
    // dragon boss
    const o = { emissive: 0x551100, emissiveIntensity: 0.5 };
    P(Cp(s * 0.9, s * 2.2).rotateX(Math.PI / 2), K, 0, s * 1.6, 0, o);
    P(Cn(s * 0.6, s * 1.4).rotateX(Math.PI / 2), K, 0, s * 2.2, s * 2, o);
    P(Cn(s * 0.5, s * 2.2).rotateX(-Math.PI / 2), K, 0, s * 1.4, -s * 2.6, o);
    both((k) => {
      P(
        new T.BoxGeometry(s * 2, s * 0.08, s * 1.6),
        0x7a1d0d,
        k * s * 1.8,
        s * 2.6,
        0,
      ).rotation.z = k * 0.35;
      P(Cn(s * 0.12, s * 0.9, 5), 0x222222, k * s * 0.35, s * 3, s * 1.8);
      eye(k * s * 0.3, s * 2.6, s * 1.9);
    });
  }
  return g;
}
export class Enemy {
  constructor(type, hpMul, wps, scene) {
    const c = ENEMIES[type],
      s = c.size;
    Object.assign(this, {
      c,
      type,
      wps,
      i: 1,
      slow: 0,
      slowMul: 1,
      dead: false,
      reached: false,
      progress: 0,
      flash: 0,
      t: Math.random() * 6,
      hc: c.heal ? c.heal.every : 0,
      ac: c.atk ? c.atk.every : 0,
      shield: 0,
      dots: {},
      fxT: 0,
      auraC: c.aura ? c.aura.every : 0,
      auraT: 0,
    });
    this.max = this.hp = c.hp * hpMul;
    this.mats = [];
    this.g = new T.Group();
    this.m = model(type, c, this.mats);
    this.g.add(this.m);
    this.g.position.copy(wps[0]);
    scene.add(this.g);
    if (c.aura) {
      // protective bubble (visible while active)
      this.bubble = new T.Mesh(
        new T.SphereGeometry(c.aura.r, 16, 12),
        new T.MeshBasicMaterial({
          color: 0x66aaff,
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
        }),
      );
      this.bubble.position.y = 0.5;
      this.bubble.visible = false;
      this.g.add(this.bubble);
    }
    this.bar = new T.Group();
    this.barY = s * 5 + 0.25; // billboarded HP bar
    const bg = new T.Mesh(
      new T.PlaneGeometry(0.5, 0.07),
      new T.MeshBasicMaterial({ color: 0x111111, depthTest: false }),
    );
    this.fg = new T.Mesh(
      new T.PlaneGeometry(0.5, 0.07),
      new T.MeshBasicMaterial({ color: 0x44ff66, depthTest: false }),
    );
    bg.renderOrder = 10;
    this.fg.renderOrder = 11;
    this.fg.position.z = 0.001;
    this.bar.add(bg, this.fg);
    scene.add(this.bar);
  }
  update(dt, cam, game) {
    this.t += dt;
    this.slow -= dt;
    this.shield -= dt;
    let move = this.c.speed * (this.slow > 0 ? this.slowMul : 1) * dt;
    const pos = this.g.position;
    while (move > 0) {
      const tg = this.wps[this.i],
        d = pos.distanceTo(tg);
      this.g.rotation.y = Math.atan2(tg.x - pos.x, tg.z - pos.z);
      if (d <= move) {
        pos.copy(tg);
        move -= d;
        if (++this.i >= this.wps.length) {
          this.reached = true;
          return;
        }
      } else {
        pos.addScaledVector(tg.clone().sub(pos).normalize(), move);
        move = 0;
      }
    }
    this.progress = this.i * 100 - pos.distanceTo(this.wps[this.i]);
    const fl = this.type === "wraith" || this.type === "dragon" ? 0.15 : 0.06;
    this.m.position.y = Math.abs(Math.sin(this.t * 8)) * fl; // walk bob / hover
    this.flash -= dt;
    for (const m of this.mats)
      m.emissive.setHex(
        this.flash > 0
          ? 0xffffff
          : m.userData.e || (this.slow > 0 ? 0x1188aa : 0),
      );
    this.bar.position.copy(pos).y += this.barY;
    this.bar.quaternion.copy(cam.quaternion);
    for (const k in this.dots) {
      // burn / poison damage over time
      const d = this.dots[k];
      d.t -= dt;
      this.takeDot(d.dps * dt * (this.shield > 0 ? 0.5 : 1));
      if (d.t <= 0) delete this.dots[k];
    }
    if (Object.keys(this.dots).length && (this.fxT -= dt) <= 0) {
      this.fxT = 0.3;
      game.fx.burst(
        pos.clone().setY(this.c.size * 3),
        this.dots.burn ? 0xff7722 : 0x77ff44,
        2,
        0.8,
        0.05,
      );
    }
    const au = this.c.aura; // ability: bubble, allies inside take 50% less damage
    if (au) {
      if ((this.auraC -= dt) <= 0) {
        this.auraC = au.every;
        this.auraT = au.dur;
      }
      if (this.auraT > 0) {
        this.auraT -= dt;
        for (const e of game.enemies)
          if (!e.dead && e.g.position.distanceTo(pos) <= au.r) e.shield = 0.3;
      }
      this.bubble.visible = this.auraT > 0;
    }
    const h = this.c.heal; // ability: heal nearby allies
    if (h && (this.hc -= dt) <= 0) {
      this.hc = h.every;
      for (const e of game.enemies)
        if (!e.dead && e.hp < e.max && e.g.position.distanceTo(pos) <= h.r)
          e.heal(e.max * h.pct);
      game.fx.burst(pos.clone().setY(0.6), 0x66ff99, 8, 1.5, 0.07);
    }
    const a = this.c.atk; // ability: shoot nearest tower
    if (a && (this.ac -= dt) <= 0) {
      let best = null,
        bd = a.r;
      for (const tw of game.towers) {
        const d = tw.g.position.distanceTo(pos);
        if (d <= bd) {
          bd = d;
          best = tw;
        }
      }
      if (best) {
        this.ac = a.every;
        game.enemyAttack(this, best);
      } else this.ac = 0.3;
    }
  }
  setBar() {
    const r = Math.max(this.hp / this.max, 0.001);
    this.fg.scale.x = r;
    this.fg.position.x = -(1 - r) * 0.25;
  }
  heal(v) {
    this.hp = Math.min(this.max, this.hp + v);
    this.setBar();
  }
  takeDot(v) {
    this.hp -= v;
    this.setBar();
    if (this.hp <= 0) this.dead = true;
  }
  addDot(kind, dps, t) {
    const d = this.dots[kind];
    if (!d || dps >= d.dps) this.dots[kind] = { dps, t };
    else d.t = Math.max(d.t, t);
  }
  pushBack(dist) {
    // wind push: move backwards along the path
    const pos = this.g.position;
    while (dist > 0) {
      const prev = this.wps[this.i - 1],
        d = pos.distanceTo(prev);
      if (d <= dist) {
        pos.copy(prev);
        dist -= d;
        if (this.i <= 1) break;
        this.i--;
      } else {
        pos.addScaledVector(prev.clone().sub(pos).normalize(), dist);
        dist = 0;
      }
    }
  }
  hit(d) {
    if (this.shield > 0) d *= 0.5;
    this.hp -= d;
    this.flash = 0.08;
    this.setBar();
    if (this.hp <= 0) this.dead = true;
  }
  applySlow(mul, t) {
    this.slowMul = mul;
    this.slow = t;
  }
  dispose(scene) {
    scene.remove(this.g, this.bar);
    [this.g, this.bar].forEach((o) =>
      o.traverse((m) => {
        m.geometry?.dispose();
        m.material?.dispose();
      }),
    );
  }
}
