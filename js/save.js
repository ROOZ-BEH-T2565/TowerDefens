// Progress saved in localStorage: completed levels (stars), best waves, stats. All game keys start with "td_".
import { LEVELS, START_TOWERS } from './config.js';
const KEY = 'td_save', blank = () => ({ done: {}, best: {}, stats: { games: 0, wins: 0, kills: 0 } });
export const Save = {
  data: blank(),
  load() { try { this.data = { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { this.data = blank(); } return this.data; },
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* storage full / blocked */ } },
  reset() { Object.keys(localStorage).filter(k => k.startsWith('td_')).forEach(k => localStorage.removeItem(k)); this.data = blank(); }, // forget everything
  levelOpen(i) { return i === 0 || !!this.data.done[i - 1]; },
  towers() { const s = new Set(START_TOWERS); LEVELS.forEach((L, i) => { if (this.data.done[i] && L.unlock) s.add(L.unlock); }); return s; },
  record(i, win, wave, hpRatio, kills) { // returns stars earned (0 if lost)
    const d = this.data; d.stats.games++; d.stats.kills += kills;
    const stars = win ? (hpRatio >= .8 ? 3 : hpRatio >= .5 ? 2 : 1) : 0;
    if (win) { d.stats.wins++; d.done[i] = Math.max(d.done[i] || 0, stars); }
    if (wave > (d.best[i] || 0)) d.best[i] = wave;
    this.save(); return stars;
  },
};
Save.load();
