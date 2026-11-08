// UIManager: HUD, two-step build panel (preview range -> confirm), settings menu, overlays.
import * as THREE from 'three';
import { TOWERS, ELEM, MAX_WAVE, START_HP, waveDef, SPELLS } from './config.js';
import { i18n, t } from './i18n.js';
import { wp } from './grid.js';
const ICON = { cannon: '💥', sniper: '🎯', freezer: '❄️', poison: '🧪' };
const $ = id => document.getElementById(id);
export class UIManager {
  constructor(game, audio, sc) {
    this.game = game; this.audio = audio; this.sc = sc; this.sel = null; this.acc = 0; this.armed = null; this.spkey = '';
    this.speed = +(localStorage.getItem('td_speed') || 1); this.q = localStorage.getItem('td_q') || 'high';
    this.ring = new THREE.Mesh(new THREE.RingGeometry(.97, 1, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: .85 }));
    this.ring.visible = false; this.ring.position.y = .05; sc.scene.add(this.ring);
  }
  init() {
    const g = this.game, a = this.audio, click = () => a.play('click');
    this.setTheme(localStorage.getItem('td_theme') || 'dark'); this.setQuality(this.q); i18n.apply(); $('vol').value = a.vol;
    const seg = (id, fn) => $(id).onclick = e => { const b = e.target.closest('button'); if (!b) return; a.unlock(); click(); fn(b.dataset.v); this.segs(); };
    seg('seg-lang', v => { i18n.set(v); this.refresh(); });
    seg('seg-theme', v => this.setTheme(v)); seg('seg-sound', v => a.setMuted(v === 'off'));
    seg('seg-q', v => this.setQuality(v)); seg('seg-speed', v => this.setSpeed(+v));
    $('vol').oninput = e => { a.unlock(); a.setVol(+e.target.value); };
    $('gear').onclick = () => { click(); this.openSettings(); };
    $('shopbtn').onclick = () => { click(); this.openShop(); };
    $('shopclose').onclick = () => { click(); $('shop').classList.add('hidden'); this.sync(); };
    $('shoplist').onclick = e => { const b = e.target.closest('button'); if (!b || b.disabled) return; click(); g.buySpell(b.dataset.k); this.renderShop(); };
    $('spells').onclick = e => { const b = e.target.closest('button'); if (!b) return; click(); this.useSpell(b.dataset.s); };
    $('resume').onclick = () => { click(); this.closeSettings(); };
    $('speed').onclick = () => { click(); this.setSpeed(this.speed % 3 + 1); this.segs(); };
    const again = () => { click(); $('over').classList.add('hidden'); $('settings').classList.add('hidden'); this.armed = null; this.select(null); g.reset(); this.sync(); };
    $('restart').onclick = again; $('restart2').onclick = again;
    $('howbtn').onclick = () => { click(); $('settings').classList.add('hidden'); $('howto').classList.remove('hidden'); this.sync(); };
    $('startbtn').onclick = () => { click(); $('howto').classList.add('hidden'); localStorage.setItem('td_seen', '1'); this.sync(); };
    if (localStorage.getItem('td_seen')) $('howto').classList.add('hidden');
    $('panel').onclick = e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return; click();
      const s = this.sel, A = b.dataset.a;
      if (A === 'close') this.select(null);
      else if (A === 'pick') { s.pick = b.dataset.k; this.refresh(); }      // step 1: preview range
      else if (A === 'cancel') { s.pick = null; this.refresh(); }
      else if (A === 'ok') { const tw = g.build(s.pick, s.x, s.y); if (tw) this.select(tw.isSweeper ? { sweeper: tw } : { tower: tw }); } // step 2: confirm
      else if (A === 'fix') g.repairSweeper();
      else if (A === 'up') g.upgrade(s.tower);
      else if (A === 'sell') { g.sell(s.tower); this.select(null); }
    };
    this.segs(); this.sync(); this.refresh();
  }
  sync() { // game is paused whenever a menu is open
    this.game.paused = ['settings', 'howto', 'shop'].some(id => !$(id).classList.contains('hidden'));
  }
  openSettings() { $('settings').classList.remove('hidden'); this.segs(); this.sync(); }
  closeSettings() { $('settings').classList.add('hidden'); this.sync(); }
  segs() { // highlight current value in each segmented control
    const cur = { 'seg-lang': i18n.lang, 'seg-theme': document.documentElement.dataset.theme, 'seg-sound': this.audio.muted ? 'off' : 'on', 'seg-q': this.q, 'seg-speed': String(this.speed) };
    for (const id in cur) $(id).querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === cur[id]));
    $('speed').textContent = `⏩ ${this.speed}×`;
  }
  setTheme(m) { document.documentElement.dataset.theme = m; localStorage.setItem('td_theme', m); this.sc.setTheme(m === 'dark'); }
  setQuality(v) { this.q = v; localStorage.setItem('td_q', v); this.sc.setQuality(v === 'high'); }
  setSpeed(v) { this.speed = v; localStorage.setItem('td_speed', v); }
  vignette() { const v = $('vig'); v.classList.add('on'); setTimeout(() => v.classList.remove('on'), 120); }
  toast(m) { const e = $('toast'); e.textContent = m; e.classList.add('show'); clearTimeout(this.tt); this.tt = setTimeout(() => e.classList.remove('show'), 4000); }
  pickTile(u) { // called from canvas click
    const g = this.game;
    if (this.armed) { // aiming a spell at the enemy path
      if (u && g.grid.pathSet.has(u.x + ',' + u.y)) { const k = this.armed; this.armed = null; g.cast(k, u.x, u.y); this.spells(true); }
      else this.toast(t('onPath'));
      return;
    }
    if (!u) return this.select(null);
    const tw = g.grid.occ.get(u.x + ',' + u.y);
    if (tw) this.select({ tower: tw }); else if (g.grid.isBuildable(u.x, u.y)) this.select({ x: u.x, y: u.y, pick: null }); else this.select(null);
  }
  select(s) {
    this.sel = s; const gr = this.game.grid;
    s ? (s.tower ? gr.highlight(s.tower.x, s.tower.y) : gr.highlight(s.x, s.y)) : gr.highlight(null);
    this.refresh();
  }
  tick(dt) { this.acc += dt; if (this.acc > .2) { this.acc = 0; this.hud(); } }
  hud() {
    const g = this.game;
    $('hpfill').style.width = g.hp / START_HP * 100 + '%'; $('hptxt').textContent = g.hp;
    $('gold').textContent = g.gold.toLocaleString('en'); $('towers').textContent = `${g.towers.length}/${g.cap}`;
    $('wavetxt').textContent = `${t('wave')} ${g.wave}/${MAX_WAVE}`; $('wavefill').style.width = g.waveProgress() * 100 + '%';
    const nw = g.state === 'countdown' ? g.wave + 1 : g.wave, bonus = Math.round((waveDef(nw).hp - 1) * 100);
    $('status').textContent = (g.state === 'countdown' ? `${t('nextin')} ${Math.ceil(g.timer)} ${t('s')}` : t('inwave')) + ` · ${t('enemyHp')} +${bonus}%`;
    $('next').textContent = '⏩ ' + t('next'); $('next').disabled = g.state !== 'countdown' || g.over;
    this.spells();
  }
  refresh() { this.hud(); this.panel(); }
  panel() {
    const p = $('panel'), s = this.sel, g = this.game;
    if (s && s.tower && !g.towers.includes(s.tower)) this.sel = null; // destroyed or sold
    if (!this.sel) { p.style.display = 'none'; this.ring.visible = false; return; }
    p.style.display = 'block'; let h = '<button class="x" data-a="close">✕</button>';
    if (s.sweeper) {
      const w = s.sweeper;
      h += `<h3>🌀 ${t('sweeper')}${w.repaired ? '' : ' · ' + t('ruined')}</h3><p class="st">${t('sweeperDesc')}</p>` + (w.repaired ? '' : `<div class="row"><button class="ok" data-a="fix" ${g.gold < w.cost ? 'disabled' : ''}>🔧 ${t('repair')} 💰${w.cost}</button></div>`);
      this.ring.visible = true; this.ring.position.set(w.g.position.x, .05, w.g.position.z); this.ring.scale.setScalar(w.range);
    } else if (s.tower) {
      const w = s.tower, uc = w.upgradeCost(g.wave);
      h += `<h3>${ICON[w.type]} ${t(w.type)} ${ELEM[w.def.elem]} · ${t('level')} ${w.level}</h3>
        <p class="st">${t('dmg')} ${Math.round(w.dmg)} · ${t('range')} ${w.range.toFixed(1)} · ${t('rate')} ${w.rate.toFixed(1)} · ${t('hpT')} ${Math.ceil(w.hp)}/${Math.round(w.maxHp)}${w.def.nova ? '<br>✨ ' + t('nova_' + w.def.nova) : ''}${w.multi > 1 ? '<br>🎯 ' + w.multi + ' ' + t('targets') : ''}</p>
        <div class="row"><button data-a="up" ${uc == null || g.gold < uc ? 'disabled' : ''}>⬆ ${uc == null ? t('max') : t('upgrade') + ' 💰' + uc}</button>
        <button data-a="sell">💰 ${t('sell')} +${w.sellValue()}</button></div>`;
      this.ring.visible = true; this.ring.position.set(w.g.position.x, .05, w.g.position.z); this.ring.scale.setScalar(w.range);
    } else {
      h += `<h3>${t('build')}</h3><div class="row">` + Object.keys(TOWERS).map(k => { const d = TOWERS[k];
        return `<button data-a="pick" data-k="${k}" class="${s.pick === k ? 'sel' : ''}"><b>${ICON[k]} ${t(k)} ${ELEM[d.elem]}</b><small>💰${d.cost} · ${t('dmg')} ${d.dmg}</small></button>`; }).join('') + '</div>';
      if (s.pick) { // preview: show range ring, then ask for confirmation
        const d = TOWERS[s.pick], full = g.towers.length >= g.cap;
        h += `<p class="st">${t(s.pick)} ${ELEM[d.elem]} ${t('el_' + d.elem)} · ${t('range')} ${d.range} · ${t('rate')} ${d.rate} · ${t('hpT')} ${d.hp}${full ? ' · ⚠️ ' + t('capFull') : ''}</p>
          <div class="row"><button class="ok" data-a="ok" ${g.gold < d.cost || full ? 'disabled' : ''}>✔ ${t('confirm')} 💰${d.cost}</button><button data-a="cancel">${t('cancel')}</button></div>`;
        const pos = wp(s.x, s.y); this.ring.visible = true; this.ring.position.set(pos.x, .05, pos.z); this.ring.scale.setScalar(d.range);
      } else this.ring.visible = false;
    }
    p.innerHTML = h;
  }
  spells(force) { // spell bar: lightning reservoir + owned spells (rebuilt only when changed)
    const g = this.game, key = [Math.floor(g.charge), g.spells.freeze, g.spells.meteor, g.spells.repair, this.armed].join();
    if (!force && key === this.spkey) return; this.spkey = key;
    const mk = (id, ic, sub, cls) => `<button data-s="${id}" class="${cls}">${ic}<small>${sub}</small></button>`;
    let h = mk('bolt', '⚡', Math.floor(g.charge) + '%', (g.charge >= 100 ? 'ready ' : '') + (this.armed === 'bolt' ? 'sel' : ''));
    for (const k of ['freeze', 'meteor', 'repair']) if (g.spells[k] > 0) h += mk(k, SPELLS[k].icon, '×' + g.spells[k], this.armed === k ? 'sel' : '');
    $('spells').innerHTML = h;
  }
  useSpell(k) {
    const g = this.game;
    if (k === 'bolt' || k === 'meteor') { // tile-targeted spells
      if (k === 'bolt' && g.charge < 100) return this.toast(t('notReady'));
      this.armed = this.armed === k ? null : k; if (this.armed) { this.select(null); this.toast(t('aim')); }
    } else g.cast(k);
    this.spells(true);
  }
  openShop() { this.renderShop(); $('shop').classList.remove('hidden'); this.sync(); }
  renderShop() {
    const g = this.game; $('shopgold').textContent = g.gold;
    $('shoplist').innerHTML = Object.keys(SPELLS).map(k => `<div class="opt"><span>${SPELLS[k].icon} <b>${t('sp_' + k)}</b><br><small>${t('d_' + k)}</small></span><button data-k="${k}" ${g.gold < SPELLS[k].cost ? 'disabled' : ''}>💰${SPELLS[k].cost}</button></div>`).join('');
    this.spells(true);
  }
  end(win) {
    $('overtitle').textContent = t(win ? 'win' : 'over'); $('overtxt').textContent = `${t('reached')} ${this.game.wave}`;
    $('over').classList.remove('hidden');
  }
}