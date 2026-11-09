// Barracks soldier: a small sword fighter that walks to the nearest enemy near its barracks, blocks it and fights.
import * as THREE from "three";
import { elemMult } from "./config.js";
const T = THREE;
function model() {
  const g = new T.Group(),
    M = (c, o = {}) =>
      new T.MeshStandardMaterial({
        color: c,
        roughness: 0.6,
        metalness: 0.3,
        ...o,
      });
  const add = (geo, m, x, y, z, p = g) => {
    const o = new T.Mesh(geo, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    p.add(o);
    return o;
  };
  add(new T.CapsuleGeometry(0.07, 0.12, 3, 6), M(0x4f6fd0), 0, 0.17, 0);
  add(new T.SphereGeometry(0.065, 8, 6), M(0xe0b890), 0, 0.34, 0);
  add(
    new T.SphereGeometry(0.072, 8, 6, 0, 6.283, 0, 1.5),
    M(0x9aa3b0, { metalness: 0.7 }),
    0,
    0.355,
    0,
  ); // helmet
  add(
    new T.CylinderGeometry(0.075, 0.075, 0.02, 10).rotateZ(Math.PI / 2),
    M(0xc9a23a),
    -0.1,
    0.18,
    0.02,
  ); // shield
  const sword = new T.Group();
  sword.position.set(0.1, 0.2, 0.04);
  g.add(sword);
  add(
    new T.BoxGeometry(0.018, 0.018, 0.2),
    M(0xdfe6ee, { metalness: 0.9 }),
    0,
    0,
    0.1,
    sword,
  );
  g.userData.sword = sword; // blade
  return g;
}
export class Soldier {
  constructor(scene, pos, home, tw) {
    Object.assign(this, {
      scene,
      home,
      dead: false,
      cd: 0,
      target: null,
      t: Math.random() * 6,
      fight: 0,
    });
    this.g = model();
    this.g.position.copy(pos);
    scene.add(this.g);
    this.hp = this.max = tw.soldierHp;
    const bg = new T.Mesh(
      new T.PlaneGeometry(0.24, 0.035),
      new T.MeshBasicMaterial({ color: 0x111111, depthTest: false }),
    );
    this.fgm = new T.Mesh(
      new T.PlaneGeometry(0.24, 0.035),
      new T.MeshBasicMaterial({ color: 0x5b9bff, depthTest: false }),
    );
    bg.renderOrder = 10;
    this.fgm.renderOrder = 11;
    this.fgm.position.z = 0.001;
    this.bar = new T.Group();
    this.bar.add(bg, this.fgm);
    scene.add(this.bar);
  }
  update(dt, tw, enemies, game) {
    this.t += dt;
    this.max = tw.soldierHp;
    if (this.hp > this.max) this.hp = this.max;
    const base = tw.g.position,
      pos = this.g.position,
      range = tw.range;
    if (
      !this.target ||
      this.target.dead ||
      this.target.reached ||
      Math.hypot(
        this.target.g.position.x - base.x,
        this.target.g.position.z - base.z,
      ) >
        range + 0.5
    ) {
      this.target = null;
      let bd = 1e9; // nearest enemy inside the barracks' guard radius
      for (const e of enemies) {
        if (e.dead) continue;
        const d = Math.hypot(e.g.position.x - base.x, e.g.position.z - base.z);
        if (d <= range && d < bd) {
          bd = d;
          this.target = e;
        }
      }
    }
    const goal = this.target ? this.target.g.position : this.home,
      dx = goal.x - pos.x,
      dz = goal.z - pos.z,
      d = Math.hypot(dx, dz),
      stop = this.target ? 0.36 : 0.04;
    this.fight = Math.max(0, this.fight - dt);
    if (d > stop) {
      const sp = Math.min(2.2 * dt, d - stop);
      pos.x += (dx / d) * sp;
      pos.z += (dz / d) * sp;
      this.g.rotation.y = Math.atan2(dx, dz);
      pos.y = Math.abs(Math.sin(this.t * 14)) * 0.02;
    } else if (this.target) {
      // in melee: the enemy is blocked and trades blows with the soldier
      this.target.engaged = 0.15;
      this.fight = 0.2;
      if (dx || dz) this.g.rotation.y = Math.atan2(dx, dz);
      if ((this.cd -= dt) <= 0) {
        this.cd = 1 / tw.rate;
        this.target.hit(tw.dmg * elemMult("stone", this.target.c.elem));
        game.fx.burst(
          this.target.g.position.clone().setY(0.3),
          0xffffff,
          3,
          1.5,
          0.04,
        );
        game.audio.play("hit");
      }
      this.hp -= this.target.c.dmg * 4 * dt;
    }
    this.g.userData.sword.rotation.x =
      this.fight > 0 ? Math.sin(this.t * 22) * 0.9 : 0; // sword swing
    this.bar.position.copy(pos).y += 0.5;
    this.bar.quaternion.copy(game.sc.cam.quaternion);
    const r = Math.max(this.hp / this.max, 0.001);
    this.fgm.scale.x = r;
    this.fgm.position.x = -(1 - r) * 0.12;
    if (this.hp <= 0) {
      this.dead = true;
      game.fx.burst(pos.clone().setY(0.2), 0x5b7bd5, 8, 2.5, 0.06);
    }
  }
  dispose() {
    this.scene.remove(this.g, this.bar);
    [this.g, this.bar].forEach((o) =>
      o.traverse((m) => {
        m.geometry?.dispose();
        m.material?.dispose();
      }),
    );
  }
}
