// UIManager: HUD, build/upgrade panel, toggles, overlays.
import * as THREE from 'three';
import { TOWERS, START_HP, MAX_WAVE } from './config.js';
import { i18n, t } from './i18n.js';
const ICON = { cannon: '💥', sniper: '🎯', freezer: '❄️' };
const $ = id => document.getElementById(id);
export class UIManager {
  constructor(game, audio, sc) {
    this.game = game; this.audio = audio; this.sc = sc; this.sel = null; this.acc = 0;
    this.ring = new THREE.Mesh(new THREE.RingGeometry(.97, 1, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: .8 }));
    this.ring.visible = false; this.ring.position.y = .05; sc.scene.add(this.ring);
  }
  init() {
    const g = this.game, a = this.audio, click = () => a.play('click');
    this.setTheme(localStorage.getItem('td_theme') || 'dark'); i18n.apply();
    $('vol').value = a.vol; this.soundIcon();
    $('lang').onclick = () => { click(); i18n.set(i18n.lang === 'fa' ? 'en' : 'fa'); this.refresh(); };
    $('theme').onclick = () => { click(); this.setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); };
    $('sound').onclick = () => { a.unlock(); a.setMuted(!a.muted); this.soundIcon(); click(); };
    $('vol').oninput = e => { a.unlock(); a.setVol(+e.target.value); };
    $('pause').onclick = () => { click(); g.paused = !g.paused; $('pause').textContent = g.paused ? '▶' : '⏸'; };
    $('next').onclick = () => { click(); g.startWave(true); };
    $('restart').onclick = () => { click(); $('over').classList.add('hidden'); this.select(null); g.reset(); };
    $('startbtn').onclick = () => { click(); $('howto').classList.add('hidden'); localStorage.setItem('td_seen', '1'); };
    if (localStorage.getItem('td_seen')) $('howto').classList.add('hidden');
    $('panel').onclick = e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return; click();
      const s = this.sel;
      if (b.dataset.a === 'close') this.select(null);
      else if (b.dataset.a === 'up') g.upgrade(s.tower);
      else if (b.dataset.a === 'sell') { g.sell(s.tower); this.select(null); }
      else if (b.dataset.a === 'b') { const tw = g.build(b.dataset.k, s.x, s.y); if (tw) this.select({ tower: tw }); }
    };
    this.refresh();
  }
  setTheme(m) { document.documentElement.dataset.theme = m; localStorage.setItem('td_theme', m); $('theme').textContent = m === 'dark' ? '🌙' : '☀️'; this.sc.setTheme(m === 'dark'); }
  soundIcon() { $('sound').textContent = this.audio.muted ? '🔇' : '🔊'; }
  vignette() { const v = $('vig'); v.classList.add('on'); setTimeout(() => v.classList.remove('on'), 120); }
  pickTile(u) { // called from canvas click
    const g = this.game; if (!u) return this.select(null);
    const tw = g.grid.occ.get(u.x + ',' + u.y);
    if (tw) this.select({ tower: tw }); else if (g.grid.isBuildable(u.x, u.y)) this.select({ x: u.x, y: u.y }); else this.select(null);
  }
  select(s) {
    this.sel = s; const g = this.game.grid;
    s ? (s.tower ? g.highlight(s.tower.x, s.tower.y) : g.highlight(s.x, s.y)) : g.highlight(null);
    this.refresh();
  }
  tick(dt) { this.acc += dt; if (this.acc > .2) { this.acc = 0; this.hud(); } }
  hud() {
    const g = this.game;
    $('hpfill').style.width = g.hp / START_HP * 100 + '%'; $('hptxt').textContent = g.hp;
    $('gold').textContent = g.gold.toLocaleString('en');
    $('wavetxt').textContent = `${t('wave')} ${g.wave}/${MAX_WAVE}`;
    $('wavefill').style.width = g.waveProgress() * 100 + '%';
    $('status').textContent = g.state === 'countdown' ? `${t('nextin')} ${Math.ceil(g.timer)} ${t('s')}` : t('inwave');
    $('next').textContent = '⏩ ' + t('next'); $('next').disabled = g.state !== 'countdown' || g.over;
  }
  refresh() { this.hud(); this.panel(); }
  panel() {
    const p = $('panel'), s = this.sel, g = this.game;
    if (s && s.tower && !g.towers.includes(s.tower)) this.sel = null;
    if (!this.sel) { p.style.display = 'none'; this.ring.visible = false; return; }
    p.style.display = 'block'; let h = '<button class="x" data-a="close">✕</button>';
    if (s.tower) {
      const w = s.tower, uc = w.upgradeCost();
      h += `<h3>${ICON[w.type]} ${t(w.type)} · ${t('level')} ${w.level}</h3><p class="st">${t('dmg')} ${Math.round(w.dmg)} · ${t('range')} ${w.range.toFixed(1)} · ${t('rate')} ${w.rate.toFixed(1)}</p>
        <div class="row"><button data-a="up" ${uc == null || g.gold < uc ? 'disabled' : ''}>⬆ ${uc == null ? t('max') : t('upgrade') + ' 💰' + uc}</button>
        <button data-a="sell">💰 ${t('sell')} +${w.sellValue()}</button></div>`;
      this.ring.visible = true; this.ring.position.x = w.g.position.x; this.ring.position.z = w.g.position.z; this.ring.scale.setScalar(w.range);
    } else {
      this.ring.visible = false;
      h += `<h3>${t('build')}</h3><div class="row">` + Object.keys(TOWERS).map(k => { const d = TOWERS[k];
        return `<button data-a="b" data-k="${k}" ${g.gold < d.cost ? 'disabled' : ''}><b>${ICON[k]} ${t(k)}</b><small>💰${d.cost} · ${t('dmg')} ${d.dmg} · ${t('range')} ${d.range}</small></button>`; }).join('') + '</div>';
    }
    p.innerHTML = h;
  }
  end(win) {
    $('overtitle').textContent = t(win ? 'win' : 'over'); $('overtxt').textContent = `${t('reached')} ${this.game.wave}`;
    $('over').classList.remove('hidden');
  }
}
