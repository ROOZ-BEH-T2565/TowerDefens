// Air Sweeper: starts ruined. Once repaired it blasts wind through a TRIANGULAR zone (rotatable) that pushes enemies back
// along the path. It can be destroyed by enemy attacks and repaired again (each repair costs 5% more).
import * as THREE from "three";
import { wp } from "./grid.js";
const T = THREE;
export class Sweeper {
  constructor(scene, x = 6, y = 6, enabled = true) {
    Object.assign(this, {
      scene,
      x,
      y,
      enabled,
      cost: 60,
      costF: 60,
      range: 4.2,
      tan: 1,
      push: 1.5,
      every: 3.5,
      repaired: false,
      cd: 1,
      blast: 0,
      isSweeper: true,
      angle: Math.PI,
      hp: 220,
      maxHp: 220,
      def: { elem: "stone" },
    });
    this.g = new T.Group();
    this.g.position.copy(wp(this.x, this.y));
    scene.add(this.g);
    this.build();
    // invisible click target so the visible ruin/tower itself selects this tile
    this.hit = new T.Mesh(
      new T.BoxGeometry(0.95, 1.3, 0.95),
      new T.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    this.hit.position.y = 0.65;
    this.hit.userData = { x: this.x, y: this.y };
    this.g.add(this.hit);
    // triangular wind zone (apex at the tower, points along +z before rotation)
    const R = this.range,
      w = R * this.tan,
      sh = new T.Shape();
    sh.moveTo(0, 0);
    sh.lineTo(-w, R);
    sh.lineTo(w, R);
    sh.closePath();
    this.tri = new T.Mesh(
      new T.ShapeGeometry(sh).rotateX(Math.PI / 2),
      new T.MeshBasicMaterial({
        color: 0x9fe8ff,
        transparent: true,
        opacity: 0.14,
        side: T.DoubleSide,
        depthWrite: false,
      }),
    );
    this.tri.add(
      new T.LineLoop(
        new T.BufferGeometry().setFromPoints([
          new T.Vector3(0, 0, 0),
          new T.Vector3(-w, 0, R),
          new T.Vector3(w, 0, R),
        ]),
        new T.LineBasicMaterial({ color: 0x66e0ff }),
      ),
    );
    this.tri.position.y = 0.07;
    this.tri.rotation.y = this.angle;
    this.tri.visible = false;
    this.g.add(this.tri);
    const bg = new T.Mesh(
      new T.PlaneGeometry(0.7, 0.08),
      new T.MeshBasicMaterial({ color: 0x111111, depthTest: false }),
    );
    this.fg = new T.Mesh(
      new T.PlaneGeometry(0.7, 0.08),
      new T.MeshBasicMaterial({ color: 0x44ff66, depthTest: false }),
    );
    if (!enabled) this.g.visible = false; // this level has no Air Sweeper
    bg.renderOrder = 10;
    this.fg.renderOrder = 11;
    this.fg.position.z = 0.001;
    this.bar = new T.Group();
    this.bar.add(bg, this.fg);
    this.bar.position.copy(this.g.position).y += 1.5;
    this.bar.visible = false;
    scene.add(this.bar);
  }
  get isRuined() {
    return !this.repaired;
  }
  rotate(step) {
    this.angle += (step * Math.PI) / 4;
    this.tri.rotation.y = this.angle;
  } // 45° steps
  repair() {
    this.repaired = true;
    this.hp = this.maxHp;
    this.costF *= 1.05;
    this.cost = Math.round(this.costF);
    this.build();
    this.tri.visible = true;
  } // next repair +5%
  ruin() {
    this.repaired = false;
    this.hp = this.maxHp;
    this.build();
    this.tri.visible = false;
    this.bar.visible = false;
    this.blast = 0;
  }
  build() {
    if (this.body) this.g.remove(this.body);
    const b = new T.Group(),
      mat = (c) =>
        new T.MeshStandardMaterial({
          color: c,
          roughness: 0.8,
          metalness: 0.3,
        });
    const add = (geo, m, x, y, z, rx = 0, rz = 0) => {
      const o = new T.Mesh(geo, m);
      o.position.set(x, y, z);
      o.rotation.set(rx, 0, rz);
      o.castShadow = true;
      b.add(o);
      return o;
    };
    add(
      new T.CylinderGeometry(0.42, 0.45, 0.12, 14),
      mat(0x1d2433),
      0,
      0.06,
      0,
    );
    if (!this.repaired) {
      // ruined: broken stump, fallen blade, rubble
      const st = mat(0x6b6b73);
      add(new T.CylinderGeometry(0.22, 0.3, 0.5, 7), st, 0, 0.35, 0);
      add(new T.BoxGeometry(0.25, 0.18, 0.2), st, 0.3, 0.15, 0.1, 0.3, 0.4);
      add(
        new T.BoxGeometry(0.18, 0.12, 0.2),
        st,
        -0.28,
        0.12,
        -0.15,
        0.2,
        -0.3,
      );
      add(
        new T.BoxGeometry(0.7, 0.04, 0.12),
        mat(0x5a4a3a),
        0.1,
        0.16,
        0.32,
        0,
        0.15,
      );
    } else {
      // repaired: tower with a spinning fan
      add(
        new T.CylinderGeometry(0.18, 0.26, 0.8, 10),
        mat(0x8b95a8),
        0,
        0.5,
        0,
      );
      add(
        new T.TorusGeometry(0.22, 0.04, 6, 16).rotateX(Math.PI / 2),
        new T.MeshStandardMaterial({
          color: 0x66e0ff,
          emissive: 0x66e0ff,
          emissiveIntensity: 0.8,
        }),
        0,
        0.55,
        0,
      );
      this.rotor = new T.Group();
      this.rotor.position.y = 1;
      for (let i = 0; i < 4; i++) {
        const bl = new T.Mesh(
          new T.BoxGeometry(0.6, 0.04, 0.14),
          mat(0xdfe8ff),
        );
        bl.position.x = 0.3;
        const pv = new T.Group();
        pv.rotation.y = (i * Math.PI) / 2;
        pv.add(bl);
        this.rotor.add(pv);
      }
      b.add(this.rotor);
    }
    this.body = b;
    this.g.add(b);
  }
  setState(rep, ang, hp, cost) {
    // multiplayer client: mirror the host's sweeper
    this.angle = ang;
    this.tri.rotation.y = ang;
    this.hp = hp;
    this.cost = cost;
    if (rep !== this.repaired) {
      this.repaired = rep;
      this.build();
      this.tri.visible = rep;
    }
  }
  update(dt, game) {
    if (!this.enabled) return;
    const r = Math.max(this.hp / this.maxHp, 0.001);
    this.bar.visible = this.repaired && this.hp < this.maxHp;
    this.fg.scale.x = r;
    this.fg.position.x = -(1 - r) * 0.35;
    this.bar.quaternion.copy(game.sc.cam.quaternion);
    if (!this.repaired) return;
    if (game.remote) {
      this.rotor.rotation.y += dt * (this.blast > 0 ? 18 : 3);
      this.blast -= dt;
      this.tri.material.opacity = 0.14 + Math.max(0, this.blast) * 0.5;
      return;
    } // client: visuals only
    this.tri.material.opacity = 0.14 + Math.max(0, this.blast) * 0.5; // zone flashes when the wind blows
    this.rotor.rotation.y += dt * (this.blast > 0 ? 18 : 3);
    this.blast -= dt;
    this.cd -= dt;
    if (this.cd > 0) return;
    const p = this.g.position,
      fx = Math.sin(this.angle),
      fz = Math.cos(this.angle);
    const hit = game.enemies.filter((e) => {
      // inside the triangle: forward distance f, sideways offset l
      if (e.dead) return false;
      const dx = e.g.position.x - p.x,
        dz = e.g.position.z - p.z,
        f = dx * fx + dz * fz,
        l = dx * fz - dz * fx;
      return f > 0 && f <= this.range && Math.abs(l) <= f * this.tan;
    });
    if (!hit.length) return;
    this.cd = this.every;
    this.blast = 0.6;
    game.audio.play("wind");
    for (let k = 0; k < 10; k++) {
      const f = 0.5 + Math.random() * (this.range - 0.5),
        l = (Math.random() * 2 - 1) * f * this.tan;
      game.fx.burst(
        new T.Vector3(p.x + fx * f + fz * l, 0.4, p.z + fz * f - fx * l),
        0xdfe8ff,
        2,
        1.5,
        0.06,
      );
    }
    for (const e of hit) {
      e.pushBack(this.push * (e.c.resist ?? 1));
      game.fx.burst(e.g.position.clone().setY(0.5), 0xdfe8ff, 5, 2, 0.06);
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
