// Game state, economy and wave manager.
import * as THREE from "three";
import {
  ENEMIES,
  TOWERS,
  START_GOLD,
  START_HP,
  MAX_WAVE,
  FIRST_COUNTDOWN,
  WAVE_GAP,
  waveDef,
  TOWER_CAP_BASE,
  STEP,
  elemMult,
  ELEM_COLOR,
} from "./config.js";
import { t } from "./i18n.js";
import { Enemy } from "./enemy.js";
import { Tower } from "./tower.js";
import { Effects, Shot } from "./projectile.js";
import { wp } from "./grid.js";
export class Game {
  constructor(sc, grid, audio) {
    this.sc = sc;
    this.grid = grid;
    this.audio = audio;
    this.fx = new Effects(sc.scene);
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.paused = false;
  }
  reset() {
    this.enemies.forEach((e) => e.dispose(this.sc.scene));
    this.towers.forEach((t) => t.dispose());
    this.projectiles.forEach((p) => !p.done && p.kill());
    this.fx.clear();
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.grid.occ.clear();
    Object.assign(this, {
      gold: START_GOLD,
      hp: START_HP,
      wave: 0,
      state: "countdown",
      timer: FIRST_COUNTDOWN,
      queue: [],
      spawnT: 0,
      waveTotal: 1,
      over: false,
      hpMul: 1,
    });
    this.ui?.refresh();
  }
  pickables() {
    return this.grid.meshes.concat(...this.towers.map((t) => t.meshes));
  }
  get cap() {
    return TOWER_CAP_BASE + Math.floor(this.wave / STEP);
  } // tower limit grows slowly
  build(type, x, y) {
    const d = TOWERS[type];
    if (
      this.gold < d.cost ||
      this.towers.length >= this.cap ||
      !this.grid.isBuildable(x, y)
    )
      return null;
    this.gold -= d.cost;
    const t = new Tower(type, x, y, wp(x, y), this.sc.scene);
    this.towers.push(t);
    this.grid.occ.set(x + "," + y, t);
    this.audio.play("build");
    this.fx.burst(wp(x, y), d.color, 12);
    this.ui.refresh();
    return t;
  }
  upgrade(t) {
    const c = t.upgradeCost(this.wave);
    if (c == null || this.gold < c) return;
    this.gold -= c;
    t.spent += c;
    t.level++;
    t.build();
    t.hp = t.maxHp;
    this.audio.play("upgrade");
    this.fx.burst(t.g.position, 0xffffff, 14);
    this.ui.refresh();
  }
  sell(t) {
    this.gold += t.sellValue();
    this.grid.occ.delete(t.x + "," + t.y);
    this.towers.splice(this.towers.indexOf(t), 1);
    t.dispose();
    this.audio.play("sell");
    this.ui.refresh();
  }
  startWave(early) {
    if (this.state !== "countdown" || this.over) return;
    if (early) this.gold += Math.ceil(this.timer) * 2; // bonus for calling the wave early
    this.wave++;
    const def = waveDef(this.wave);
    this.hpMul = def.hp;
    this.queue = [];
    for (const g of def.g)
      for (let k = 0; k < g.c; k++)
        this.queue.push({ t: g.d + k * g.i, type: g.t });
    this.queue.sort((a, b) => a.t - b.t);
    this.waveTotal = this.queue.length;
    this.spawnT = 0;
    this.state = "wave";
    this.audio.play("wave");
    this.ui.refresh();
    for (const k in ENEMIES)
      if (ENEMIES[k].from === this.wave && this.wave > 1)
        this.ui.toast(`⚠️ ${t("newEnemy")}: ${t(k)} — ${t("ab_" + k)}`);
  }
  enemyAttack(e, tower) {
    // enemy shoots a tower with its element
    const a = e.c.atk,
      from = e.g.position.clone();
    from.y = e.c.size * 3;
    this.projectiles.push(
      new Shot(from, tower, ELEM_COLOR[a.elem], this.sc.scene, () =>
        this.damageTower(tower, a.dmg, a.elem, a.stun),
      ),
    );
  }
  damageTower(tw, dmg, elem, stun) {
    if (tw.gone) return;
    tw.hp -= dmg * elemMult(elem, tw.def.elem);
    if (stun) tw.stun = stun;
    if (tw.hp <= 0) {
      // tower destroyed
      this.fx.burst(tw.g.position.clone().setY(0.5), 0x888888, 20, 4, 0.12);
      this.grid.occ.delete(tw.x + "," + tw.y);
      this.towers.splice(this.towers.indexOf(tw), 1);
      tw.dispose();
      this.audio.play("death");
      this.ui.refresh();
    }
  }
  waveProgress() {
    return this.state === "wave"
      ? (this.waveTotal - this.queue.length - this.enemies.length) /
          this.waveTotal
      : 1;
  }
  drop(i) {
    this.enemies[i].dispose(this.sc.scene);
    this.enemies.splice(i, 1);
  }
  update(dt) {
    if (this.over || this.paused) return;
    if (this.state === "countdown") {
      this.timer -= dt;
      if (this.timer <= 0) this.startWave(false);
    } else {
      this.spawnT += dt;
      while (this.queue.length && this.queue[0].t <= this.spawnT)
        this.enemies.push(
          new Enemy(
            this.queue.shift().type,
            this.hpMul,
            this.grid.waypoints,
            this.sc.scene,
          ),
        );
    }
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.dead) {
        // reward + death burst
        this.gold += Math.round(e.c.reward * (1 + this.wave * 0.03));
        this.fx.burst(e.g.position.clone().setY(0.4), e.c.color, 16, 3.5, 0.1);
        this.audio.play("death");
        this.drop(i);
        this.ui.refresh();
        continue;
      }
      e.update(dt, this.sc.cam, this);
      if (e.reached) {
        // base hit: damage, shake, vignette
        this.hp -= e.c.dmg;
        this.sc.shake = 0.5;
        this.audio.play("base");
        this.ui.vignette();
        this.fx.burst(e.g.position, 0xff3355, 14);
        this.drop(i);
        this.ui.refresh();
      }
    }
    if (this.state === "countdown")
      this.towers.forEach((w) => {
        w.hp = Math.min(w.maxHp, w.hp + 12 * dt);
      }); // repair between waves
    this.towers.forEach((w) => w.update(dt, this.enemies, this));
    this.projectiles.forEach((p) => p.update(dt, this));
    this.projectiles = this.projectiles.filter((p) => !p.done);
    this.fx.update(dt);
    if (this.hp <= 0) {
      this.hp = 0;
      return this.finish(false);
    }
    if (this.state === "wave" && !this.queue.length && !this.enemies.length) {
      // wave cleared
      this.gold += 20 + this.wave * 5;
      this.audio.play("clear");
      if (this.wave >= MAX_WAVE) return this.finish(true);
      this.state = "countdown";
      this.timer = WAVE_GAP;
      this.ui.refresh();
    }
  }
  finish(win) {
    this.over = true;
    this.audio.play(win ? "clear" : "over");
    this.ui.refresh();
    this.ui.end(win);
  }
}
