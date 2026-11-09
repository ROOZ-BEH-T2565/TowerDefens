// Progress saved in localStorage: completed stages (stars), best waves, seen intros, stats. All game keys start with "td_".
import { START_TOWERS, INTRO_TOWER, INTRO_SPELL } from "./config.js";
const KEY = "td_save",
  blank = () => ({
    done: {},
    best: {},
    seen: {},
    stats: { games: 0, wins: 0, kills: 0 },
  });
export const Save = {
  data: blank(),
  load() {
    try {
      this.data = {
        ...blank(),
        ...JSON.parse(localStorage.getItem(KEY) || "{}"),
      };
    } catch (e) {
      this.data = blank();
    }
    return this.data;
  },
  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch (e) {
      /* storage full / blocked */
    }
  },
  reset() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("td_"))
      .forEach((k) => localStorage.removeItem(k));
    this.data = blank();
  }, // forget everything
  levelOpen(i) {
    return i === 0 || !!this.data.done[i - 1];
  },
  towers() {
    const s = new Set(START_TOWERS);
    for (const i in INTRO_TOWER) if (this.levelOpen(+i)) s.add(INTRO_TOWER[i]);
    return s;
  }, // a tower is introduced when its stage opens
  spells() {
    const s = new Set(["repair"]);
    for (const i in INTRO_SPELL) if (this.levelOpen(+i)) s.add(INTRO_SPELL[i]);
    return s;
  },
  record(i, win, wave, hpRatio, kills) {
    // returns stars earned (0 if lost)
    const d = this.data;
    d.stats.games++;
    d.stats.kills += kills;
    const stars = win ? (hpRatio >= 0.8 ? 3 : hpRatio >= 0.5 ? 2 : 1) : 0;
    if (win) {
      d.stats.wins++;
      d.done[i] = Math.max(d.done[i] || 0, stars);
    }
    if (wave > (d.best[i] || 0)) d.best[i] = wave;
    this.save();
    return stars;
  },
};
Save.load();
