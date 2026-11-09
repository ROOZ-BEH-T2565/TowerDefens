// Projectiles (homing, with splash / chain / ignite / poison effects), enemy shots, particle effects.
import * as THREE from "three";
import { elemMult } from "./config.js";
export class Projectile {
  constructor(from, target, tower, scene) {
    this.target = target;
    this.dmg = tower.dmg;
    this.scale = tower.dmg / tower.def.dmg;
    this.def = tower.def;
    this.scene = scene;
    this.done = false;
    this.chain = tower.chainN || 0; // tesla: chain lightning from level 4
    const r =
      tower.type === "sniper" ? 0.06 : tower.type === "mortar" ? 0.16 : 0.09;
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(r, 8, 8),
      new THREE.MeshBasicMaterial({ color: this.def.proj }),
    );
    this.mesh.position.copy(from);
    scene.add(this.mesh);
  }
  update(dt, game) {
    const t = this.target,
      d0 = this.def;
    if (t.dead || t.reached) return this.kill();
    const to = t.g.position.clone();
    to.y += 0.4;
    const d = to.sub(this.mesh.position),
      dist = d.length(),
      step = d0.speed * dt;
    game.fx.burst(this.mesh.position, d0.proj, 1, 0.3, 0.04); // trail
    if (dist > step + 0.1) {
      this.mesh.position.addScaledVector(d, step / dist);
      return;
    }
    const em = elemMult(d0.elem, t.c.elem),
      tp = t.g.position;
    t.hit(this.dmg * em);
    if (d0.slow) t.applySlow(d0.slow, d0.slowT);
    if (d0.dot) t.addDot("poison", d0.dot * this.scale * em, d0.dotT);
    if (d0.ignite) t.addDot("burn", d0.ignite * this.scale * em, 2.5);
    if (d0.stun) t.stunFor(d0.stun); // tesla: 1s stun on every hit
    if (d0.splash) {
      // mortar: area damage
      for (const e of game.enemies)
        if (
          e !== t &&
          !e.dead &&
          Math.hypot(e.g.position.x - tp.x, e.g.position.z - tp.z) <= d0.splash
        )
          e.hit(this.dmg * 0.7 * elemMult(d0.elem, e.c.elem));
      game.fx.ring(tp, 0xd9b27a, d0.splash);
      game.fx.burst(this.mesh.position, 0xd9b27a, 14, 3, 0.1);
    }
    if (this.chain) {
      // tesla: lightning jumps to nearby enemies
      const near = game.enemies
        .filter((e) => e !== t && !e.dead && e.g.position.distanceTo(tp) <= 1.7)
        .sort(
          (a, b) => a.g.position.distanceTo(tp) - b.g.position.distanceTo(tp),
        );
      for (const e of near.slice(0, this.chain)) {
        e.hit(this.dmg * 0.6 * elemMult(d0.elem, e.c.elem));
        if (d0.stun) e.stunFor(d0.stun);
        game.fx.beam(
          tp.clone().setY(0.5),
          e.g.position.clone().setY(0.5),
          d0.proj,
        );
      }
    }
    game.fx.burst(this.mesh.position, d0.proj, 5, 2, 0.06);
    game.audio.play("hit");
    this.kill();
  }
  kill() {
    this.done = true;
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
// Enemy attack shot flying toward a tower; onHit applies damage.
export class Shot {
  constructor(from, tower, color, scene, onHit) {
    Object.assign(this, { tower, scene, onHit, done: false, color });
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color }),
    );
    this.mesh.position.copy(from);
    scene.add(this.mesh);
  }
  update(dt, game) {
    if (this.tower.gone || this.tower.isRuined) return this.kill();
    const to = this.tower.g.position.clone();
    to.y += 0.5;
    const d = to.sub(this.mesh.position),
      dist = d.length(),
      step = 8 * dt;
    game.fx.burst(this.mesh.position, this.color, 1, 0.3, 0.05);
    if (dist <= step + 0.1) {
      this.onHit();
      game.fx.burst(this.mesh.position, this.color, 8, 2.5, 0.08);
      this.kill();
    } else this.mesh.position.addScaledVector(d, step / dist);
  }
  kill() {
    this.done = true;
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
    this.misc = [];
    this.geo = new THREE.BoxGeometry(1, 1, 1);
  }
  burst(pos, color, n = 10, spd = 2.5, size = 0.07) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(
        this.geo,
        new THREE.MeshBasicMaterial({ color, transparent: true }),
      );
      m.position.copy(pos);
      m.scale.setScalar(size);
      this.scene.add(m);
      this.list.push({
        m,
        life: 0.5,
        max: 0.5,
        v: new THREE.Vector3(
          (Math.random() - 0.5) * spd,
          Math.random() * spd,
          (Math.random() - 0.5) * spd,
        ),
      });
    }
  }
  debris(pos, color, n = 8) {
    // chunky spinning pieces that fly out and fall
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(
        this.geo,
        new THREE.MeshBasicMaterial({ color, transparent: true }),
      );
      m.position.copy(pos);
      m.scale.set(
        0.1 + Math.random() * 0.12,
        0.08 + Math.random() * 0.1,
        0.1 + Math.random() * 0.12,
      );
      this.scene.add(m);
      this.list.push({
        m,
        life: 1,
        max: 1,
        spin: 6 + Math.random() * 8,
        v: new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          2 + Math.random() * 3.5,
          (Math.random() - 0.5) * 5,
        ),
      });
    }
  }
  ball(pos, color, radius) {
    // expanding fireball
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(1, 14, 10),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      }),
    );
    m.position.copy(pos);
    this.scene.add(m);
    this.misc.push({ m, life: 0.5, max: 0.5, r: radius, k: "ball" });
  }
  mark(pos, color, radius, life) {
    // pulsing warning ring (e.g. where lightning is about to strike)
    const m = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 1, 36).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    m.position.copy(pos).y = 0.09;
    m.scale.setScalar(radius);
    this.scene.add(m);
    this.misc.push({ m, life, max: life, r: radius, k: "mark" });
  }
  ring(pos, color, radius) {
    // expanding shockwave ring
    const m = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1, 40).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    m.position.copy(pos).y = 0.08;
    this.scene.add(m);
    this.misc.push({ m, life: 0.45, max: 0.45, r: radius, k: "ring" });
  }
  bolt(pos) {
    // lightning strike column
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 9, 6),
      new THREE.MeshBasicMaterial({ color: 0xfff3a0, transparent: true }),
    );
    m.position.set(pos.x, 4.5, pos.z);
    this.scene.add(m);
    this.misc.push({ m, life: 0.35, max: 0.35, k: "bolt" });
  }
  beam(a, b, color) {
    // short lightning line between two points
    const d = b.clone().sub(a),
      len = d.length();
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, len, 5),
      new THREE.MeshBasicMaterial({ color, transparent: true }),
    );
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    this.scene.add(m);
    this.misc.push({ m, life: 0.15, max: 0.15, k: "bolt" });
  }
  update(dt) {
    for (let i = this.misc.length - 1; i >= 0; i--) {
      const o = this.misc[i];
      o.life -= dt;
      const f = Math.max(o.life / o.max, 0);
      o.m.material.opacity = f;
      if (o.k === "mark")
        o.m.material.opacity = 0.45 + 0.4 * Math.sin(o.life * 30);
      if (o.k === "ring")
        o.m.scale.setScalar(Math.max(0.1, o.r * (1 - f) + 0.2));
      if (o.k === "ball")
        o.m.scale.setScalar(Math.max(0.1, o.r * (1 - f) + 0.15));
      if (o.life <= 0) {
        this.scene.remove(o.m);
        o.m.geometry.dispose();
        o.m.material.dispose();
        this.misc.splice(i, 1);
      }
    }
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      p.v.y -= 6 * dt;
      p.m.position.addScaledVector(p.v, dt);
      p.m.material.opacity = Math.max(p.life / p.max, 0);
      if (p.spin) {
        p.m.rotation.x += p.spin * dt;
        p.m.rotation.z += p.spin * dt;
      }
      if (p.life <= 0) {
        this.scene.remove(p.m);
        p.m.material.dispose();
        this.list.splice(i, 1);
      }
    }
  }
  clear() {
    this.misc.forEach((o) => {
      this.scene.remove(o.m);
      o.m.material.dispose();
    });
    this.misc = [];
    this.list.forEach((p) => {
      this.scene.remove(p.m);
      p.m.material.dispose();
    });
    this.list = [];
  }
}
