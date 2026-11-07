// Projectiles (homing spheres) and particle effects.
import * as THREE from 'three';
export class Projectile {
  constructor(from, target, tower, scene) {
    this.target = target; this.dmg = tower.dmg; this.def = tower.def; this.scene = scene; this.done = false;
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(tower.type === 'sniper' ? .06 : .09, 8, 8), new THREE.MeshBasicMaterial({ color: this.def.proj }));
    this.mesh.position.copy(from); scene.add(this.mesh);
  }
  update(dt, game) {
    const t = this.target;
    if (t.dead || t.reached) return this.kill();
    const to = t.g.position.clone(); to.y += .4;
    const d = to.sub(this.mesh.position), dist = d.length(), step = this.def.speed * dt;
    game.fx.burst(this.mesh.position, this.def.proj, 1, .3, .04); // trail
    if (dist <= step + .1) {
      t.hit(this.dmg); if (this.def.slow) t.applySlow(this.def.slow, this.def.slowT);
      game.fx.burst(this.mesh.position, this.def.proj, 5, 2, .06); game.audio.play('hit'); this.kill();
    } else this.mesh.position.addScaledVector(d, step / dist);
  }
  kill() { this.done = true; this.scene.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}
export class Effects {
  constructor(scene) { this.scene = scene; this.list = []; this.geo = new THREE.BoxGeometry(1, 1, 1); }
  burst(pos, color, n = 10, spd = 2.5, size = .07) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(this.geo, new THREE.MeshBasicMaterial({ color, transparent: true }));
      m.position.copy(pos); m.scale.setScalar(size); this.scene.add(m);
      this.list.push({ m, life: .5, v: new THREE.Vector3((Math.random() - .5) * spd, Math.random() * spd, (Math.random() - .5) * spd) });
    }
  }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i]; p.life -= dt; p.v.y -= 6 * dt; p.m.position.addScaledVector(p.v, dt);
      p.m.material.opacity = Math.max(p.life / .5, 0);
      if (p.life <= 0) { this.scene.remove(p.m); p.m.material.dispose(); this.list.splice(i, 1); }
    }
  }
  clear() { this.list.forEach(p => { this.scene.remove(p.m); p.m.material.dispose(); }); this.list = []; }
}
