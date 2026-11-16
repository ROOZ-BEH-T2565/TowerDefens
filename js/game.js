// Game state, economy, waves, spells and tower destruction.
import { LEVELS, ENEMIES, TOWERS, START_HP, FIRST_COUNTDOWN, WAVE_GAP, waveDef, maxLevelFor, endlessLevel, TOWER_CAP_BASE, STEP, WAVE_REPAIR, elemMult, ELEM_COLOR, SPELLS } from './config.js';
import { t } from './i18n.js';
import { Enemy } from './enemy.js';
import { Tower } from './tower.js';
import { Effects, Shot } from './projectile.js';
import { Sweeper } from './special.js';
import { buildDecor } from './decor.js';
import { wp } from './grid.js';
const DEFAULT_DECK = ['cannon'];
export class Game {
  constructor(sc, grid, audio) {
    this.sc = sc; this.grid = grid; this.audio = audio; this.fx = new Effects(sc.scene);
    this.enemies = []; this.towers = []; this.projectiles = []; this.wrecks = []; this.dying = []; this.ruins = []; this.paused = false; this.mp = false; this.net = null;
    this.levelIdx = 0; this.level = LEVELS[0]; this.decor = null;
  }
  start(idx, deck) { this.load(LEVELS[idx], idx, deck); }
  startEndless(map, diff, players = 1) { this.load(endlessLevel(map, diff, players), map, Object.keys(TOWERS)); } // endless / multiplayer: every tower and enemy
  load(L, idx, deck) { // load a level: map, theme, scenery, ambient particles, then reset the run
    this.sc.resetView(); this.levelIdx = idx; this.level = L; this.grid.load(L); this.sc.setGround(L.theme.ground, L.theme.style); this.sc.setAmbient(L.theme.fx);
    if (this.decor) { this.sc.scene.remove(this.decor); this.decor.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); }
    this.decor = buildDecor(this.sc.scene, this.grid, L, idx); this.reset(deck);
  }
  clearWorld() { // dispose everything dynamic (also used when switching between single player and multiplayer)
    this.enemies.forEach(e => e.dispose(this.sc.scene)); this.dying.forEach(e => e.dispose(this.sc.scene)); this.towers.forEach(w => w.dispose());
    this.wrecks.forEach(w => { w.tw.dispose(); if (w.ruin) this.dropRuin(w.ruin); }); this.ruins.forEach(r => this.dropRuin(r.g));
    this.projectiles.forEach(p => !p.done && p.kill()); this.fx.clear(); this.sweeper?.dispose();
    this.enemies = []; this.dying = []; this.towers = []; this.projectiles = []; this.wrecks = []; this.ruins = []; this.grid.occ.clear();
  }
  reset(deck) {
    this.clearWorld(); const sw = this.level.sweeper; this.sweeper = new Sweeper(this.sc.scene, sw ? sw[0] : 0, sw ? sw[1] : 0, !!sw); // ruined Air Sweeper (from level 5)
    if (sw) this.grid.occ.set(sw[0] + ',' + sw[1], this.sweeper);
    this.deck = deck || this.deck || DEFAULT_DECK;
    Object.assign(this, { gold: this.level.gold, kills: 0, hp: this.level.baseHp ?? START_HP, maxHp: this.level.baseHp ?? START_HP, wave: 0, state: 'countdown', timer: FIRST_COUNTDOWN, queue: [], spawnT: 0, waveTotal: 1, over: false, hpMul: 1, charge: 0, spells: { freeze: 0, meteor: 0, repair: 0 }, strikes: [], hazT: 7 });
    this.ui?.refresh();
  }
  evt(...a) { if (this.net && this.net.ev.length < 60) this.net.ev.push(a); } // multiplayer host: queue an event for the clients
  get maxLv() { return this.level.endless ? 6 : maxLevelFor(this.levelIdx); } // highest tower level allowed in this stage
  get cap() { return TOWER_CAP_BASE + Math.floor(this.wave / STEP); } // tower limit grows slowly
  pickables() { return this.ui.armed || !this.sweeper.enabled ? this.grid.meshes : this.grid.meshes.concat(this.sweeper.hit); } // tiles only (+ sweeper click target)
  build(type, x, y, owner = 0) {
    const d = TOWERS[type]; if (this.gold < d.cost || this.towers.length >= this.cap || !this.grid.isBuildable(x, y)) return null;
    this.gold -= d.cost;
    const w = new Tower(type, x, y, wp(x, y), this.sc.scene);
    if (this.mp) w.setOwner(owner); w.pop = .35; w.popUp = false; w.g.scale.setScalar(.02); // pop-in animation
    this.towers.push(w); this.grid.occ.set(x + ',' + y, w);
    this.audio.play('build'); this.fx.burst(wp(x, y), d.color, 12); this.ui.refresh(); return w;
  }
  upgrade(w) {
    const c = w.upgradeCost(this.wave, this.maxLv); if (c == null || this.gold < c) return;
    this.gold -= c; w.spent += c; w.level++; w.build(); w.hp = w.maxHp; w.pop = .35; w.popUp = true; this.audio.play('upgrade');
    this.fx.burst(w.g.position, 0xffffff, 14); this.fx.ring(w.g.position, 0xffd700, 1); this.ui.refresh();
  }
  sell(w) {
    this.gold += w.sellValue(); this.grid.occ.delete(w.x + ',' + w.y);
    this.towers.splice(this.towers.indexOf(w), 1); w.dispose(); this.audio.play('sell'); this.ui.refresh();
  }
  startWave(early) {
    if (this.state !== 'countdown' || this.over) return;
    if (early) this.gold += Math.ceil(this.timer) * 2; // bonus for calling the wave early
    this.wave++; const def = waveDef(this.level, this.wave); this.hpMul = def.hp; this.queue = [];
    for (const g of def.g) for (let k = 0; k < g.c; k++) this.queue.push({ t: g.d + k * g.i, type: g.t });
    this.queue.sort((a, b) => a.t - b.t); this.waveTotal = this.queue.length; this.spawnT = 0; this.state = 'wave';
    this.audio.play('wave'); this.ui.refresh();
    for (const k in this.level.enemies) if (this.level.enemies[k] === this.wave && this.wave > 1) { const m = `⚠️ ${t('newEnemy')}: ${ENEMIES[k].icon} ${t(k)} — ${t('ab_' + k)}`; this.ui.toast(m); this.evt('toast', m); }
  }
  waveProgress() { return this.state === 'wave' ? Math.max(0, Math.min(1, (this.waveTotal - this.queue.length - this.enemies.length) / this.waveTotal)) : 1; }
  spawnEnemy(type, from) { // minions (summons, golem splits) appear at the parent's spot on the path
    const e = new Enemy(type, this.hpMul, this.grid.waypoints, this.sc.scene);
    e.i = from.i; e.g.position.copy(from.g.position); e.g.position.x += (Math.random() - .5) * .3; e.g.position.z += (Math.random() - .5) * .3;
    this.enemies.push(e); return e;
  }
  kill(i) { // enemy died: shrink and tumble away instead of vanishing
    const e = this.enemies[i]; this.enemies.splice(i, 1); e.bar.visible = false; e.dying = .28; this.dying.push(e);
  }
  updDying(dt) {
    for (let i = this.dying.length - 1; i >= 0; i--) {
      const e = this.dying[i]; e.dying -= dt; const k = Math.max(0, e.dying / .28);
      e.g.scale.setScalar(.15 + .85 * k); e.g.position.y = -(1 - k) * .12; e.g.rotation.z += dt * 7;
      if (e.dying <= 0) { e.dispose(this.sc.scene); this.dying.splice(i, 1); }
    }
  }
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
      if (e.dead) { // reward, lightning charge, death burst, golem split
        this.gold += Math.round(e.c.reward * (1 + this.wave * .03) * Math.sqrt(this.level.hpMul) * (this.level.rewardMul ?? 1)); this.kills++; this.charge = Math.min(100, this.charge + e.c.reward * .6);
        this.fx.burst(e.g.position.clone().setY(.4), e.c.color, 16, 3.5, .1); this.audio.play('death');
        if (e.c.split) for (let k = 0; k < e.c.split.n; k++) this.spawnEnemy(e.c.split.type, e);
        this.kill(i); this.ui.refresh(); continue;
      }
      e.update(dt, this.sc.cam, this);
      if (e.reached) { // base hit: damage, shake, vignette
        this.hp -= e.c.dmg; this.sc.shake = .5; this.audio.play('base'); this.ui.vignette(); this.evt('vig');
        this.fx.burst(e.g.position, 0xff3355, 14); this.drop(i); this.ui.refresh();
      }
    }
    this.updHazard(dt);
    this.towers.forEach(w => w.update(dt, this.enemies, this));
    this.projectiles.forEach(p => p.update(dt, this));
    this.projectiles = this.projectiles.filter(p => !p.done);
    this.fx.update(dt); this.sweeper.update(dt, this); this.updWrecks(dt); this.updDying(dt);
    if (this.hp <= 0) { this.hp = 0; return this.finish(false); }
    if (this.state === 'wave' && !this.queue.length && !this.enemies.length) { // wave cleared
      this.gold += 20 + this.wave * 5; this.audio.play('clear');
      this.towers.forEach(w => { w.hp = Math.min(w.maxHp, w.hp + w.maxHp * WAVE_REPAIR); this.fx.burst(w.g.position.clone().setY(.6), 0x66ff99, 5, 1.5, .06); }); if (this.sweeper.repaired) this.sweeper.hp = Math.min(this.sweeper.maxHp, this.sweeper.hp + this.sweeper.maxHp * WAVE_REPAIR); // +30% HP
      if (this.wave >= this.level.waves) return this.finish(true);
      this.state = 'countdown'; this.timer = WAVE_GAP; this.ui.refresh();
    }
  }
  updHazard(dt) { // Thunder Valley: a random lightning strike every 7 seconds (yellow warning mark first); weaker than the spell
    if (this.level.hazard !== 'thunder') return;
    if ((this.hazT -= dt) <= 0) { this.hazT = 7; const pos = wp(Math.floor(Math.random() * 12), Math.floor(Math.random() * 12)); this.strikes.push({ pos, t: .9 }); this.fx.mark(pos, 0xffe14d, .85, .9); }
    for (let i = this.strikes.length - 1; i >= 0; i--) {
      const s = this.strikes[i]; if ((s.t -= dt) > 0) continue; this.strikes.splice(i, 1);
      this.fx.bolt(s.pos); this.fx.ring(s.pos, 0xfff3a0, .9); this.audio.play('bolt'); this.sc.shake = Math.max(this.sc.shake, .3); this.ui.flash(); this.evt('fl');
      this.areaDmg(s.pos, .85, 35 * Math.max(this.hpMul, 1), 'bolt');
      for (const w of this.targets().slice()) if (w.g.position.distanceTo(s.pos) <= .85) this.damageTower(w, 22, 'bolt');
    }
  }
  nova(tw) { // every 10 shots: fire tower = fire nova (burn), freezer = ice nova (slow)
    const p = tw.g.position, r = tw.range, L = tw.level, kind = tw.def.nova;
    this.fx.ring(p, kind === 'burn' ? 0xff6a1a : 0x8be9ff, r); this.audio.play('nova');
    for (const e of this.enemies) {
      if (e.dead || e.g.position.distanceTo(p) > r) continue;
      if (kind === 'burn') { e.addDot('burn', tw.dmg * .6 * elemMult('fire', e.c.elem), 3 + .5 * (L - 1)); this.fx.burst(e.g.position.clone().setY(.4), 0xff7722, 6, 2, .07); }
      else { e.applySlow(.2, 1 + .25 * (L - 1)); this.fx.burst(e.g.position.clone().setY(.4), 0x8be9ff, 6, 2, .07); }
    }
  }
  buySpell(k) { // shop: spend surplus gold on spells
    const c = SPELLS[k].cost; if (this.gold < c) return; this.gold -= c;
    if (k === 'charge') this.charge = Math.min(100, this.charge + 50); else this.spells[k]++;
    this.audio.play('sell'); this.ui.refresh();
  }
  repairSweeper() { if (this.sweeper.repaired || this.gold < this.sweeper.cost) return; this.gold -= this.sweeper.cost; this.sweeper.repair(); this.audio.play('upgrade'); this.fx.ring(this.sweeper.g.position, 0x66e0ff, 1.5); this.ui.refresh(); }
  cast(kind, x, y) { // bolt (reservoir) + meteor hit a path tile; freeze / repair are instant
    const pos = wp(x ?? 0, y ?? 0), mul = Math.max(this.hpMul, 1);
    if (kind === 'bolt') {
      if (this.charge < 100) return false; this.charge = 0; this.fx.bolt(pos); this.fx.ring(pos, 0xfff3a0, 1); this.audio.play('bolt'); this.sc.shake = .25;
      this.areaDmg(pos, 1.0, 90 * mul, 'bolt');
    } else if (kind === 'meteor') {
      if (this.spells.meteor < 1) return false; this.spells.meteor--; this.fx.ring(pos, 0xff6a1a, 1.5); this.fx.burst(pos.clone().setY(.4), 0xff6a1a, 30, 5, .15); this.audio.play('bolt'); this.sc.shake = .4;
      this.areaDmg(pos, 1.3, 95 * mul, 'fire', true); // meteor: weakened
    } else if (kind === 'freeze') {
      if (this.spells.freeze < 1) return false; this.spells.freeze--; this.audio.play('nova');
      for (const e of this.enemies) { e.applySlow(.25, 4); this.fx.burst(e.g.position.clone().setY(.4), 0x8be9ff, 6, 2, .07); }
    } else if (kind === 'repair') {
      if (this.spells.repair < 1) return false; this.spells.repair--; this.audio.play('upgrade');
      this.towers.forEach(w => { w.hp = w.maxHp; w.stun = 0; this.fx.burst(w.g.position.clone().setY(.6), 0x66ff99, 8, 2, .07); });
    }
    this.ui.refresh(); return true;
  }
  areaDmg(pos, r, dmg, elem, burn) {
    for (const e of this.enemies) {
      if (e.dead || Math.hypot(e.g.position.x - pos.x, e.g.position.z - pos.z) > r) continue;
      e.hit(dmg * elemMult(elem, e.c.elem)); if (burn) e.addDot('burn', dmg * .08, 4);
    }
  }
  enemyAttack(e, tower) { // enemy shoots a tower with its element
    const a = e.c.atk, from = e.g.position.clone(); from.y = e.c.size * 3;
    this.projectiles.push(new Shot(from, tower, ELEM_COLOR[a.elem], this.sc.scene, () => this.damageTower(tower, a.dmg, a.elem, a.stun)));
  }
  targets() { return this.sweeper.repaired ? this.towers.concat(this.sweeper) : this.towers; } // what enemies may attack
  explode(pos, color) { // big explosion: fireballs, shockwave, flying debris, shake
    const p = pos.clone().setY(.5);
    this.fx.ball(p, 0xffa030, 1.4); this.fx.ball(p, 0xff4400, .8); this.fx.ring(pos, 0xff8a2a, 1.8); this.fx.burst(p, 0xff8a2a, 24, 5.5, .14);
    this.fx.debris(p, color, 10); this.fx.debris(p, 0x333333, 8); this.sc.shake = Math.max(this.sc.shake, .4); this.audio.play('bolt');
  }
  dropRuin(g) { this.sc.scene.remove(g); g.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); }
  damageTower(tw, dmg, elem, stun) {
    if (tw.gone || tw.isRuined) return;
    tw.hp -= dmg * elemMult(elem, tw.def.elem); if (stun && !tw.isSweeper) tw.stun = stun;
    if (tw.hp > 0) return;
    if (tw.isSweeper) { this.explode(tw.g.position, 0x8b95a8); tw.ruin(); this.ui.refresh(); return; } // sweeper: back to ruins, can be repaired again
    // tower destroyed: half-collapsed charred wreck for 0.5s -> explosion -> broken remains
    tw.gone = true; tw.clearSoldiers?.(); this.towers.splice(this.towers.indexOf(tw), 1); tw.bar.visible = false; tw.muz.visible = false;
    tw.top.scale.y *= .5; tw.top.rotation.z = .22; tw.top.rotation.x = -.12;
    tw.top.traverse(o => { if (o.isMesh && o.material.emissive) { o.material = o.material.clone(); o.material.color.multiplyScalar(.3); o.material.emissive.setHex(0x331100); } });
    this.wrecks.push({ tw, t: .5, phase: 'half' }); this.fx.burst(tw.g.position.clone().setY(.5), 0x555555, 8, 2, .1); this.audio.play('death'); this.ui.refresh();
  }
  updWrecks(dt) {
    for (let i = this.wrecks.length - 1; i >= 0; i--) {
      const w = this.wrecks[i], p = w.tw.g.position; w.t -= dt;
      if (w.phase === 'half') {
        if (Math.random() < .6) this.fx.burst(p.clone().setY(.5), 0x444444, 1, .8, .09); // smoke
        if (w.t <= 0) { this.explode(p, w.tw.def.color); w.tw.dispose(); w.ruin = Tower.broken(w.tw.type, p, this.sc.scene); w.phase = 'ruin'; w.t = 3; this.evt('ruin', w.tw.x, w.tw.y, w.tw.type); }
      } else {
        if (Math.random() < .12) this.fx.burst(p.clone().setY(.4), 0x444444, 1, .6, .08);
        if (w.t < .5) w.ruin.scale.setScalar(Math.max(.01, w.t / .5)); // remains sink away
        if (w.t <= 0) { this.grid.occ.delete(w.tw.x + ',' + w.tw.y); this.dropRuin(w.ruin); this.wrecks.splice(i, 1); this.ui.refresh(); }
      }
    }
  }
  finish(win) { this.over = true; this.audio.play(win ? 'clear' : 'over'); this.ui.refresh(); this.ui.end(win); }
}
