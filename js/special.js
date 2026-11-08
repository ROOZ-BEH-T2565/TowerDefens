// Special structures: the ruined Air Sweeper. Repair it once, then it blasts wind that pushes enemies back along the path.
import * as THREE from "three";
import { wp } from "./grid.js";
const T = THREE;
export class Sweeper {
  constructor(scene) {
    Object.assign(this, {
      scene,
      x: 6,
      y: 6,
      cost: 90,
      range: 3.2,
      push: 1.5,
      every: 3.5,
      repaired: false,
      cd: 1,
      blast: 0,
      isSweeper: true,
      gone: false,
    });
    this.g = new T.Group();
    this.g.position.copy(wp(this.x, this.y));
    scene.add(this.g);
    this.build();
  }
  repair() {
    this.repaired = true;
    this.build();
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
  update(dt, game) {
    if (!this.repaired) return;
    this.rotor.rotation.y += dt * (this.blast > 0 ? 18 : 3);
    this.blast -= dt;
    this.cd -= dt;
    if (this.cd > 0) return;
    const p = this.g.position,
      hit = game.enemies.filter(
        (e) => !e.dead && e.g.position.distanceTo(p) <= this.range,
      );
    if (!hit.length) return;
    this.cd = this.every;
    this.blast = 0.6;
    game.audio.play("wind");
    game.fx.ring(p, 0xdfe8ff, this.range);
    for (const e of hit) {
      e.pushBack(this.push * (e.c.resist ?? 1));
      game.fx.burst(e.g.position.clone().setY(0.5), 0xdfe8ff, 5, 2, 0.06);
    }
  }
  dispose() {
    this.gone = true;
    this.scene.remove(this.g);
    this.g.traverse((o) => {
      o.geometry?.dispose();
      o.material?.dispose();
    });
  }
}
