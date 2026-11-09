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
import { Soldier } from "./soldier.js";
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
    // sniper: several targets from level 4; mortar: 2 shells at level 5, 3 at level 6
    return this.type === "sniper"
      ? this.level >= 4
        ? this.level - 2
        : 1
      : this.type === "mortar"
        ? this.level >= 6
          ? 3
          : this.level >= 5
            ? 2
            : 1
        : 1;
  }
  get chainN() {
    return this.type === "tesla" && this.level >= 4 ? this.level - 2 : 0;
  } // tesla: chain lightning from level 4 (2, 3, 4 targets)
  get soldierHp() {
    return (this.def.sHp || 0) * Math.pow(1.3, this.level - 1);
  }
  get maxHp() {
    return this.def.hp * (1 + 0.3 * (this.level - 1));
  }
  upgradeCost(wave = 0, cap = MAX_LEVEL) {
    // pricier each level and every STEP waves; capped by the stage's max level
    return this.level >= Math.min(MAX_LEVEL, cap)
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
    } else if (this.type === "barracks") {
      // small fort: more towers, banners and gold trim per level
      add(new T.BoxGeometry(0.72, 0.45, 0.72), m, 0, 0.3, 0);
      add(new T.BoxGeometry(0.2, 0.3, 0.04), dk, 0, 0.2, 0.37);
      for (const sx of [-1, 1])
        for (const sz of [-1, 1])
          add(
            new T.BoxGeometry(0.14, 0.14, 0.14),
            dk,
            sx * 0.3,
            0.62,
            sz * 0.3,
          );
      add(Cy(0.02, 0.02, 0.5, 5), dk, 0, 0.8, 0);
      add(new T.BoxGeometry(0.3, 0.18, 0.02), lm, 0.16, 0.95, 0);
      if (L >= 2) ring(0.45, 0.42);
      if (L >= 3)
        for (const sx of [-1, 1])
          add(Cy(0.1, 0.12, 0.75, 8), m, sx * 0.38, 0.4, -0.38);
      if (L >= 4) add(new T.BoxGeometry(0.5, 0.1, 0.5), lm, 0, 0.56, 0);
      if (L >= 5)
        for (const sx of [-1, 1])
          add(new T.ConeGeometry(0.13, 0.22, 8), lm, sx * 0.38, 0.9, -0.38);
      if (L >= 6) add(Sp(0.1), lm, 0, 1.15, 0);
      tip = [0, 0.9, 0];
    } else if (this.type === "fire") {
      // brazier with flames that grow per level
      add(Cy(0.26, 0.34, 0.45, 10), dk, 0, 0.32, 0);
      add(Cy(0.34, 0.28, 0.12, 10), m, 0, 0.6, 0);
      const fl = new T.MeshStandardMaterial({
        color: 0xff7722,
        emissive: 0xff4400,
        emissiveIntensity: 1.2,
      });
      this.spin = new T.Group();
      this.spin.position.y = 0.8;
      top.add(this.spin);
      add(
        new T.ConeGeometry(0.2 + 0.02 * L, 0.5 + 0.06 * L, 7),
        fl,
        0,
        0.25,
        0,
        this.spin,
      );
      for (let i = 0; i < L - 1; i++) {
        const a = (i / (L - 1)) * Math.PI * 2;
        add(
          new T.ConeGeometry(0.09, 0.3, 5),
          fl,
          Math.cos(a) * 0.22,
          0.1,
          Math.sin(a) * 0.22,
          this.spin,
        );
      }
      tip = [0, 0.95, 0];
      if (L >= 2) ring(0.5, 0.34);
      if (L >= 4) ring(0.2, 0.38);
      if (L >= 5)
        for (const k of [1, -1])
          add(Cy(0.04, 0.04, 0.5, 6), lm, k * 0.3, 0.45, 0);
      if (L >= 6) add(Sp(0.12), lm, 0, 1.35, 0);
    } else if (this.type === "tesla") {
      // coil: more rings and spikes per level
      add(Cy(0.2, 0.3, 0.5, 8), dk, 0, 0.35, 0);
      add(Cy(0.12, 0.18, 0.6, 8), m, 0, 0.85, 0);
      for (let i = 0; i < 2 + Math.ceil(L / 2); i++)
        ring(0.55 + i * 0.17, Math.max(0.1, 0.2 - i * 0.02));
      add(
        Sp(0.16 + 0.01 * L),
        new T.MeshStandardMaterial({
          color: 0xbfe4ff,
          emissive: 0x66bbff,
          emissiveIntensity: 1.5,
        }),
        0,
        1.3,
        0,
      );
      tip = [0, 1.3, 0];
      if (L >= 3)
        for (const k of [1, -1])
          add(Cy(0.025, 0.025, 0.5, 5), lm, k * 0.28, 0.8, 0);
      if (L >= 5) add(new T.ConeGeometry(0.05, 0.4, 5), lm, 0, 1.6, 0);
    } else if (this.type === "mortar") {
      // squat tilted barrel
      add(Cy(0.34, 0.4, 0.3, 10), dk, 0, 0.22, 0);
      add(Cy(0.18, 0.26, 0.6, 10).rotateX(Math.PI / 4), m, 0, 0.6, 0.1);
      tip = [0, 0.95, 0.35];
      if (L >= 2) ring(0.4, 0.36);
      if (L >= 3)
        add(Cy(0.1, 0.12, 0.5, 8).rotateX(Math.PI / 4), dk, 0.28, 0.55, 0.1);
      if (L >= 4) ring(0.28, 0.4);
      if (L >= 5)
        for (const k of [1, -1]) add(Sp(0.1), lm, k * 0.35, 0.4, -0.1);
      if (L >= 6) add(Sp(0.12), lm, 0, 0.8, -0.2);
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
    if (this.type === "barracks") {
      this.updSoldiers(dt, enemies, game);
      return;
    } // barracks fights with soldiers, no projectiles
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
    if (
      this.type === "cannon" ||
      this.type === "sniper" ||
      this.type === "mortar"
    )
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
      const n =
        this.type === "mortar" ? this.multi : Math.min(this.multi, list.length); // mortar may fire several shells at one target
      for (let k = 0; k < n; k++)
        game.projectiles.push(
          new Projectile(from, list[k % list.length], this, this.scene),
        );
      game.audio.play("shoot", this.type);
      this.shots++;
      if (this.def.nova && this.level >= 4 && this.shots % 10 === 0)
        game.nova(this); // nova unlocks at level 4
    }
  }
  updSoldiers(dt, enemies, game) {
    // 3 soldiers; a fallen one is replaced after 1 second
    if (!this.slots)
      this.slots = [0, 1, 2].map((i) => ({
        s: null,
        t: 0.3 * i,
        home: new THREE.Vector3(
          Math.cos(i * 2.094 + 0.5) * 0.6,
          0,
          Math.sin(i * 2.094 + 0.5) * 0.6,
        ),
      }));
    for (const sl of this.slots) {
      if (!sl.s) {
        if ((sl.t -= dt) <= 0) {
          const p = this.g.position.clone().add(sl.home);
          sl.s = new Soldier(this.scene, p, p.clone(), this);
          game.fx.burst(
            this.g.position.clone().setY(0.4),
            0x5b7bd5,
            8,
            1.5,
            0.06,
          );
        }
        continue;
      }
      sl.s.update(dt, this, enemies, game);
      if (sl.s.dead) {
        sl.s.dispose();
        sl.s = null;
        sl.t = 1;
      }
    }
  }
  clearSoldiers() {
    (this.slots || []).forEach((sl) => {
      if (sl.s) {
        sl.s.dispose();
        sl.s = null;
      }
    });
  }
  static broken(type, pos, scene) {
    // distinct ruined version of each tower, left behind after it explodes
    const T = THREE,
      g = new T.Group(),
      col = TOWERS[type].color;
    g.position.copy(pos);
    const ch = new T.MeshStandardMaterial({
        color: new T.Color(col).multiplyScalar(0.35),
        roughness: 0.9,
        metalness: 0.2,
      }),
      dk = new T.MeshStandardMaterial({ color: 0x23262e, roughness: 0.9 });
    const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
      const o = new T.Mesh(geo, mat);
      o.position.set(x, y, z);
      o.rotation.set(rx, ry, rz);
      o.castShadow = true;
      g.add(o);
      return o;
    };
    const Cy = (a, b, h, n = 8) => new T.CylinderGeometry(a, b, h, n),
      glow = (c, i = 1.2) =>
        new T.MeshStandardMaterial({
          color: c,
          emissive: c,
          emissiveIntensity: i,
        });
    add(Cy(0.42, 0.45, 0.1, 14), dk, 0, 0.05, 0);
    if (type === "cannon") {
      add(Cy(0.28, 0.34, 0.25, 10), ch, 0, 0.2, 0, 0.15, 0, 0.1);
      add(Cy(0.08, 0.1, 0.5), dk, 0.3, 0.12, 0.25, 0, 0, Math.PI / 2.2);
    } else if (type === "sniper") {
      add(Cy(0.12, 0.2, 0.45), ch, 0, 0.3, 0, 0.2, 0, -0.15);
      add(Cy(0.04, 0.05, 0.9, 6), dk, 0.1, 0.08, 0.45, Math.PI / 2, 0, 0.2);
      add(
        new T.BoxGeometry(0.25, 0.1, 0.25),
        dk,
        -0.25,
        0.1,
        -0.1,
        0.3,
        0.5,
        0.2,
      );
    } else if (type === "freezer") {
      const ice = new T.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.35,
        roughness: 0.3,
        transparent: true,
        opacity: 0.85,
      });
      for (let i = 0; i < 5; i++) {
        const a = i * 1.3;
        add(
          new T.OctahedronGeometry(0.1 + 0.05 * (i % 2)),
          ice,
          Math.cos(a) * 0.28,
          0.1 + 0.1 * (i % 3 === 0),
          Math.sin(a) * 0.28,
          i,
          i * 0.7,
          0,
        );
      }
      add(new T.ConeGeometry(0.12, 0.45, 5), ice, 0, 0.25, 0, 0.25, 0, 0.2);
    } else if (type === "poison") {
      add(Cy(0.3, 0.2, 0.3, 12), dk, 0.05, 0.2, 0, 0, 0, 1.2);
      add(Cy(0.34, 0.34, 0.02, 14), glow(0x66dd33, 0.8), 0.15, 0.11, 0.15);
    } else if (type === "fire") {
      add(Cy(0.34, 0.28, 0.12, 10), ch, 0.1, 0.12, 0, 0.9, 0, 0);
      add(Cy(0.05, 0.06, 0.5, 6), dk, -0.2, 0.1, 0.2, 0, 0, Math.PI / 2);
      add(new T.ConeGeometry(0.1, 0.25, 6), glow(0xff7722), 0, 0.2, 0);
    } else if (type === "tesla") {
      add(Cy(0.2, 0.3, 0.3), dk, 0, 0.2, 0);
      add(Cy(0.1, 0.14, 0.5), ch, 0.15, 0.15, 0.1, 0, 0, 1.1);
      for (let i = 0; i < 3; i++)
        add(
          new T.TorusGeometry(0.18 - 0.03 * i, 0.03, 6, 14),
          ch,
          0.3 + i * 0.12,
          0.05,
          0.05 + i * 0.08,
          Math.PI / 2,
          0,
          0,
        );
      add(new T.SphereGeometry(0.08, 8, 8), glow(0xbfe4ff, 1.4), 0, 0.35, 0);
    } else if (type === "barracks") {
      add(new T.BoxGeometry(0.5, 0.25, 0.5), ch, 0, 0.2, 0, 0.1, 0, 0.1);
      add(new T.BoxGeometry(0.2, 0.15, 0.2), ch, 0.3, 0.1, 0.2, 0.4, 0.5, 0);
      add(
        new T.BoxGeometry(0.16, 0.16, 0.16),
        dk,
        -0.3,
        0.1,
        -0.1,
        0.2,
        0.7,
        0.3,
      );
      add(Cy(0.02, 0.02, 0.5, 5), dk, 0.1, 0.1, 0.3, Math.PI / 2, 0, 0.4);
    } else {
      add(Cy(0.34, 0.4, 0.2, 10), dk, 0, 0.15, 0);
      add(Cy(0.18, 0.26, 0.55, 10), ch, 0.2, 0.15, 0.1, 0, 0, 1.2);
      add(new T.SphereGeometry(0.12, 8, 8), dk, -0.25, 0.12, 0.2);
    }
    scene.add(g);
    return g;
  }
  dispose() {
    this.gone = true;
    this.clearSoldiers();
    this.scene.remove(this.g, this.bar);
    this.g.traverse((o) => {
      o.geometry?.dispose();
      o.material?.dispose();
    });
  }
}
