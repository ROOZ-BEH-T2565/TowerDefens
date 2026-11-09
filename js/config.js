// Game configuration: grid, levels (maps, enemies, unlocks), enemies, towers, elements, waves, spells, sounds.
export const GRID = 12;
export const START_HP = 20,
  FIRST_COUNTDOWN = 15,
  WAVE_GAP = 10;
export const STEP = 5; // every 5 waves: +1 tower slot, pricier upgrades
export const TOWER_CAP_BASE = 7; // max towers at the start of a level
export const HP_GROWTH = 0.09; // enemy HP grows +9% (compounding) each wave
export const UPGRADE_INFLATION = 0.25; // upgrade price +25% every STEP waves
export const WAVE_REPAIR = 0.3; // towers recover 30% HP after each wave
export const DECK_SIZE = 4; // towers chosen before a level
export const MAX_LEVEL = 6,
  UP_MULT = [0.8, 1.2, 1.6, 2.1, 2.7];
export const START_TOWERS = ["cannon"]; // others are unlocked by finishing levels
export const SPELLS = {
  charge: { cost: 80, icon: "🔋" },
  freeze: { cost: 100, icon: "🌨️" },
  meteor: { cost: 150, icon: "☄️" },
  repair: { cost: 60, icon: "🔧" },
};

// Elements. ELEM_TABLE[attacker][defender] = damage multiplier.
export const ELEM = {
  fire: "🔥",
  ice: "❄️",
  bolt: "⚡",
  nature: "🌿",
  stone: "🪨",
  poison: "🧪",
};
export const ELEM_COLOR = {
  fire: 0xff6a1a,
  ice: 0x8be9ff,
  bolt: 0xffe14d,
  poison: 0x88ff44,
};
const ELEM_TABLE = {
  fire: { nature: 1.5, ice: 1.8, stone: 0.8, fire: 0.4, bolt: 1 },
  ice: { fire: 1.6, nature: 0.9, stone: 1, ice: 0.4, bolt: 1 },
  bolt: { stone: 1.5, ice: 1.25, fire: 1, nature: 0.8, bolt: 0.5 },
  poison: { nature: 0.6, fire: 1.2, ice: 1.3, stone: 1, bolt: 1, poison: 0.4 },
  stone: { nature: 1.3, ice: 1.4, fire: 1, bolt: 1, poison: 1, stone: 0.7 },
};
export const elemMult = (a, d) => ELEM_TABLE[a]?.[d] ?? 1;

// Enemies. Abilities: heal, atk (shoots nearest tower; stun freezes it), aura (damage-reduction bubble),
// dash (speed burst), split (spawns minis on death), summon, blink (teleports forward). resist = wind/stun resistance.
export const ENEMIES = {
  grunt: {
    icon: "👺",
    hp: 46,
    speed: 1.05,
    reward: 5,
    color: 0x6fbf3a,
    size: 0.2,
    dmg: 1,
    elem: "nature",
  },
  runner: {
    icon: "👿",
    hp: 28,
    speed: 2.0,
    reward: 4,
    color: 0xe8531f,
    size: 0.16,
    dmg: 1,
    elem: "fire",
  },
  tank: {
    icon: "👹",
    hp: 255,
    speed: 0.65,
    reward: 18,
    color: 0x8a5a3c,
    size: 0.3,
    dmg: 3,
    elem: "stone",
    resist: 0.4,
  },
  warlock: {
    icon: "🧙",
    hp: 120,
    speed: 0.85,
    reward: 16,
    color: 0xb02a2a,
    size: 0.22,
    dmg: 2,
    elem: "fire",
    atk: { r: 2.9, dmg: 35, every: 2.6, elem: "fire" },
  },
  charger: {
    icon: "🐗",
    hp: 105,
    speed: 1.0,
    reward: 12,
    color: 0xc47a2c,
    size: 0.21,
    dmg: 2,
    elem: "nature",
    dash: { every: 6, dur: 1.4, mul: 2.5 },
  },
  shaman: {
    icon: "🪄",
    hp: 78,
    speed: 0.95,
    reward: 12,
    color: 0x2fa36b,
    size: 0.2,
    dmg: 2,
    elem: "nature",
    heal: { r: 2, pct: 0.2, every: 2 },
  },
  guardian: {
    icon: "🛡️",
    hp: 185,
    speed: 0.85,
    reward: 14,
    color: 0x7d8aa0,
    size: 0.22,
    dmg: 2,
    elem: "stone",
    resist: 0.7,
    aura: { r: 1.6, every: 6, dur: 3 },
  },
  wraith: {
    icon: "👻",
    hp: 150,
    speed: 1.05,
    reward: 20,
    color: 0x6fd3ff,
    size: 0.22,
    dmg: 2,
    elem: "ice",
    atk: { r: 2.8, dmg: 22, every: 3.5, elem: "ice", stun: 2.5 },
  },
  golem: {
    icon: "🗿",
    hp: 460,
    speed: 0.5,
    reward: 30,
    color: 0x7b7f87,
    size: 0.34,
    dmg: 4,
    elem: "stone",
    resist: 0.3,
    split: { type: "pebble", n: 3 },
  },
  necro: {
    icon: "💀",
    hp: 175,
    speed: 0.75,
    reward: 26,
    color: 0x4a2a6a,
    size: 0.22,
    dmg: 2,
    elem: "poison",
    summon: { type: "skeleton", n: 2, every: 7 },
  },
  assassin: {
    icon: "🥷",
    hp: 130,
    speed: 1.3,
    reward: 22,
    color: 0x2a2438,
    size: 0.2,
    dmg: 3,
    elem: "bolt",
    blink: { every: 6, dist: 2.4 },
  },
  dragon: {
    icon: "🐉",
    hp: 1000,
    speed: 0.58,
    reward: 90,
    color: 0xff5a1f,
    size: 0.4,
    dmg: 8,
    elem: "fire",
    resist: 0.25,
    atk: { r: 3.4, dmg: 55, every: 2.4, elem: "fire" },
  },
  skeleton: {
    icon: "☠️",
    hp: 26,
    speed: 1.5,
    reward: 1,
    color: 0xe8e4d4,
    size: 0.13,
    dmg: 1,
    elem: "stone",
    mini: true,
  },
  pebble: {
    icon: "🪨",
    hp: 78,
    speed: 0.95,
    reward: 3,
    color: 0x8a8f98,
    size: 0.18,
    dmg: 1,
    elem: "stone",
    mini: true,
  },
  snowling: {
    icon: "⛄",
    hp: 36,
    speed: 1.1,
    reward: 4,
    color: 0xeaf4fb,
    size: 0.17,
    dmg: 1,
    elem: "ice",
  },
  yeti: {
    icon: "🦍",
    hp: 380,
    speed: 0.7,
    reward: 26,
    color: 0xdfeaf2,
    size: 0.34,
    dmg: 4,
    elem: "ice",
    resist: 0.5,
  },
};
// Towers. nova = every 10 shots area effect (from level 3); ignite/dot/chain/splash/stun are projectile effects.
export const TOWERS = {
  cannon: {
    cost: 50,
    range: 2.6,
    dmg: 14,
    rate: 1.5,
    hp: 170,
    elem: "stone",
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
    nova: "freeze",
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
  fire: {
    cost: 65,
    range: 2.2,
    dmg: 7,
    rate: 2,
    hp: 130,
    elem: "fire",
    color: 0xff5522,
    proj: 0xff8833,
    speed: 11,
    ignite: 3,
    nova: "burn",
  },
  tesla: {
    cost: 85,
    range: 2.5,
    dmg: 16,
    rate: 1,
    hp: 120,
    elem: "bolt",
    color: 0x4aa8ff,
    proj: 0xbfe4ff,
    speed: 30,
    chain: 2,
    stun: 1,
  },
  mortar: {
    cost: 100,
    range: 4.4,
    dmg: 26,
    rate: 0.5,
    hp: 140,
    elem: "stone",
    color: 0x9a7b4f,
    proj: 0xd9b27a,
    speed: 7,
    splash: 1.1,
  },
  barracks: {
    cost: 60,
    range: 2.2,
    dmg: 9,
    rate: 1.25,
    hp: 150,
    elem: "stone",
    color: 0x5b7bd5,
    proj: 0x5b7bd5,
    speed: 0,
    sHp: 80,
  }, // 3 sword soldiers
};
export const towerStats = (d, L) => ({
  dmg: d.dmg * Math.pow(1.4, L - 1),
  range: d.range * (1 + 0.1 * (L - 1)),
  rate: d.rate * (1 + 0.12 * (L - 1)),
  hp: d.hp * (1 + 0.3 * (L - 1)),
});

// ---- Chapters & stages: 6 chapters, 19 stages. Maps are 10 base layouts (stages 11+ rotated 180 degrees) dressed in each chapter's theme.
const th = (tile, path, ground, foliage, rock) => ({
  tile,
  path,
  ground,
  foliage,
  rock,
});
const R0 = [0x7a7d85, 0x6a6d75, 0x8a8c92];
export const CHAPTERS = [
  {
    id: "forest",
    icon: "🌲",
    n: 4,
    name: { fa: "فصل جنگل", en: "Forest" },
    theme: th(
      [0x3f6b46, 0x477550],
      0xd4a24c,
      [0x15301f, 0x9fd08a],
      [0x2f7a3a, 0x3a8a3f, 0x2a6a35, 0x4a9a45],
      R0,
    ),
  },
  {
    id: "desert",
    icon: "🏜️",
    n: 3,
    name: { fa: "فصل صحرا", en: "Desert" },
    theme: th(
      [0xc9a96b, 0xd2b377],
      0x8a6a3a,
      [0x3a2e1a, 0xe6cf94],
      [0x6b8e3a, 0x7a9a45, 0x5a7a30],
      [0xb89a6a, 0xa88a5a, 0xc8aa7a],
    ),
  },
  {
    id: "fire",
    icon: "🌋",
    n: 3,
    name: { fa: "درهٔ آتشین", en: "Fiery Valley" },
    theme: th(
      [0x4a3028, 0x543730],
      0xb0583a,
      [0x1c0f0c, 0xd9a28a],
      [0x6a2a1a, 0x8a3a1a, 0x4a3a1a],
      [0x3a2a2a, 0x4a3030],
    ),
  },
  {
    id: "thunder",
    icon: "⛈️",
    n: 3,
    name: { fa: "درهٔ رعد و برق", en: "Thunder Valley" },
    hazard: "thunder",
    theme: th(
      [0x3a3f55, 0x434963],
      0x8b86a8,
      [0x14162a, 0xaeb4d4],
      [0x3a4a5a, 0x4a5a6a, 0x5a4a7a],
      [0x5a5f7a, 0x6a6f8a],
    ),
  },
  {
    id: "ice",
    icon: "🏔️",
    n: 3,
    name: { fa: "کوه یخی", en: "Ice Mountain" },
    theme: th(
      [0xcfe3f2, 0xdcecf7],
      0x8aa6bf,
      [0x2a3a4c, 0xeaf3fb],
      [0xe8f2f8, 0xcfe3f2, 0xdbe9f3],
      [0x9aa8b8, 0x8a98a8],
    ),
  },
  {
    id: "hard",
    icon: "💀",
    n: 3,
    name: { fa: "فصل سختی", en: "Trials" },
    theme: th(
      [0x3a2a2a, 0x453232],
      0x9a3a2a,
      [0x120808, 0xc98a7a],
      [0x3a2a2a, 0x5a2a1a, 0x4a2020],
      [0x2a2020, 0x3a2a2a],
    ),
  },
];
// base map layouts: path waypoints + a free tile for the Air Sweeper
const BASE = [
  {
    p: [
      [0, 2],
      [8, 2],
      [8, 6],
      [3, 6],
      [3, 10],
      [11, 10],
    ],
    s: [5, 4],
  },
  {
    p: [
      [0, 9],
      [4, 9],
      [4, 3],
      [8, 3],
      [8, 9],
      [11, 9],
    ],
    s: [6, 6],
  },
  {
    p: [
      [0, 1],
      [10, 1],
      [10, 4],
      [1, 4],
      [1, 7],
      [10, 7],
      [10, 10],
      [11, 10],
    ],
    s: [5, 5],
  },
  {
    p: [
      [5, 0],
      [5, 3],
      [1, 3],
      [1, 8],
      [6, 8],
      [6, 5],
      [10, 5],
      [10, 11],
    ],
    s: [3, 5],
  },
  {
    p: [
      [0, 6],
      [3, 6],
      [3, 2],
      [7, 2],
      [7, 8],
      [10, 8],
      [10, 3],
      [11, 3],
    ],
    s: [5, 3],
  },
  {
    p: [
      [11, 1],
      [2, 1],
      [2, 5],
      [9, 5],
      [9, 9],
      [3, 9],
      [3, 11],
    ],
    s: [5, 3],
  },
  {
    p: [
      [0, 10],
      [0, 7],
      [5, 7],
      [5, 10],
      [8, 10],
      [8, 4],
      [2, 4],
      [2, 1],
      [11, 1],
    ],
    s: [4, 5],
  },
  {
    p: [
      [6, 0],
      [6, 2],
      [1, 2],
      [1, 6],
      [4, 6],
      [4, 4],
      [9, 4],
      [9, 9],
      [2, 9],
      [2, 11],
    ],
    s: [7, 6],
  },
  {
    p: [
      [0, 5],
      [2, 5],
      [2, 1],
      [5, 1],
      [5, 6],
      [3, 6],
      [3, 9],
      [8, 9],
      [8, 3],
      [11, 3],
    ],
    s: [6, 4],
  },
  {
    p: [
      [0, 0],
      [10, 0],
      [10, 3],
      [1, 3],
      [1, 6],
      [10, 6],
      [10, 9],
      [1, 9],
      [1, 11],
      [11, 11],
    ],
    s: [5, 4],
  },
];
const WAVES = [
  8, 8, 9, 10, 10, 11, 12, 12, 13, 14, 14, 15, 16, 16, 17, 18, 20, 22, 25,
];
// enemies introduced per stage (cumulative) and the wave each type first appears at. Strong ones only come in later stages.
const NEW = [
  ["grunt"],
  ["runner"],
  ["tank"],
  ["warlock"],
  ["charger"],
  ["shaman"],
  ["guardian"],
  ["golem"],
  ["necro"],
  ["assassin"],
  ["wraith"],
  [],
  ["dragon"],
  ["snowling"],
  [],
  ["yeti"],
  [],
  [],
  [],
];
const BASEW = {
  grunt: 1,
  runner: 2,
  tank: 4,
  warlock: 3,
  charger: 4,
  shaman: 4,
  guardian: 5,
  wraith: 5,
  golem: 6,
  necro: 7,
  assassin: 8,
  dragon: 9,
  snowling: 1,
  yeti: 3,
};
// stage index -> tower / spell introduced (available once that stage opens)
export const INTRO_TOWER = {
  1: "sniper",
  2: "poison",
  3: "barracks",
  4: "mortar",
  7: "fire",
  10: "tesla",
  13: "freezer",
};
export const INTRO_SPELL = { 7: "meteor", 10: "charge", 13: "freeze" };
export const maxLevelFor = (i) => (i < 7 ? 3 : i < 10 ? 4 : i < 13 ? 5 : 6); // towers can only reach level 4+ after stage 7
export const LEVELS = [];
let idx = 0;
CHAPTERS.forEach((c) => {
  c.first = idx;
  idx += c.n;
});
CHAPTERS.forEach((c, ci) => {
  for (let k = 0; k < c.n; k++) {
    const i = c.first + k,
      B = BASE[i % 10],
      tr = i >= 10 ? ([x, y]) => [11 - x, 11 - y] : (p) => p,
      roster = {};
    for (let j = 0; j <= i; j++) for (const t of NEW[j]) roster[t] = BASEW[t];
    LEVELS.push({
      ch: ci,
      name: { fa: c.name.fa + " " + (k + 1), en: c.name.en + " " + (k + 1) },
      waves: WAVES[i],
      hpMul: 1 + 0.1 * i,
      gold: 130 + 8 * i,
      theme: c.theme,
      path: B.p.map(tr),
      sweeper: i >= 4 ? tr(B.s) : null,
      enemies: roster,
      hazard: c.hazard || null,
    });
  }
});
// first level in which each enemy type appears (for the guide)
export const ENEMY_LEVEL = {};
LEVELS.forEach((L, i) => {
  for (const k in L.enemies) if (!ENEMY_LEVEL[k]) ENEMY_LEVEL[k] = i + 1;
});
// all tiles of a path (straight axis-aligned segments)
export function pathTiles(path) {
  const s = new Set();
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, ay] = path[i],
      [bx, by] = path[i + 1],
      dx = Math.sign(bx - ax),
      dy = Math.sign(by - ay);
    let x = ax,
      y = ay;
    for (;;) {
      s.add(x + "," + y);
      if (x === bx && y === by) break;
      x += dx;
      y += dy;
    }
  }
  return s;
}
// Fixed build plots: tiles next to the path, spaced so no two plots touch (the only places towers may be built).
export function plotsFor(L) {
  if (L._plots) return L._plots;
  const P = pathTiles(L.path),
    out = [],
    ex = L.sweeper ? L.sweeper.join(",") : "";
  for (let y = 0; y < GRID; y++)
    for (let x = 0; x < GRID; x++) {
      const k = x + "," + y;
      if (P.has(k) || k === ex) continue;
      let near = false;
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++)
          if (P.has(x + dx + "," + (y + dy))) near = true;
      if (
        !near ||
        out.some(([a, b]) => Math.max(Math.abs(a - x), Math.abs(b - y)) < 2)
      )
        continue;
      out.push([x, y]);
    }
  return (L._plots = out);
}
// Wave generator for a level. Enemies only appear from the wave given in the level's roster.
const SPAWN = {
  grunt: { c: 5, k: 1.4, i: 0.8, d: 0 },
  runner: { c: 2, k: 0.8, i: 0.5, d: 3 },
  tank: { c: 1, k: 0.4, i: 1.6, d: 5 },
  warlock: { c: 1, k: 0.3, i: 2.5, d: 4 },
  charger: { c: 1, k: 0.4, i: 2, d: 5 },
  shaman: { c: 1, k: 0.35, i: 2, d: 4 },
  guardian: { c: 1, k: 0.3, i: 3, d: 5 },
  wraith: { c: 1, k: 0.35, i: 2.5, d: 6 },
  golem: { c: 1, k: 0.3, i: 4, d: 7 },
  necro: { c: 1, k: 0.3, i: 4, d: 8 },
  assassin: { c: 1, k: 0.35, i: 3, d: 8 },
  dragon: { c: 1, k: 0.3, i: 5, d: 10 },
  snowling: { c: 4, k: 1.2, i: 0.7, d: 1 },
  yeti: { c: 1, k: 0.4, i: 3, d: 6 },
};
export function waveDef(L, n) {
  const growth = Math.pow(1 + HP_GROWTH, n - 1),
    g = [];
  for (const type in L.enemies) {
    const from = L.enemies[type];
    if (n < from) continue;
    const S = SPAWN[type],
      first = type === "grunt" ? 1 : from;
    g.push({
      t: type,
      c: S.c + Math.floor((n - first) * S.k),
      i: type === "grunt" ? Math.max(0.35, 0.9 - n * 0.03) : S.i,
      d: S.d,
    });
  }
  return { hp: L.hpMul * growth, growth, g };
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
    poison: [
      [500, 300, 0.12, "sine", 0.15],
      ["n", 0.1, 0.1, 1500],
    ],
    fire: [
      ["n", 0.25, 0.22, 900],
      [200, 90, 0.2, "sawtooth", 0.12],
    ],
    tesla: [
      [1200, 200, 0.15, "sawtooth", 0.18],
      ["n", 0.1, 0.15, 5000],
    ],
    mortar: [
      [90, 35, 0.3, "sawtooth", 0.4],
      ["n", 0.2, 0.3, 500],
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
