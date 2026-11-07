// Game configuration: grid, path, enemies, towers, waves, sounds. Edit here to extend.
export const GRID = 12;
export const PATH = [[0,2],[3,2],[3,5],[8,5],[8,2],[10,2],[10,9],[5,9],[5,7],[1,7],[1,10],[11,10]];
export const START_GOLD = 130, START_HP = 20, MAX_WAVE = 20, FIRST_COUNTDOWN = 15, WAVE_GAP = 10;

export const ENEMIES = {
  grunt:  { hp: 40,  speed: 1.0, reward: 5,  color: 0x7bd34a, size: .2,  dmg: 1 },
  runner: { hp: 25,  speed: 2.0, reward: 4,  color: 0xffb020, size: .15, dmg: 1 },
  tank:   { hp: 220, speed: .6,  reward: 18, color: 0xc0392b, size: .3,  dmg: 3 },
};
export const TOWERS = {
  cannon:  { cost: 50, range: 2.6, dmg: 14, rate: 1.2,  color: 0x3b82f6, proj: 0xffd166, speed: 12 },
  sniper:  { cost: 90, range: 5.2, dmg: 60, rate: .45,  color: 0xa855f7, proj: 0xff5577, speed: 28 },
  freezer: { cost: 35, range: 2.0, dmg: 3,  rate: 1.5,  color: 0x22d3ee, proj: 0x9be7ff, speed: 10, slow: .4, slowT: 1.6 },
};
// Wave generator: groups of {t:type, c:count, i:spawn interval, d:delay}, plus an HP multiplier.
export function waveDef(n) {
  const hp = 1 + n * .18 + n * n * .012;
  const g = [{ t: 'grunt', c: 5 + n * 2, i: Math.max(.35, .9 - n * .03), d: 0 }];
  if (n >= 2) g.push({ t: 'runner', c: 2 + n, i: .5, d: 3 });
  if ((n >= 4 && n % 2 === 0) || n >= 6) g.push({ t: 'tank', c: Math.floor(n / 3), i: 1.6, d: 5 });
  return { hp, g };
}
// Sound recipes: [startHz, endHz, seconds, wave, volume, delay] or ['n', seconds, volume, filterHz, delay] for noise.
export const SOUNDS = {
  build:   [[260,90,.12,'triangle',.4]],
  shoot: {
    cannon:  [[140,45,.18,'sawtooth',.3],['n',.12,.2,400]],
    sniper:  [[1800,300,.12,'square',.2],['n',.08,.25,3000]],
    freezer: [[1400,2200,.25,'sine',.12],[1800,2600,.25,'sine',.1,.05]],
  },
  hit:     [[900,700,.04,'square',.06]],
  death:   [[300,60,.18,'sawtooth',.25],['n',.15,.2,800]],
  base:    [[90,40,.3,'sine',.5],[880,880,.1,'square',.2,.1],[880,880,.1,'square',.2,.25]],
  wave:    [[400,400,.1,'square',.2],[500,500,.1,'square',.2,.1],[660,660,.25,'square',.2,.2]],
  clear:   [[880,880,.3,'sine',.25],[1320,1320,.5,'sine',.2,.12]],
  upgrade: [[400,1200,.3,'triangle',.3]],
  sell:    [[1800,1800,.08,'sine',.2],[2400,2400,.12,'sine',.2,.07]],
  over:    [[400,100,1.2,'sawtooth',.3]],
  click:   [[600,500,.04,'sine',.15]],
};
