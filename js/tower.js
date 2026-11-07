// Tower: distinct 3D silhouettes, targeting, firing, upgrades.
import * as THREE from "three";
import { TOWERS, UPGRADE_INFLATION, STEP } from "./config.js";
import { Projectile } from "./projectile.js";
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
    return this.def.dmg * Math.pow(1.6, this.level - 1);
  }
  get range() {
    return this.def.range * (1 + 0.12 * (this.level - 1));
  }
  get rate() {
    return this.def.rate * (1 + 0.15 * (this.level - 1));
  }
  upgradeCost(wave = 0) {
    // gets pricier every STEP waves
    return this.level >= 3
      ? null
      : Math.round(
          this.def.cost *
            (this.level === 1 ? 0.8 : 1.2) *
            (1 + UPGRADE_INFLATION * Math.floor(wave / STEP)),
        );
  }
  get maxHp() {
    return this.def.hp * (1 + 0.3 * (this.level - 1));
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
    this.bar.position.copy(this.g.position).y += 1.5;
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
  sellValue() {
    return Math.floor(this.spent * 0.5);
  }
  get meshes() {
    const a = [];
    this.g.traverse((o) => o.isMesh && a.push(o));
    return a;
  }
  build() {
    // (re)build the rotating top section; scaled up per level
    if (this.top) this.g.remove(this.top);
    const d = this.def,
      top = new THREE.Group(),
      T = THREE;
    const m = new T.MeshStandardMaterial({
      color: d.color,
      roughness: 0.4,
      metalness: 0.5,
      emissive: d.color,
      emissiveIntensity: 0.15,
    });
    const dk = new T.MeshStandardMaterial({
      color: 0x2b2f3a,
      roughness: 0.6,
      metalness: 0.6,
    });
    const add = (geo, mat, x, y, z) => {
      const o = new T.Mesh(geo, mat);
      o.position.set(x, y, z);
      o.castShadow = true;
      top.add(o);
      return o;
    };
    let tip = [0, 0.7, 0];
    this.crystal = null;
    if (this.type === "cannon") {
      add(new T.CylinderGeometry(0.28, 0.34, 0.4, 16), m, 0, 0.3, 0);
      add(
        new T.CylinderGeometry(0.08, 0.1, 0.55, 10).rotateX(Math.PI / 2),
        dk,
        0,
        0.55,
        0.3,
      );
      tip = [0, 0.55, 0.6];
    } else if (this.type === "sniper") {
      add(new T.CylinderGeometry(0.12, 0.2, 1, 8), m, 0, 0.6, 0);
      add(new T.BoxGeometry(0.3, 0.12, 0.3), dk, 0, 1.15, 0);
      add(
        new T.CylinderGeometry(0.04, 0.05, 0.9, 8).rotateX(Math.PI / 2),
        dk,
        0,
        1.15,
        0.45,
      );
      tip = [0, 1.15, 0.9];
    } else {
      this.crystal = add(new T.OctahedronGeometry(0.32), m, 0, 0.7, 0);
      this.crystal.scale.y = 1.7;
      add(new T.CylinderGeometry(0.25, 0.3, 0.2, 6), dk, 0, 0.2, 0);
    }
    this.muz = new T.Mesh(
      new T.SphereGeometry(0.1, 8, 8),
      new T.MeshBasicMaterial({ color: d.proj }),
    );
    this.muz.position.set(...tip);
    this.muz.visible = false;
    top.add(this.muz);
    top.scale.setScalar(1 + 0.12 * (this.level - 1));
    this.top = top;
    this.g.add(top);
    this.g.traverse((o) => {
      if (o.isMesh) o.userData = { x: this.x, y: this.y };
    });
  }
  update(dt, enemies, game) {
    this.cd -= dt;
    this.stun -= dt;
    this.updBar(game.sc.cam);
    if (this.flash > 0 && (this.flash -= dt) <= 0) this.muz.visible = false;
    if (this.crystal) this.crystal.rotation.y += dt * 1.5;
    const p = this.g.position,
      r = this.range;
    let best = null;
    for (const e of enemies) {
      // target = enemy furthest along the path within range
      if (e.dead) continue;
      const dx = e.g.position.x - p.x,
        dz = e.g.position.z - p.z;
      if (dx * dx + dz * dz <= r * r && (!best || e.progress > best.progress))
        best = e;
    }
    if (!best || this.stun > 0) return; // stunned towers can't fire
    if (!this.crystal)
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
      game.projectiles.push(new Projectile(from, best, this, this.scene));
      game.audio.play("shoot", this.type);
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
