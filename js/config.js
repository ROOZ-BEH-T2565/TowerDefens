// Game configuration: grid, levels (maps, enemies, unlocks), enemies, towers, elements, waves, spells, sounds.
export const GRID = 12;
export const START_HP = 20, FIRST_COUNTDOWN = 15, WAVE_GAP = 10;
export const STEP = 5;                // every 5 waves: +1 tower slot, pricier upgrades
export const TOWER_CAP_BASE = 7;      // max towers at the start of a level
export const HP_GROWTH = .09;         // enemy HP grows +9% (compounding) each wave
export const UPGRADE_INFLATION = .25; // upgrade price +25% every STEP waves
export const WAVE_REPAIR = .3;        // towers recover 30% HP after each wave
export const DECK_SIZE = 4;           // towers chosen before a level
export const MAX_LEVEL = 6, UP_MULT = [.8, 1.2, 1.6, 2.1, 2.7];
export const START_TOWERS = ['cannon', 'sniper', 'freezer']; // others are unlocked by finishing levels
export const SPELLS = { charge: { cost: 80, icon: '🔋' }, freeze: { cost: 100, icon: '🌨️' }, meteor: { cost: 150, icon: '☄️' }, repair: { cost: 60, icon: '🔧' } };

// Elements. ELEM_TABLE[attacker][defender] = damage multiplier.
export const ELEM = { fire: '🔥', ice: '❄️', bolt: '⚡', nature: '🌿', stone: '🪨', poison: '🧪' };
export const ELEM_COLOR = { fire: 0xff6a1a, ice: 0x8be9ff, bolt: 0xffe14d, poison: 0x88ff44 };
const ELEM_TABLE = {
  fire:   { nature: 1.5, ice: 1.5, stone: .8, fire: .4, bolt: 1 },
  ice:    { fire: 1.6, nature: .9, stone: 1, ice: .4, bolt: 1 },
  bolt:   { stone: 1.5, ice: 1.25, fire: 1, nature: .8, bolt: .5 },
  poison: { nature: .6, fire: 1.2, ice: 1.3, stone: 1, bolt: 1, poison: .4 },
  stone:  { nature: 1.3, ice: 1.4, fire: 1, bolt: 1, poison: 1, stone: .7 },
};
export const elemMult = (a, d) => ELEM_TABLE[a]?.[d] ?? 1;

// Enemies. Abilities: heal, atk (shoots nearest tower; stun freezes it), aura (damage-reduction bubble),
// dash (speed burst), split (spawns minis on death), summon, blink (teleports forward). resist = wind/stun resistance.
export const ENEMIES = {
  grunt:    { icon: '👺', hp: 46,  speed: 1.05, reward: 5,  color: 0x6fbf3a, size: .2,  dmg: 1, elem: 'nature' },
  runner:   { icon: '👿', hp: 28,  speed: 2.0,  reward: 4,  color: 0xe8531f, size: .16, dmg: 1, elem: 'fire' },
  tank:     { icon: '👹', hp: 255, speed: .65,  reward: 18, color: 0x8a5a3c, size: .3,  dmg: 3, elem: 'stone',  resist: .4 },
  warlock:  { icon: '🧙', hp: 120, speed: .85,  reward: 16, color: 0xb02a2a, size: .22, dmg: 2, elem: 'fire',   atk: { r: 2.9, dmg: 35, every: 2.6, elem: 'fire' } },
  charger:  { icon: '🐗', hp: 105, speed: 1.0,  reward: 12, color: 0xc47a2c, size: .21, dmg: 2, elem: 'nature', dash: { every: 6, dur: 1.4, mul: 2.5 } },
  shaman:   { icon: '🪄', hp: 78,  speed: .95,  reward: 12, color: 0x2fa36b, size: .2,  dmg: 2, elem: 'nature', heal: { r: 2, pct: .2, every: 2 } },
  guardian: { icon: '🛡️', hp: 185, speed: .85,  reward: 14, color: 0x7d8aa0, size: .22, dmg: 2, elem: 'stone',  resist: .7, aura: { r: 1.6, every: 6, dur: 3 } },
  wraith:   { icon: '👻', hp: 150, speed: 1.05, reward: 20, color: 0x6fd3ff, size: .22, dmg: 2, elem: 'ice',    atk: { r: 2.8, dmg: 22, every: 3.5, elem: 'ice', stun: 2.5 } },
  golem:    { icon: '🗿', hp: 460, speed: .5,   reward: 30, color: 0x7b7f87, size: .34, dmg: 4, elem: 'stone',  resist: .3, split: { type: 'pebble', n: 3 } },
  necro:    { icon: '💀', hp: 175, speed: .75,  reward: 26, color: 0x4a2a6a, size: .22, dmg: 2, elem: 'poison', summon: { type: 'skeleton', n: 2, every: 7 } },
  assassin: { icon: '🥷', hp: 130, speed: 1.3,  reward: 22, color: 0x2a2438, size: .2,  dmg: 3, elem: 'bolt',   blink: { every: 6, dist: 2.4 } },
  dragon:   { icon: '🐉', hp: 1000, speed: .58, reward: 90, color: 0xff5a1f, size: .4,  dmg: 8, elem: 'fire',   resist: .25, atk: { r: 3.4, dmg: 55, every: 2.4, elem: 'fire' } },
  skeleton: { icon: '☠️', hp: 26,  speed: 1.5,  reward: 1,  color: 0xe8e4d4, size: .13, dmg: 1, elem: 'stone',  mini: true },
  pebble:   { icon: '🪨', hp: 78,  speed: .95,  reward: 3,  color: 0x8a8f98, size: .18, dmg: 1, elem: 'stone',  mini: true },
};
// Towers. nova = every 10 shots area effect (from level 3); ignite/dot/chain/splash/stun are projectile effects.
export const TOWERS = {
  cannon:  { cost: 50,  range: 2.6, dmg: 14, rate: 1.5,  hp: 170, elem: 'stone',  color: 0x3b82f6, proj: 0xffd166, speed: 12 },
  sniper:  { cost: 90,  range: 5.2, dmg: 60, rate: .45,  hp: 120, elem: 'bolt',   color: 0xa855f7, proj: 0xffe14d, speed: 28 },
  freezer: { cost: 35,  range: 2.0, dmg: 3,  rate: 1.5,  hp: 120, elem: 'ice',    color: 0x22d3ee, proj: 0x9be7ff, speed: 10, slow: .4, slowT: 1.6, nova: 'freeze' },
  poison:  { cost: 70,  range: 2.4, dmg: 4,  rate: 1.1,  hp: 120, elem: 'poison', color: 0x66dd33, proj: 0x88ff44, speed: 11, dot: 6, dotT: 4 },
  fire:    { cost: 65,  range: 2.2, dmg: 7,  rate: 2,    hp: 130, elem: 'fire',   color: 0xff5522, proj: 0xff8833, speed: 11, ignite: 3, nova: 'burn' },
  tesla:   { cost: 85,  range: 2.5, dmg: 16, rate: 1,    hp: 120, elem: 'bolt',   color: 0x4aa8ff, proj: 0xbfe4ff, speed: 30, chain: 2, stun: 1 },
  mortar:  { cost: 100, range: 4.4, dmg: 26, rate: .5,   hp: 140, elem: 'stone',  color: 0x9a7b4f, proj: 0xd9b27a, speed: 7,  splash: 1.1 },
};
export const towerStats = (d, L) => ({ dmg: d.dmg * Math.pow(1.4, L - 1), range: d.range * (1 + .1 * (L - 1)), rate: d.rate * (1 + .12 * (L - 1)), hp: d.hp * (1 + .3 * (L - 1)) });

// ---- Levels: each has its own map (path), theme, enemy roster (type -> first wave), tower unlock reward, optional Air Sweeper spot.
const th = (tile, path, ground, foliage, rock) => ({ tile, path, ground, foliage, rock });
const R0 = [0x7a7d85, 0x6a6d75, 0x8a8c92];
export const LEVELS = [
  { name: { fa: 'دشت سبز', en: 'Green Valley' }, waves: 8, hpMul: 1, gold: 130, unlock: 'fire', sweeper: null,
    theme: th([0x3f6b46, 0x477550], 0xd4a24c, [0x15301f, 0x9fd08a], [0x2f7a3a, 0x3a8a3f, 0x2a6a35, 0x4a9a45], R0),
    path: [[0,2],[8,2],[8,6],[3,6],[3,10],[11,10]], enemies: { grunt: 1, runner: 3, tank: 6 } },
  { name: { fa: 'مرتع', en: 'Meadow' }, waves: 10, hpMul: 1.1, gold: 140, unlock: null, sweeper: null,
    theme: th([0x4a7a3a, 0x52853f], 0xc9a15a, [0x1a3418, 0xa8d98a], [0x3a8a2f, 0x55a03a, 0x2f7a30], R0),
    path: [[0,9],[4,9],[4,3],[8,3],[8,9],[11,9]], enemies: { grunt: 1, runner: 2, tank: 5, warlock: 4 } },
  { name: { fa: 'صحرای سوزان', en: 'Scorched Desert' }, waves: 10, hpMul: 1.22, gold: 150, unlock: 'poison', sweeper: null,
    theme: th([0xc9a96b, 0xd2b377], 0x8a6a3a, [0x3a2e1a, 0xe6cf94], [0x6b8e3a, 0x7a9a45, 0x5a7a30], [0xb89a6a, 0xa88a5a, 0xc8aa7a]),
    path: [[0,1],[10,1],[10,4],[1,4],[1,7],[10,7],[10,10],[11,10]], enemies: { grunt: 1, runner: 2, tank: 4, warlock: 3, charger: 5, shaman: 6 } },
  { name: { fa: 'جنگل پاییزی', en: 'Autumn Forest' }, waves: 12, hpMul: 1.35, gold: 160, unlock: null, sweeper: null,
    theme: th([0x6a5a2e, 0x75642f], 0xc08a4a, [0x2a2010, 0xcfae6a], [0xc0662a, 0xd08a2a, 0xa8452a, 0xe0a030], R0),
    path: [[5,0],[5,3],[1,3],[1,8],[6,8],[6,5],[10,5],[10,11]], enemies: { grunt: 1, runner: 2, tank: 4, warlock: 3, charger: 4, shaman: 5, guardian: 7 } },
  { name: { fa: 'کوهستان برفی', en: 'Snowy Peaks' }, waves: 12, hpMul: 1.5, gold: 170, unlock: 'tesla', sweeper: [5, 3],
    theme: th([0xcfe3f2, 0xdcecf7], 0x8aa6bf, [0x2a3a4c, 0xeaf3fb], [0xe8f2f8, 0xcfe3f2, 0xdbe9f3], [0x9aa8b8, 0x8a98a8]),
    path: [[0,6],[3,6],[3,2],[7,2],[7,8],[10,8],[10,3],[11,3]], enemies: { grunt: 1, runner: 2, tank: 3, warlock: 3, shaman: 4, charger: 5, guardian: 6, wraith: 7 } },
  { name: { fa: 'باتلاق', en: 'Swamp' }, waves: 14, hpMul: 1.65, gold: 180, unlock: null, sweeper: [5, 3],
    theme: th([0x3b5b3a, 0x44663f], 0x6b5a3a, [0x16241a, 0x6f9a6a], [0x4a6a2a, 0x5a7a30, 0x3a5a28], [0x5a6a5a, 0x4a5a4a]),
    path: [[11,1],[2,1],[2,5],[9,5],[9,9],[3,9],[3,11]], enemies: { grunt: 1, runner: 2, tank: 3, warlock: 3, charger: 4, shaman: 4, guardian: 5, wraith: 7, golem: 9 } },
  { name: { fa: 'خرابه‌های باستانی', en: 'Ancient Ruins' }, waves: 14, hpMul: 1.85, gold: 190, unlock: 'mortar', sweeper: [4, 5],
    theme: th([0x5a5f6a, 0x636976], 0x8b8478, [0x1a1c22, 0xa7adb8], [0x4a5a4a, 0x5a6a50], [0x8a8d95, 0x7a7d85, 0x9a9da5]),
    path: [[0,10],[0,7],[5,7],[5,10],[8,10],[8,4],[2,4],[2,1],[11,1]], enemies: { grunt: 1, runner: 2, tank: 3, warlock: 3, charger: 4, shaman: 4, guardian: 5, wraith: 6, golem: 8, necro: 10 } },
  { name: { fa: 'غار بلورین', en: 'Crystal Cavern' }, waves: 16, hpMul: 2.05, gold: 200, unlock: null, sweeper: [7, 6],
    theme: th([0x4a3a6a, 0x544378], 0x9a86c8, [0x151026, 0xb7a8e0], [0x7a4aaa, 0xaa5acc, 0x5a8acc], [0x6a5a9a, 0x7a6aaa]),
    path: [[6,0],[6,2],[1,2],[1,6],[4,6],[4,4],[9,4],[9,9],[2,9],[2,11]], enemies: { grunt: 1, runner: 2, tank: 3, warlock: 3, charger: 4, shaman: 4, guardian: 5, wraith: 6, golem: 7, necro: 9, assassin: 11 } },
  { name: { fa: 'دشت گدازه', en: 'Lava Fields' }, waves: 18, hpMul: 2.3, gold: 210, unlock: null, sweeper: [6, 4],
    theme: th([0x4a3028, 0x543730], 0xb0583a, [0x1c0f0c, 0xd9a28a], [0x6a2a1a, 0x8a3a1a, 0x4a3a1a], [0x3a2a2a, 0x4a3030]),
    path: [[0,5],[2,5],[2,1],[5,1],[5,6],[3,6],[3,9],[8,9],[8,3],[11,3]], enemies: { grunt: 1, runner: 2, tank: 3, warlock: 3, charger: 4, shaman: 4, guardian: 5, wraith: 6, golem: 7, necro: 8, assassin: 9 } },
  { name: { fa: 'دهانهٔ آتشفشان', en: 'Volcano Crater' }, waves: 20, hpMul: 2.6, gold: 220, unlock: null, sweeper: [5, 4],
    theme: th([0x3a2a2a, 0x453232], 0x9a3a2a, [0x120808, 0xc98a7a], [0x3a2a2a, 0x5a2a1a, 0x4a2020], [0x2a2020, 0x3a2a2a]),
    path: [[0,0],[10,0],[10,3],[1,3],[1,6],[10,6],[10,9],[1,9],[1,11],[11,11]], enemies: { grunt: 1, runner: 2, tank: 3, warlock: 3, charger: 4, shaman: 4, guardian: 5, wraith: 6, golem: 7, necro: 8, assassin: 9, dragon: 12 } },
];
// first level in which each enemy type appears (for the guide)
export const ENEMY_LEVEL = {};
LEVELS.forEach((L, i) => { for (const k in L.enemies) if (!ENEMY_LEVEL[k]) ENEMY_LEVEL[k] = i + 1; });
// all tiles of a path (straight axis-aligned segments)
export function pathTiles(path) {
  const s = new Set();
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, ay] = path[i], [bx, by] = path[i + 1], dx = Math.sign(bx - ax), dy = Math.sign(by - ay);
    let x = ax, y = ay;
    for (;;) { s.add(x + ',' + y); if (x === bx && y === by) break; x += dx; y += dy; }
  }
  return s;
}
// Fixed build plots: tiles next to the path, spaced so no two plots touch (the only places towers may be built).
export function plotsFor(L) {
  if (L._plots) return L._plots;
  const P = pathTiles(L.path), out = [], ex = L.sweeper ? L.sweeper.join(',') : '';
  for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
    const k = x + ',' + y; if (P.has(k) || k === ex) continue;
    let near = false; for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if (P.has((x + dx) + ',' + (y + dy))) near = true;
    if (!near || out.some(([a, b]) => Math.max(Math.abs(a - x), Math.abs(b - y)) < 2)) continue;
    out.push([x, y]);
  }
  return (L._plots = out);
}
// Wave generator for a level. Enemies only appear from the wave given in the level's roster.
const SPAWN = { grunt: { c: 5, k: 1.4, i: .8, d: 0 }, runner: { c: 2, k: .8, i: .5, d: 3 }, tank: { c: 1, k: .4, i: 1.6, d: 5 }, warlock: { c: 1, k: .3, i: 2.5, d: 4 },
  charger: { c: 1, k: .4, i: 2, d: 5 }, shaman: { c: 1, k: .35, i: 2, d: 4 }, guardian: { c: 1, k: .3, i: 3, d: 5 }, wraith: { c: 1, k: .35, i: 2.5, d: 6 },
  golem: { c: 1, k: .3, i: 4, d: 7 }, necro: { c: 1, k: .3, i: 4, d: 8 }, assassin: { c: 1, k: .35, i: 3, d: 8 }, dragon: { c: 1, k: .3, i: 5, d: 10 } };
export function waveDef(L, n) {
  const growth = Math.pow(1 + HP_GROWTH, n - 1), g = [];
  for (const type in L.enemies) {
    const from = L.enemies[type]; if (n < from) continue;
    const S = SPAWN[type], first = type === 'grunt' ? 1 : from;
    g.push({ t: type, c: S.c + Math.floor((n - first) * S.k), i: type === 'grunt' ? Math.max(.35, .9 - n * .03) : S.i, d: S.d });
  }
  return { hp: L.hpMul * growth, growth, g };
}
// Sound recipes: [startHz, endHz, seconds, wave, volume, delay] or ['n', seconds, volume, filterHz, delay] for noise.
export const SOUNDS = {
  build:   [[260,90,.12,'triangle',.4]],
  shoot: {
    cannon:  [[140,45,.18,'sawtooth',.3],['n',.12,.2,400]],
    sniper:  [[1800,300,.12,'square',.2],['n',.08,.25,3000]],
    freezer: [[1400,2200,.25,'sine',.12],[1800,2600,.25,'sine',.1,.05]],
    poison:  [[500,300,.12,'sine',.15],['n',.1,.1,1500]],
    fire:    [['n',.25,.22,900],[200,90,.2,'sawtooth',.12]],
    tesla:   [[1200,200,.15,'sawtooth',.18],['n',.1,.15,5000]],
    mortar:  [[90,35,.3,'sawtooth',.4],['n',.2,.3,500]],
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
  bolt:    [['n',.35,.5,6000],[120,30,.4,'sawtooth',.4]],
  nova:    [[300,900,.3,'sine',.25],['n',.2,.2,2000]],
  wind:    [['n',.5,.25,1500],[200,500,.4,'sine',.1]],
};
