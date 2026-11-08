// Projectiles (homing spheres) and particle effects.
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
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(tower.type === "sniper" ? 0.06 : 0.09, 8, 8),
      new THREE.MeshBasicMaterial({ color: this.def.proj }),
    );
    this.mesh.position.copy(from);
    scene.add(this.mesh);
  }
  update(dt, game) {
    const t = this.target;
    if (t.dead || t.reached) return this.kill();
    const to = t.g.position.clone();
    to.y += 0.4;
    const d = to.sub(this.mesh.position),
      dist = d.length(),
      step = this.def.speed * dt;
    game.fx.burst(this.mesh.position, this.def.proj, 1, 0.3, 0.04); // trail
    if (dist <= step + 0.1) {
      t.hit(this.dmg * elemMult(this.def.elem, t.c.elem)); // elemental multiplier if (this.def.slow) t.applySlow(this.def.slow, this.def.slowT);
      if (this.def.dot)
        t.addDot(
          "poison",
          this.def.dot * this.scale * elemMult(this.def.elem, t.c.elem),
          this.def.dotT,
        );
      game.fx.burst(this.mesh.position, this.def.proj, 5, 2, 0.06);
      game.audio.play("hit");
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
        v: new THREE.Vector3(
          (Math.random() - 0.5) * spd,
          Math.random() * spd,
          (Math.random() - 0.5) * spd,
        ),
      });
    }
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
    (this.misc ??= []).push({ m, life: 0.45, max: 0.45, r: radius, k: "ring" });
  }
  bolt(pos) {
    // lightning strike column
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 9, 6),
      new THREE.MeshBasicMaterial({ color: 0xfff3a0, transparent: true }),
    );
    m.position.set(pos.x, 4.5, pos.z);
    this.scene.add(m);
    (this.misc ??= []).push({ m, life: 0.35, max: 0.35, k: "bolt" });
  }
  updMisc(dt) {
    const a = this.misc || [];
    for (let i = a.length - 1; i >= 0; i--) {
      const o = a[i];
      o.life -= dt;
      const f = Math.max(o.life / o.max, 0);
      o.m.material.opacity = f;
      if (o.k === "ring")
        o.m.scale.setScalar(Math.max(0.1, o.r * (1 - f) + 0.2));
      if (o.life <= 0) {
        this.scene.remove(o.m);
        o.m.geometry.dispose();
        o.m.material.dispose();
        a.splice(i, 1);
      }
    }
  }
  update(dt) {
    this.updMisc(dt);
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      p.v.y -= 6 * dt;
      p.m.position.addScaledVector(p.v, dt);
      p.m.material.opacity = Math.max(p.life / 0.5, 0);
      if (p.life <= 0) {
        this.scene.remove(p.m);
        p.m.material.dispose();
        this.list.splice(i, 1);
      }
    }
  }
  clear() {
    (this.misc || []).forEach((o) => {
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

// Enemy attack shot flying toward a tower; onHit applies damage.
export class Shot {
  constructor(from, tower, color, scene, onHit) {
    Object.assign(this, { tower, scene, onHit, done: false });
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color }),
    );
    this.color = color;
    this.mesh.position.copy(from);
    scene.add(this.mesh);
  }
  update(dt, game) {
    if (this.tower.gone) return this.kill();
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
