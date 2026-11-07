// Game state, economy and wave manager.
import * as THREE from 'three';
import { ENEMIES, TOWERS, START_GOLD, START_HP, MAX_WAVE, FIRST_COUNTDOWN, WAVE_GAP, waveDef } from './config.js';
import { Enemy } from './enemy.js';
import { Tower } from './tower.js';
import { Effects } from './projectile.js';
import { wp } from './grid.js';
export class Game {
  constructor(sc, grid, audio) {
    this.sc = sc; this.grid = grid; this.audio = audio; this.fx = new Effects(sc.scene);
    this.enemies = []; this.towers = []; this.projectiles = []; this.paused = false;
  }
  reset() {
    this.enemies.forEach(e => e.dispose(this.sc.scene)); this.towers.forEach(t => t.dispose());
    this.projectiles.forEach(p => !p.done && p.kill()); this.fx.clear();
    this.enemies = []; this.towers = []; this.projectiles = []; this.grid.occ.clear();
    Object.assign(this, { gold: START_GOLD, hp: START_HP, wave: 0, state: 'countdown', timer: FIRST_COUNTDOWN, queue: [], spawnT: 0, waveTotal: 1, over: false, hpMul: 1 });
    this.ui?.refresh();
  }
  pickables() { return this.grid.meshes.concat(...this.towers.map(t => t.meshes)); }
  build(type, x, y) {
    const d = TOWERS[type]; if (this.gold < d.cost || !this.grid.isBuildable(x, y)) return null;
    this.gold -= d.cost;
    const t = new Tower(type, x, y, wp(x, y), this.sc.scene);
    this.towers.push(t); this.grid.occ.set(x + ',' + y, t);
    this.audio.play('build'); this.fx.burst(wp(x, y), d.color, 12); this.ui.refresh(); return t;
  }
  upgrade(t) {
    const c = t.upgradeCost(); if (c == null || this.gold < c) return;
    this.gold -= c; t.spent += c; t.level++; t.build(); this.audio.play('upgrade');
    this.fx.burst(t.g.position, 0xffffff, 14); this.ui.refresh();
  }
  sell(t) {
    this.gold += t.sellValue(); this.grid.occ.delete(t.x + ',' + t.y);
    this.towers.splice(this.towers.indexOf(t), 1); t.dispose(); this.audio.play('sell'); this.ui.refresh();
  }
  startWave(early) {
    if (this.state !== 'countdown' || this.over) return;
    if (early) this.gold += Math.ceil(this.timer) * 2; // bonus for calling the wave early
    this.wave++; const def = waveDef(this.wave); this.hpMul = def.hp; this.queue = [];
    for (const g of def.g) for (let k = 0; k < g.c; k++) this.queue.push({ t: g.d + k * g.i, type: g.t });
    this.queue.sort((a, b) => a.t - b.t); this.waveTotal = this.queue.length; this.spawnT = 0; this.state = 'wave';
    this.audio.play('wave'); this.ui.refresh();
  }
  waveProgress() { return this.state === 'wave' ? (this.waveTotal - this.queue.length - this.enemies.length) / this.waveTotal : 1; }
  drop(i) { this.enemies[i].dispose(this.sc.scene); this.enemies.splice(i, 1); }
  update(dt) {
    if (this.over || this.paused) return;
    if (this.state === 'countdown') { this.timer -= dt; if (this.timer <= 0) this.startWave(false); }
    else {
      this.spawnT += dt;
      while (this.queue.length && this.queue[0].t <= this.spawnT) this.enemies.push(new Enemy(this.queue.shift().type, this.hpMul, this.grid.waypoints, this.sc.scene));
    }
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.dead) { // reward + death burst
        this.gold += Math.round(e.c.reward * (1 + this.wave * .03));
        this.fx.burst(e.g.position.clone().setY(.4), e.c.color, 16, 3.5, .1); this.audio.play('death'); this.drop(i); this.ui.refresh(); continue;
      }
      e.update(dt, this.sc.cam);
      if (e.reached) { // base hit: damage, shake, vignette
        this.hp -= e.c.dmg; this.sc.shake = .5; this.audio.play('base'); this.ui.vignette();
        this.fx.burst(e.g.position, 0xff3355, 14); this.drop(i); this.ui.refresh();
      }
    }
    this.towers.forEach(t => t.update(dt, this.enemies, this));
    this.projectiles.forEach(p => p.update(dt, this));
    this.projectiles = this.projectiles.filter(p => !p.done);
    this.fx.update(dt);
    if (this.hp <= 0) { this.hp = 0; return this.finish(false); }
    if (this.state === 'wave' && !this.queue.length && !this.enemies.length) { // wave cleared
      this.gold += 20 + this.wave * 5; this.audio.play('clear');
      if (this.wave >= MAX_WAVE) return this.finish(true);
      this.state = 'countdown'; this.timer = WAVE_GAP; this.ui.refresh();
    }
  }
  finish(win) { this.over = true; this.audio.play(win ? 'clear' : 'over'); this.ui.refresh(); this.ui.end(win); }
}
