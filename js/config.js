// Game configuration: grid, path, enemies, towers, elements, waves, sounds. Edit here to extend.
export const GRID = 12;
export const PATH = [
  [0, 2],
  [3, 2],
  [3, 5],
  [8, 5],
  [8, 2],
  [10, 2],
  [10, 9],
  [5, 9],
  [5, 7],
  [1, 7],
  [1, 10],
  [11, 10],
];
export const START_GOLD = 130,
  START_HP = 20,
  MAX_WAVE = 25,
  FIRST_COUNTDOWN = 15,
  WAVE_GAP = 10;
export const STEP = 5; // every 5 waves: new enemy, +1 tower slot, pricier upgrades
export const TOWER_CAP_BASE = 7; // max towers at the start (+1 every STEP waves)
export const HP_GROWTH = 0.12; // enemy HP grows +12% (compounding) each wave
export const UPGRADE_INFLATION = 0.25; // upgrade price +25% every STEP waves

// Elements. ELEM_TABLE[attacker][defender] = damage multiplier.
export const ELEM = {
  fire: "🔥",
  ice: "❄️",
  bolt: "⚡",
  nature: "🌿",
  stone: "🪨",
  poison: "🧪",
};
export const MAX_LEVEL = 6,
  UP_MULT = [0.8, 1.2, 1.6, 2.1, 2.7]; // upgrade price multipliers per level
export const SPELLS = {
  charge: { cost: 80, icon: "🔋" },
  freeze: { cost: 100, icon: "🌨️" },
  meteor: { cost: 150, icon: "☄️" },
  repair: { cost: 60, icon: "🔧" },
};
export const ELEM_COLOR = { fire: 0xff6a1a, ice: 0x8be9ff, bolt: 0xffe14d };
const ELEM_TABLE = {
  fire: { nature: 1.5, ice: 1.5, stone: 0.8, fire: 0.4, bolt: 1 },
  ice: { fire: 1.6, nature: 0.9, stone: 1, ice: 0.4, bolt: 1 },
  bolt: { stone: 1.5, ice: 1.25, fire: 1, nature: 0.8, bolt: 0.5 },
  poison: { nature: 0.6, fire: 1.2, ice: 1.3, stone: 1, bolt: 1, poison: 0.4 },
};
export const elemMult = (a, d) => ELEM_TABLE[a]?.[d] ?? 1;

// Enemies. heal = heals allies in radius; atk = shoots the nearest tower (stun = freezes it). `from` = first wave.
export const ENEMIES = {
  grunt: {
    hp: 40,
    speed: 1.0,
    reward: 5,
    color: 0x6fbf3a,
    size: 0.2,
    dmg: 1,
    elem: "nature",
    from: 1,
  },
  runner: {
    hp: 25,
    speed: 2.0,
    reward: 4,
    color: 0xe8531f,
    size: 0.16,
    dmg: 1,
    elem: "fire",
    from: 1,
  },
  tank: {
    hp: 220,
    speed: 0.6,
    reward: 18,
    color: 0x8a5a3c,
    size: 0.3,
    dmg: 3,
    elem: "stone",
    from: 1,
    resist: 0.4,
  },
  shaman: {
    hp: 70,
    speed: 0.9,
    reward: 12,
    color: 0x2fa36b,
    size: 0.2,
    dmg: 2,
    elem: "nature",
    from: 5,
    heal: { r: 2, pct: 0.2, every: 2 },
  },
  warlock: {
    hp: 110,
    speed: 0.8,
    reward: 16,
    color: 0xb02a2a,
    size: 0.22,
    dmg: 2,
    elem: "fire",
    from: 10,
    atk: { r: 2.6, dmg: 25, every: 3, elem: "fire" },
  },
  wraith: {
    hp: 130,
    speed: 1.0,
    reward: 20,
    color: 0x6fd3ff,
    size: 0.22,
    dmg: 2,
    elem: "ice",
    from: 15,
    atk: { r: 2.6, dmg: 15, every: 4, elem: "ice", stun: 2.5 },
  },
  dragon: {
    hp: 900,
    speed: 0.55,
    reward: 80,
    color: 0xff5a1f,
    size: 0.4,
    dmg: 8,
    elem: "fire",
    from: 20,
    resist: 0.25,
    atk: { r: 3.2, dmg: 40, every: 2.5, elem: "fire" },
  },
  guardian: {
    hp: 160,
    speed: 0.8,
    reward: 14,
    color: 0x7d8aa0,
    size: 0.22,
    dmg: 2,
    elem: "stone",
    from: 8,
    resist: 0.7,
    aura: { r: 1.6, every: 6, dur: 3 },
  },
};
export const TOWERS = {
  cannon: {
    nova: "burn",
    cost: 50,
    range: 2.6,
    dmg: 14,
    rate: 1.5,
    hp: 170,
    elem: "fire",
    color: 0x3b82f6,
    proj: 0xffd166,
    speed: 12,
  },
  sniper: {
    cost: 90,
    range: 5.2,
    dmg: 60,
    rate: 0.45,
    hp: 120,
    elem: "bolt",
    color: 0xa855f7,
    proj: 0xffe14d,
    speed: 28,
  },
  freezer: {
    nova: "freeze",
    cost: 35,
    range: 2.0,
    dmg: 3,
    rate: 1.5,
    hp: 120,
    elem: "ice",
    color: 0x22d3ee,
    proj: 0x9be7ff,
    speed: 10,
    slow: 0.4,
    slowT: 1.6,
  },
  poison: {
    cost: 70,
    range: 2.4,
    dmg: 4,
    rate: 1.1,
    hp: 120,
    elem: "poison",
    color: 0x66dd33,
    proj: 0x88ff44,
    speed: 11,
    dot: 6,
    dotT: 4,
  },
};
// Wave generator: groups {t:type, c:count, i:spawn interval, d:delay} + HP multiplier.
export function waveDef(n) {
  const hp = Math.pow(1 + HP_GROWTH, n - 1);
  const g = [
    {
      t: "grunt",
      c: 5 + Math.floor(n * 1.6),
      i: Math.max(0.35, 0.9 - n * 0.03),
      d: 0,
    },
  ];
  if (n >= 2) g.push({ t: "runner", c: 2 + n, i: 0.5, d: 3 });
  if ((n >= 4 && n % 2 === 0) || n >= 6)
    g.push({ t: "tank", c: Math.floor(n / 3), i: 1.6, d: 5 });
  if (n >= 5)
    g.push({ t: "shaman", c: 1 + Math.floor((n - 5) / 3), i: 2, d: 4 });
  if (n >= 8)
    g.push({ t: "guardian", c: 1 + Math.floor((n - 8) / 4), i: 3, d: 5 });
  if (n >= 10)
    g.push({ t: "warlock", c: 1 + Math.floor((n - 10) / 3), i: 2.5, d: 6 });
  if (n >= 15)
    g.push({ t: "wraith", c: 1 + Math.floor((n - 15) / 2), i: 2.5, d: 8 });
  if (n >= 20)
    g.push({ t: "dragon", c: 1 + Math.floor((n - 20) / 3), i: 5, d: 10 });
  return { hp, g };
}
// Sound recipes: [startHz, endHz, seconds, wave, volume, delay] or ['n', seconds, volume, filterHz, delay] for noise.
export const SOUNDS = {
  build: [[260, 90, 0.12, "triangle", 0.4]],
  shoot: {
    cannon: [
      [140, 45, 0.18, "sawtooth", 0.3],
      ["n", 0.12, 0.2, 400],
    ],
    sniper: [
      [1800, 300, 0.12, "square", 0.2],
      ["n", 0.08, 0.25, 3000],
    ],
    freezer: [
      [1400, 2200, 0.25, "sine", 0.12],
      [1800, 2600, 0.25, "sine", 0.1, 0.05],
    ],
  },
  hit: [[900, 700, 0.04, "square", 0.06]],
  death: [
    [300, 60, 0.18, "sawtooth", 0.25],
    ["n", 0.15, 0.2, 800],
  ],
  base: [
    [90, 40, 0.3, "sine", 0.5],
    [880, 880, 0.1, "square", 0.2, 0.1],
    [880, 880, 0.1, "square", 0.2, 0.25],
  ],
  wave: [
    [400, 400, 0.1, "square", 0.2],
    [500, 500, 0.1, "square", 0.2, 0.1],
    [660, 660, 0.25, "square", 0.2, 0.2],
  ],
  clear: [
    [880, 880, 0.3, "sine", 0.25],
    [1320, 1320, 0.5, "sine", 0.2, 0.12],
  ],
  upgrade: [[400, 1200, 0.3, "triangle", 0.3]],
  sell: [
    [1800, 1800, 0.08, "sine", 0.2],
    [2400, 2400, 0.12, "sine", 0.2, 0.07],
  ],
  over: [[400, 100, 1.2, "sawtooth", 0.3]],
  click: [[600, 500, 0.04, "sine", 0.15]],
  bolt: [
    ["n", 0.35, 0.5, 6000],
    [120, 30, 0.4, "sawtooth", 0.4],
  ],
  nova: [
    [300, 900, 0.3, "sine", 0.25],
    ["n", 0.2, 0.2, 2000],
  ],
  wind: [
    ["n", 0.5, 0.25, 1500],
    [200, 500, 0.4, "sine", 0.1],
  ],
};
