// Tower: silhouettes that evolve per level (6 levels), targeting, firing and special abilities.
import * as THREE from "three";
import {
  TOWERS,
  UPGRADE_INFLATION,
  STEP,
  MAX_LEVEL,
  UP_MULT,
} from "./config.js";
import { Projectile } from "./projectile.js";
const LCOL = [0x888888, 0xcd7f32, 0xc0c0c0, 0xffd700, 0x66e0ff, 0xff66ff]; // trim colour per level
export class Tower {
  constructor(type, x, y, pos, scene) {
    Object.assign(this, {
      type,
      x,
      y,
      def: TOWERS[type],
      level: 1,
      cd: 0,
      flash: 0,
      scene,
      stun: 0,
      gone: false,
      shots: 0,
    });
    this.spent = this.def.cost;
    this.g = new THREE.Group();
    this.g.position.copy(pos);
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.45, 0.12, 16),
      new THREE.MeshStandardMaterial({
        color: 0x1d2433,
        roughness: 0.6,
        metalness: 0.5,
      }),
    );
    base.position.y = 0.06;
    base.receiveShadow = true;
    this.g.add(base);
    this.build();
    scene.add(this.g);
    this.hp = this.maxHp;
    this.initBar();
  }
  get dmg() {
    return this.def.dmg * Math.pow(1.4, this.level - 1);
  }
  get range() {
    return this.def.range * (1 + 0.1 * (this.level - 1));
  }
  get rate() {
    return this.def.rate * (1 + 0.12 * (this.level - 1));
  }
  get multi() {
    return this.type === "sniper" && this.level >= 4 ? this.level - 2 : 1;
  } // sniper: multi-shot from level 4
  get maxHp() {
    return this.def.hp * (1 + 0.3 * (this.level - 1));
  }
  upgradeCost(wave = 0) {
    // pricier each level and every STEP waves
    return this.level >= MAX_LEVEL
      ? null
      : Math.round(
          this.def.cost *
            UP_MULT[this.level - 1] *
            (1 + UPGRADE_INFLATION * Math.floor(wave / STEP)),
        );
  }
  sellValue() {
    return Math.floor(this.spent * 0.5);
  }
  initBar() {
    const T = THREE;
    this.bar = new T.Group();
    const bg = new T.Mesh(
      new T.PlaneGeometry(0.7, 0.08),
      new T.MeshBasicMaterial({ color: 0x111111, depthTest: false }),
    );
    this.fg = new T.Mesh(
      new T.PlaneGeometry(0.7, 0.08),
      new T.MeshBasicMaterial({ color: 0x44ff66, depthTest: false }),
    );
    bg.renderOrder = 10;
    this.fg.renderOrder = 11;
    this.fg.position.z = 0.001;
    this.bar.add(bg, this.fg);
    this.bar.position.copy(this.g.position).y += 1.6;
    this.bar.visible = false;
    this.scene.add(this.bar);
  }
  updBar(cam) {
    const r = Math.max(this.hp / this.maxHp, 0.001);
    this.bar.visible = this.hp < this.maxHp || this.stun > 0;
    this.fg.scale.x = r;
    this.fg.position.x = -(1 - r) * 0.35;
    this.fg.material.color.setHex(this.stun > 0 ? 0x66ccff : 0x44ff66);
    this.bar.quaternion.copy(cam.quaternion);
  }
  build() {
    // (re)build the top section; each level adds visible upgrades
    if (this.top) this.g.remove(this.top);
    const T = THREE,
      d = this.def,
      L = this.level,
      top = new T.Group();
    const m = new T.MeshStandardMaterial({
      color: d.color,
      roughness: 0.4,
      metalness: 0.5,
      emissive: d.color,
      emissiveIntensity: 0.1 + 0.06 * L,
    });
    const dk = new T.MeshStandardMaterial({
      color: 0x2b2f3a,
      roughness: 0.6,
      metalness: 0.6,
    });
    const lm = new T.MeshStandardMaterial({
      color: LCOL[L - 1],
      metalness: 0.9,
      roughness: 0.25,
      emissive: L > 1 ? LCOL[L - 1] : 0,
      emissiveIntensity: 0.35,
    });
    const add = (geo, mat, x, y, z, grp = top) => {
      const o = new T.Mesh(geo, mat);
      o.position.set(x, y, z);
      o.castShadow = true;
      grp.add(o);
      return o;
    };
    const ring = (y, r) =>
      add(
        new T.TorusGeometry(r, 0.035, 6, 18).rotateX(Math.PI / 2),
        lm,
        0,
        y,
        0,
      );
    const Cy = (a, b, h, n = 12) => new T.CylinderGeometry(a, b, h, n),
      Sp = (r) => new T.SphereGeometry(r, 10, 8);
    const gun = (r1, r2, len) => Cy(r1, r2, len, 10).rotateX(Math.PI / 2);
    let tip = [0, 0.7, 0];
    this.crystal = null;
    this.spin = null;
    if (this.type === "cannon") {
      add(Cy(0.28, 0.34, 0.4, 16), m, 0, 0.3, 0);
      if (L >= 3) {
        add(gun(0.07, 0.09, 0.55), dk, -0.13, 0.55, 0.3);
        add(gun(0.07, 0.09, 0.55), dk, 0.13, 0.55, 0.3);
      } else add(gun(0.08, 0.1, 0.55), dk, 0, 0.55, 0.3);
      tip = [0, 0.55, 0.6];
      if (L >= 2) ring(0.45, 0.3);
      if (L >= 4) ring(0.18, 0.37);
      if (L >= 5)
        for (const k of [1, -1])
          add(new T.BoxGeometry(0.1, 0.3, 0.26), lm, k * 0.33, 0.35, 0);
      if (L >= 6) add(Sp(0.13), lm, 0, 0.78, -0.12);
    } else if (this.type === "sniper") {
      add(Cy(0.12, 0.2, 1, 8), m, 0, 0.6, 0);
      add(new T.BoxGeometry(0.3, 0.12, 0.3), dk, 0, 1.15, 0);
      if (L >= 5) {
        add(gun(0.035, 0.045, 0.9), dk, -0.07, 1.15, 0.45);
        add(gun(0.035, 0.045, 0.9), dk, 0.07, 1.15, 0.45);
      } else add(gun(0.04, 0.05, 0.9), dk, 0, 1.15, 0.45);
      tip = [0, 1.15, 0.9];
      if (L >= 2) ring(0.5, 0.17);
      if (L >= 3) add(Sp(0.08), lm, 0.12, 1.25, 0.2);
      if (L >= 4) ring(0.85, 0.14);
      if (L >= 6) add(new T.ConeGeometry(0.03, 0.5, 5), lm, 0, 1.5, 0);
    } else if (this.type === "freezer") {
      this.crystal = add(new T.OctahedronGeometry(0.32), m, 0, 0.7, 0);
      this.crystal.scale.y = 1.7;
      add(Cy(0.25, 0.3, 0.2, 6), dk, 0, 0.2, 0);
      this.spin = new T.Group();
      this.spin.position.y = 0.7;
      top.add(this.spin);
      for (let i = 0; i < L - 1; i++) {
        const a = (i / (L - 1)) * Math.PI * 2;
        add(
          new T.OctahedronGeometry(0.1),
          lm,
          Math.cos(a) * 0.5,
          Math.sin(i) * 0.15,
          Math.sin(a) * 0.5,
          this.spin,
        );
      }
      if (L >= 3) ring(0.3, 0.3);
    } else {
      // poison: bubbling cauldron
      add(Cy(0.3, 0.2, 0.4), dk, 0, 0.3, 0);
      add(
        Cy(0.27, 0.27, 0.03),
        new T.MeshStandardMaterial({
          color: 0x66dd33,
          emissive: 0x44aa11,
          emissiveIntensity: 0.9,
        }),
        0,
        0.5,
        0,
      );
      tip = [0, 0.6, 0];
      ring(0.48, 0.3);
      this.spin = new T.Group();
      this.spin.position.y = 0.65;
      top.add(this.spin);
      for (let i = 0; i < L + 1; i++) {
        const a = (i / (L + 1)) * Math.PI * 2;
        add(
          Sp(0.07 + 0.01 * L),
          m,
          Math.cos(a) * 0.18,
          Math.sin(i * 2) * 0.1,
          Math.sin(a) * 0.18,
          this.spin,
        );
      }
      if (L >= 4) add(new T.ConeGeometry(0.05, 0.3, 5), lm, 0.22, 0.5, 0);
    }
    this.muz = new T.Mesh(
      new T.SphereGeometry(0.1, 8, 8),
      new T.MeshBasicMaterial({ color: d.proj }),
    );
    this.muz.position.set(...tip);
    this.muz.visible = false;
    top.add(this.muz);
    top.scale.setScalar(1 + 0.07 * (L - 1));
    this.top = top;
    this.g.add(top);
  }
  update(dt, enemies, game) {
    this.cd -= dt;
    this.stun -= dt;
    this.updBar(game.sc.cam);
    if (this.flash > 0 && (this.flash -= dt) <= 0) this.muz.visible = false;
    if (this.crystal) this.crystal.rotation.y += dt * 1.5;
    if (this.spin) this.spin.rotation.y += dt * 2;
    const p = this.g.position,
      r = this.range,
      list = [];
    for (const e of enemies) {
      if (e.dead) continue;
      const dx = e.g.position.x - p.x,
        dz = e.g.position.z - p.z;
      if (dx * dx + dz * dz <= r * r) list.push(e);
    }
    if (!list.length || this.stun > 0) return; // stunned towers can't fire
    list.sort((a, b) => b.progress - a.progress); // furthest along the path first
    const best = list[0];
    if (this.type === "cannon" || this.type === "sniper")
      this.top.rotation.y = Math.atan2(
        best.g.position.x - p.x,
        best.g.position.z - p.z,
      );
    if (this.cd <= 0) {
      this.cd = 1 / this.rate;
      this.muz.visible = true;
      this.flash = 0.07;
      const from = new THREE.Vector3();
      this.muz.getWorldPosition(from);
      for (let k = 0; k < Math.min(this.multi, list.length); k++)
        game.projectiles.push(new Projectile(from, list[k], this, this.scene));
      game.audio.play("shoot", this.type === "poison" ? "freezer" : this.type);
      if (this.def.nova && ++this.shots % 10 === 0) game.nova(this); // every 10 shots: area nova
    }
  }
  dispose() {
    this.gone = true;
    this.scene.remove(this.g, this.bar);
    this.g.traverse((o) => {
      o.geometry?.dispose();
      o.material?.dispose();
    });
  }
}
