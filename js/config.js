// Game configuration: grid, path, enemies, towers, elements, waves, spells, sounds. Edit here to extend.
export const GRID = 12;
export const PATH = [[0,2],[3,2],[3,5],[8,5],[8,2],[10,2],[10,9],[5,9],[5,7],[1,7],[1,10],[11,10]];
export const START_GOLD = 130, START_HP = 20, MAX_WAVE = 25, FIRST_COUNTDOWN = 15, WAVE_GAP = 10;
export const STEP = 5;                // every 5 waves: +1 tower slot, pricier upgrades
export const TOWER_CAP_BASE = 7;      // max towers at the start
export const HP_GROWTH = .13;         // enemy HP grows +13% (compounding) each wave
export const UPGRADE_INFLATION = .25; // upgrade price +25% every STEP waves
export const WAVE_REPAIR = .3;        // towers recover 30% HP after each wave
export const DECOR_TILES = [[0,0,'tree'],[11,0,'rock'],[0,11,'rock'],[11,11,'tree'],[0,5,'tree'],[11,6,'rock'],[6,0,'tree'],[6,11,'rock'],[4,3,'rock'],[7,8,'tree']]; // blocked scenery tiles
export const DECK_SIZE = 4;           // towers chosen before the game
export const MAX_LEVEL = 6, UP_MULT = [.8, 1.2, 1.6, 2.1, 2.7];
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
// dash (speed burst), split (spawns minis on death), summon, blink (teleports forward). resist = wind-push resistance.
export const ENEMIES = {
  grunt:    { icon: '👺', hp: 52,  speed: 1.08, reward: 5,  color: 0x6fbf3a, size: .2,  dmg: 1, elem: 'nature', from: 1 },
  runner:   { icon: '👿', hp: 32,  speed: 2.1,  reward: 4,  color: 0xe8531f, size: .16, dmg: 1, elem: 'fire',   from: 1 },
  tank:     { icon: '👹', hp: 290, speed: .65,  reward: 18, color: 0x8a5a3c, size: .3,  dmg: 3, elem: 'stone',  from: 1, resist: .4 },
  warlock:  { icon: '🧙', hp: 140, speed: .85,  reward: 16, color: 0xb02a2a, size: .22, dmg: 2, elem: 'fire',   from: 3,  atk: { r: 2.9, dmg: 35, every: 2.6, elem: 'fire' } },
  charger:  { icon: '🐗', hp: 120, speed: 1.0,  reward: 12, color: 0xc47a2c, size: .21, dmg: 2, elem: 'nature', from: 4,  dash: { every: 6, dur: 1.4, mul: 2.5 } },
  shaman:   { icon: '🪄', hp: 90,  speed: .95,  reward: 12, color: 0x2fa36b, size: .2,  dmg: 2, elem: 'nature', from: 5,  heal: { r: 2, pct: .2, every: 2 } },
  guardian: { icon: '🛡️', hp: 210, speed: .85,  reward: 14, color: 0x7d8aa0, size: .22, dmg: 2, elem: 'stone',  from: 7,  resist: .7, aura: { r: 1.6, every: 6, dur: 3 } },
  wraith:   { icon: '👻', hp: 170, speed: 1.05, reward: 20, color: 0x6fd3ff, size: .22, dmg: 2, elem: 'ice',    from: 8,  atk: { r: 2.8, dmg: 22, every: 3.5, elem: 'ice', stun: 2.5 } },
  golem:    { icon: '🗿', hp: 520, speed: .5,   reward: 30, color: 0x7b7f87, size: .34, dmg: 4, elem: 'stone',  from: 10, resist: .3, split: { type: 'pebble', n: 3 } },
  necro:    { icon: '💀', hp: 200, speed: .75,  reward: 26, color: 0x4a2a6a, size: .22, dmg: 2, elem: 'poison', from: 12, summon: { type: 'skeleton', n: 2, every: 7 } },
  assassin: { icon: '🥷', hp: 150, speed: 1.3,  reward: 22, color: 0x2a2438, size: .2,  dmg: 3, elem: 'bolt',   from: 14, blink: { every: 6, dist: 2.4 } },
  dragon:   { icon: '🐉', hp: 1180, speed: .58, reward: 90, color: 0xff5a1f, size: .4,  dmg: 8, elem: 'fire',   from: 16, resist: .25, atk: { r: 3.4, dmg: 55, every: 2.4, elem: 'fire' } },
  skeleton: { icon: '☠️', hp: 30,  speed: 1.5,  reward: 1,  color: 0xe8e4d4, size: .13, dmg: 1, elem: 'stone',  from: 99, mini: true },
  pebble:   { icon: '🪨', hp: 90,  speed: .95,  reward: 3,  color: 0x8a8f98, size: .18, dmg: 1, elem: 'stone',  from: 99, mini: true },
};
// Towers. nova = every 10 shots area effect; ignite/dot/chain/splash are projectile effects.
export const TOWERS = {
  cannon:  { cost: 50,  range: 2.6, dmg: 14, rate: 1.5,  hp: 170, elem: 'stone',  color: 0x3b82f6, proj: 0xffd166, speed: 12 },
  sniper:  { cost: 90,  range: 5.2, dmg: 60, rate: .45,  hp: 120, elem: 'bolt',   color: 0xa855f7, proj: 0xffe14d, speed: 28 },
  freezer: { cost: 35,  range: 2.0, dmg: 3,  rate: 1.5,  hp: 120, elem: 'ice',    color: 0x22d3ee, proj: 0x9be7ff, speed: 10, slow: .4, slowT: 1.6, nova: 'freeze' },
  poison:  { cost: 70,  range: 2.4, dmg: 4,  rate: 1.1,  hp: 120, elem: 'poison', color: 0x66dd33, proj: 0x88ff44, speed: 11, dot: 6, dotT: 4 },
  fire:    { cost: 65,  range: 2.2, dmg: 7,  rate: 2,    hp: 130, elem: 'fire',   color: 0xff5522, proj: 0xff8833, speed: 11, ignite: 3, nova: 'burn' },
  tesla:   { cost: 85,  range: 2.5, dmg: 16, rate: 1,    hp: 120, elem: 'bolt',   color: 0x4aa8ff, proj: 0xbfe4ff, speed: 30, chain: 2, stun: 1 },
  mortar:  { cost: 100, range: 4.4, dmg: 26, rate: .5,   hp: 140, elem: 'stone',  color: 0x9a7b4f, proj: 0xd9b27a, speed: 7,  splash: 1.1 },
};
// Wave generator: groups {t:type, c:count, i:spawn interval, d:delay} + HP multiplier.
export function waveDef(n) {
  const hp = Math.pow(1 + HP_GROWTH, n - 1);
  const g = [{ t: 'grunt', c: 5 + Math.floor(n * 1.7), i: Math.max(.32, .9 - n * .03), d: 0 }];
  const add = (t, from, c, i, d) => { if (n >= from) g.push({ t, c, i, d }); };
  if (n >= 2) g.push({ t: 'runner', c: 2 + n, i: .5, d: 3 });
  if ((n >= 4 && n % 2 === 0) || n >= 6) g.push({ t: 'tank', c: Math.floor(n / 3), i: 1.6, d: 5 });
  add('warlock', 3, 1 + Math.floor((n - 3) / 4), 2.5, 4);
  add('charger', 4, 1 + Math.floor((n - 4) / 3), 2, 5);
  add('shaman', 5, 1 + Math.floor((n - 5) / 3), 2, 4);
  add('guardian', 7, 1 + Math.floor((n - 7) / 4), 3, 5);
  add('wraith', 8, 1 + Math.floor((n - 8) / 3), 2.5, 6);
  add('golem', 10, 1 + Math.floor((n - 10) / 4), 4, 7);
  add('necro', 12, 1 + Math.floor((n - 12) / 4), 4, 8);
  add('assassin', 14, 1 + Math.floor((n - 14) / 3), 3, 8);
  add('dragon', 16, 1 + Math.floor((n - 16) / 3), 5, 10);
  return { hp, g };
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
