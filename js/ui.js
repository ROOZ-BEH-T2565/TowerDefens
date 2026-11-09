// UIManager: main menu, level select, deck, HUD, radial build/upgrade/sell menu, bottom info window, guide, settings, shop, spells.
import * as THREE from "three";
import {
  TOWERS,
  ENEMIES,
  ELEM,
  LEVELS,
  CHAPTERS,
  INTRO_TOWER,
  INTRO_SPELL,
  ENEMY_LEVEL,
  START_HP,
  DECK_SIZE,
  waveDef,
  SPELLS,
  towerStats,
} from "./config.js";
import { i18n, t } from "./i18n.js";
import { wp } from "./grid.js";
import { thumb } from "./thumbs.js";
import { Save } from "./save.js";
const $ = (id) => document.getElementById(id);
const OVERLAYS = [
  "menu",
  "levels",
  "records",
  "settings",
  "shop",
  "howto",
  "deck",
  "intro",
];
const fmt = (v) =>
  v >= 10 ? String(Math.round(v)) : String(Math.round(v * 10) / 10);
const RR = 58; // radial menu radius (px)
export class UIManager {
  constructor(game, audio, sc) {
    this.game = game;
    this.audio = audio;
    this.sc = sc;
    this.sel = null;
    this.acc = 0;
    this.armed = null;
    this.spkey = "";
    this.nl = "";
    this.gtab = "basics";
    this.rkey = "";
    this.pkey = "";
    this.levelIdx = 0;
    this.speed = +(localStorage.getItem("td_speed") || 1);
    this.q = localStorage.getItem("td_q") || "high";
    try {
      this.deck = JSON.parse(localStorage.getItem("td_deck") || "[]");
    } catch (e) {
      this.deck = [];
    }
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.97, 1, 64).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.85,
      }),
    );
    this.ring.visible = false;
    this.ring.position.y = 0.05;
    sc.scene.add(this.ring);
  }
  init() {
    const g = this.game,
      a = this.audio,
      click = () => a.play("click"),
      on = (id, fn) => {
        $(id).onclick = () => {
          click();
          fn();
        };
      };
    this.setTheme(localStorage.getItem("td_theme") || "dark");
    this.setQuality(this.q);
    i18n.apply();
    $("vol").value = a.vol;
    const seg = (id, fn) =>
      ($(id).onclick = (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        a.unlock();
        click();
        fn(b.dataset.v);
        this.segs();
      });
    seg("seg-lang", (v) => {
      i18n.set(v);
      this.refresh();
      this.guide(this.gtab);
      this.renderLevels();
      this.renderRecords();
      this.renderDeck();
    });
    seg("seg-theme", (v) => this.setTheme(v));
    seg("seg-sound", (v) => a.setMuted(v === "off"));
    seg("seg-q", (v) => this.setQuality(v));
    seg("seg-speed", (v) => this.setSpeed(+v));
    seg("seg-guide", (v) => this.guide(v));
    $("vol").oninput = (e) => {
      a.unlock();
      a.setVol(+e.target.value);
    };
    // main menu -> levels -> deck -> game
    on("m-start", () => this.openLevels());
    on("m-settings", () => this.show("settings"));
    on("m-guide", () => this.openGuide());
    on("m-records", () => {
      this.renderRecords();
      $("menu").classList.add("hidden");
      this.show("records");
    });
    on("m-reset", () => {
      if (confirm(t("resetConfirm"))) {
        Save.reset();
        location.reload();
      }
    }); // forget everything saved
    on("rec-back", () => {
      $("records").classList.add("hidden");
      this.show("menu");
    });
    on("lv-back", () => {
      $("levels").classList.add("hidden");
      this.show("menu");
    });
    $("levelgrid").onclick = (e) => {
      const b = e.target.closest("button");
      if (!b || b.disabled) return;
      click();
      this.levelIdx = +b.dataset.i;
      $("levels").classList.add("hidden");
      this.openDeck();
    };
    on("deckback", () => {
      $("deck").classList.add("hidden");
      this.openLevels();
    });
    $("deckgrid").onclick = (e) => {
      const b = e.target.closest("button");
      if (!b || b.disabled) return;
      click();
      this.toggleDeck(b.dataset.k);
    };
    on("deckgo", () => this.startLevel(this.levelIdx, this.deck.slice()));
    // in-game buttons
    on("gear", () => this.show("settings"));
    on("resume", () => this.hide("settings"));
    on("speed", () => {
      this.setSpeed((this.speed % 3) + 1);
      this.segs();
    });
    on("next", () => g.startWave(true)); // start the next wave now (bonus gold)
    on("shopbtn", () => this.openShop());
    on("shopclose", () => this.hide("shop"));
    on("restart2", () => {
      this.hide("settings");
      this.startLevel(g.levelIdx, g.deck.slice());
    });
    on("tomenu", () => this.showMenu());
    on("howbtn", () => {
      $("settings").classList.add("hidden");
      this.openGuide();
    });
    on("startbtn", () => {
      localStorage.setItem("td_seen", "1");
      this.hide("howto");
    });
    on("overnext", () => {
      $("over").classList.add("hidden");
      this.levelIdx = g.levelIdx + 1;
      this.openDeck();
    });
    on("overretry", () => {
      $("over").classList.add("hidden");
      this.startLevel(g.levelIdx, g.deck.slice());
    });
    on("overmenu", () => this.showMenu());
    on("introgo", () => this.introNext());
    $("shoplist").onclick = (e) => {
      const b = e.target.closest("button");
      if (!b || b.disabled) return;
      click();
      g.buySpell(b.dataset.k);
      this.renderShop();
    };
    $("spells").onclick = (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      click();
      this.useSpell(b.dataset.s);
    };
    const act = (e) => {
      const b = e.target.closest("button");
      if (!b || b.disabled) return;
      click();
      this.act(b.dataset.a, b);
    };
    $("panel").onclick = act;
    $("radial").onclick = act;
    this.segs();
    this.refresh();
    this.showMenu();
  }
  // ---- overlays / flow
  show(id) {
    $(id).classList.remove("hidden");
    this.sync();
  }
  hide(id) {
    $(id).classList.add("hidden");
    this.sync();
  }
  sync() {
    this.game.paused = OVERLAYS.some(
      (id) => !$(id).classList.contains("hidden"),
    );
  } // paused whenever a menu is open
  showMenu() {
    [
      "levels",
      "records",
      "settings",
      "deck",
      "over",
      "shop",
      "howto",
      "intro",
    ].forEach((i) => $(i).classList.add("hidden"));
    this.armed = null;
    this.select(null);
    this.show("menu");
  }
  openGuide() {
    this.guide(this.gtab);
    this.show("howto");
  }
  openShop() {
    this.renderShop();
    this.show("shop");
  }
  openLevels() {
    this.renderLevels();
    $("menu").classList.add("hidden");
    this.show("levels");
  }
  startLevel(i, deck) {
    $("deck").classList.add("hidden");
    $("over").classList.add("hidden");
    this.armed = null;
    this.select(null);
    this.game.start(i, deck);
    const L = LEVELS[i];
    this.toast(
      `${t("stage")} ${i + 1}: ${L.name[i18n.lang]}${L.sweeper ? " — 🌀 " + t("sweeperHint") : ""}`,
    );
    this.refresh();
    this.sync();
    this.showIntro(i);
  }
  renderLevels() {
    // stages grouped by chapter
    const d = Save.data;
    let h = "",
      ch = -1;
    LEVELS.forEach((L, i) => {
      if (L.ch !== ch) {
        ch = L.ch;
        const c = CHAPTERS[ch];
        h += `<div class="chap">${c.icon} ${c.name[i18n.lang]}</div>`;
      }
      const open = Save.levelOpen(i),
        st = d.done[i] || 0,
        tw = INTRO_TOWER[i],
        sp = INTRO_SPELL[i];
      h += `<button class="lv ${open ? "" : "lock"}" data-i="${i}" ${open ? "" : "disabled"}><b>${i + 1}. ${L.name[i18n.lang]}</b><span class="stars">${"★".repeat(st)}${"☆".repeat(3 - st)}</span>
        <small>${open ? `${t("waves")}: ${L.waves}${d.best[i] ? ` · ${t("best")}: ${d.best[i]}` : ""}` : "🔒 " + t("locked")}</small>${L.sweeper ? `<small>🌀 ${t("sweeper")}</small>` : ""}
        ${tw || sp ? `<small class="rw">🎁 ${tw ? `<img class="th s" src="${thumb("tower", tw, 1)}" alt=""> ${t(tw)}` : ""} ${sp ? SPELLS[sp].icon + " " + t("sp_" + sp) : ""}</small>` : ""}</button>`;
    });
    $("levelgrid").innerHTML = h;
  }
  renderRecords() {
    const d = Save.data,
      s = d.stats;
    $("recbody").innerHTML =
      `<div class="gi"><div><b>${t("games")}: ${s.games} · ${t("wins")}: ${s.wins} · ${t("kills")}: ${s.kills}</b></div></div>` +
      LEVELS.map(
        (L, i) =>
          `<div class="gi"><div><b>${i + 1}. ${L.name[i18n.lang]}</b><small><span class="stars">${"★".repeat(d.done[i] || 0)}${"☆".repeat(3 - (d.done[i] || 0))}</span> · ${t("best")}: ${d.best[i] || 0}/${L.waves}</small></div></div>`,
      ).join("");
  }
  // ---- deck (only unlocked towers can be taken into a level)
  avail() {
    const u = Save.towers();
    return Object.keys(TOWERS).filter((k) => u.has(k));
  }
  openDeck() {
    const av = this.avail(),
      size = Math.min(DECK_SIZE, av.length);
    this.deck = this.deck.filter((k) => av.includes(k)).slice(0, size);
    for (const k of av)
      if (this.deck.length < size && !this.deck.includes(k)) this.deck.push(k);
    this.renderDeck();
    this.show("deck");
  }
  toggleDeck(k) {
    const size = Math.min(DECK_SIZE, this.avail().length),
      i = this.deck.indexOf(k);
    if (i >= 0) this.deck.splice(i, 1);
    else if (this.deck.length < size) this.deck.push(k);
    this.renderDeck();
  }
  renderDeck() {
    const u = Save.towers(),
      size = Math.min(DECK_SIZE, u.size),
      L = LEVELS[this.levelIdx];
    $("decksub").textContent =
      `${t("stage")} ${this.levelIdx + 1}: ${L.name[i18n.lang]} · ${t("deckSub")} ${this.deck.length}/${size}`;
    $("deckgrid").innerHTML = Object.keys(TOWERS)
      .map((k) => {
        const d = TOWERS[k],
          open = u.has(k),
          at =
            (+Object.keys(INTRO_TOWER).find((i) => INTRO_TOWER[i] === k) || 0) +
            1;
        return `<button class="dk ${this.deck.includes(k) ? "sel" : ""} ${open ? "" : "lock"}" data-k="${k}" ${open ? "" : "disabled"}><img class="th" src="${thumb("tower", k, 1)}" alt=""><b>${t(k)} ${ELEM[d.elem]}</b>
        <small>💰${d.cost} · ${t("dmg")} ${d.dmg} · ${t("range")} ${d.range}</small><small>${open ? t("tw_" + k) : "🔒 " + t("unlockAt") + " " + at}</small></button>`;
      })
      .join("");
    $("deckgo").disabled = this.deck.length !== size;
  }
  // ---- guide: basics / towers / enemies with real model thumbnails
  guide(tab) {
    this.gtab = tab;
    let h = "";
    if (tab === "basics")
      h =
        "<ul>" +
        [1, 2, 3, 4, 5, 6].map((i) => `<li>${t("h" + i)}</li>`).join("") +
        "</ul>";
    else if (tab === "towers")
      h = Object.keys(TOWERS)
        .map((k) => {
          const d = TOWERS[k];
          return `<div class="gi"><div class="imgs"><img class="th" src="${thumb("tower", k, 1)}" alt=""><img class="th" src="${thumb("tower", k, 6)}" alt=""></div><div><b>${t(k)} ${ELEM[d.elem]} ${t("el_" + d.elem)}</b><small>💰${d.cost} · ${t("dmg")} ${d.dmg} · ${t("range")} ${d.range} · ${t("rate")} ${d.rate} · ${t("hpT")} ${d.hp}</small><p>${t("tw_" + k)}</p></div></div>`;
        })
        .join("");
    else
      h = Object.keys(ENEMIES)
        .filter((k) => !ENEMIES[k].mini)
        .map((k) => {
          const c = ENEMIES[k];
          return `<div class="gi"><div class="imgs"><img class="th" src="${thumb("enemy", k)}" alt=""></div><div><b>${t(k)} ${ELEM[c.elem]} ${t("el_" + c.elem)}</b><small>${t("stage")} ${ENEMY_LEVEL[k]}+ · ${t("hpT")} ${c.hp} · ${t("moveSpd")} ${c.speed}</small><p>${t("ab_" + k)}</p></div></div>`;
        })
        .join("");
    $("guidebody").innerHTML = h;
    this.segs();
  }
  segs() {
    // highlight current value in each segmented control
    const cur = {
      "seg-lang": i18n.lang,
      "seg-theme": document.documentElement.dataset.theme,
      "seg-sound": this.audio.muted ? "off" : "on",
      "seg-q": this.q,
      "seg-speed": String(this.speed),
      "seg-guide": this.gtab,
    };
    for (const id in cur)
      $(id)
        .querySelectorAll("button")
        .forEach((b) => b.classList.toggle("on", b.dataset.v === cur[id]));
    $("speed").textContent = `⏩ ${this.speed}×`;
  }
  setTheme(m) {
    document.documentElement.dataset.theme = m;
    localStorage.setItem("td_theme", m);
    this.sc.setTheme(m === "dark");
  }
  setQuality(v) {
    this.q = v;
    localStorage.setItem("td_q", v);
    this.sc.setQuality(v === "high");
  }
  setSpeed(v) {
    this.speed = v;
    localStorage.setItem("td_speed", v);
  }
  vignette() {
    const v = $("vig");
    v.classList.add("on");
    setTimeout(() => v.classList.remove("on"), 120);
  }
  toast(m) {
    const e = $("toast");
    e.textContent = m;
    e.classList.add("show");
    clearTimeout(this.tt);
    this.tt = setTimeout(() => e.classList.remove("show"), 4000);
  }
  // ---- selection, radial menu and the bottom info window
  pickTile(u) {
    // called from canvas click
    const g = this.game;
    if (this.armed) {
      // aiming a spell at the enemy path
      if (u && g.grid.pathSet.has(u.x + "," + u.y)) {
        const k = this.armed;
        this.armed = null;
        g.cast(k, u.x, u.y);
        this.spells(true);
      } else this.toast(t("onPath"));
      return;
    }
    if (!u) return this.select(null);
    const tw = g.grid.occ.get(u.x + "," + u.y);
    if (tw)
      this.select(tw.isSweeper ? { sweeper: tw } : { tower: tw, mode: null });
    else if (g.grid.isBuildable(u.x, u.y))
      this.select({ x: u.x, y: u.y, pick: null });
    else {
      if (!u.path && !u.plot) this.toast(t("noBuild"));
      this.select(null);
    }
  }
  select(s) {
    this.sel = s;
    const gr = this.game.grid;
    s && s.tower
      ? gr.highlight(s.tower.x, s.tower.y)
      : s && s.sweeper
        ? gr.highlight(null)
        : s
          ? gr.highlight(s.x, s.y)
          : gr.highlight(null);
    this.refresh();
  }
  act(A, b) {
    // actions from radial icons and info-window buttons
    const g = this.game,
      s = this.sel;
    if (!s) return;
    if (A === "close") this.select(null);
    else if (A === "pick") {
      s.pick = b.dataset.k;
      this.refresh();
    } // step 1: preview range + stats
    else if (A === "cancel") {
      if (s.tower) s.mode = null;
      else s.pick = null;
      this.refresh();
    } else if (A === "ok") {
      const tw = g.build(s.pick, s.x, s.y);
      if (tw) this.select({ tower: tw, mode: null });
    } // step 2: confirm build
    else if (A === "up") {
      s.mode = s.mode === "up" ? null : "up";
      this.refresh();
    } // preview upgrade (green arrows)
    else if (A === "sell") {
      s.mode = s.mode === "sell" ? null : "sell";
      this.refresh();
    } else if (A === "doup") {
      g.upgrade(s.tower);
      s.mode = null;
      this.refresh();
    } else if (A === "dosell") {
      g.sell(s.tower);
      this.select(null);
    } else if (A === "fix") g.repairSweeper();
    else if (A === "rl") s.sweeper.rotate(-1);
    else if (A === "rr") s.sweeper.rotate(1);
  }
  anchor() {
    const s = this.sel;
    return s.tower
      ? s.tower.g.position.clone().setY(0.4)
      : s.sweeper
        ? s.sweeper.g.position.clone().setY(0.4)
        : wp(s.x, s.y).setY(0.3);
  }
  place() {
    // keep the radial menu glued to its tile (camera shake / resize safe)
    const R = $("radial");
    if (!this.sel) {
      R.style.display = "none";
      return;
    }
    const v = this.anchor().project(this.sc.cam),
      W = $("view").clientWidth,
      H = $("view").clientHeight,
      m = RR + 34,
      ph = $("panel").style.display === "none" ? 0 : $("panel").offsetHeight;
    let x = (v.x * 0.5 + 0.5) * W,
      y = (-v.y * 0.5 + 0.5) * H;
    if (W > 2 * m) x = Math.min(Math.max(x, m), W - m);
    if (H > 2 * m + ph) y = Math.min(Math.max(y, m), H - m - ph);
    R.style.display = "block";
    R.style.transform = `translate(${x}px,${y}px)`;
  }
  tick(dt) {
    this.place();
    this.acc += dt;
    if (this.acc > 0.2) {
      this.acc = 0;
      this.hud();
    }
  }
  hud() {
    const g = this.game,
      L = g.level;
    $("hpfill").style.width = (g.hp / START_HP) * 100 + "%";
    $("hptxt").textContent = g.hp;
    $("gold").textContent = g.gold.toLocaleString("en");
    $("towers").textContent = `${g.towers.length}/${g.cap}`;
    $("wavetxt").textContent = `${t("wave")} ${g.wave}/${L.waves}`;
    $("wavefill").style.width = g.waveProgress() * 100 + "%";
    const nw = g.state === "countdown" ? g.wave + 1 : g.wave,
      bonus = Math.round((waveDef(L, Math.max(nw, 1)).growth - 1) * 100);
    $("st1").textContent =
      (g.state === "countdown"
        ? "⏳ " + `${t("nextin")} ${Math.ceil(g.timer)} ${t("s")}`
        : "⚔️ " + t("inwave")) + ` · ${t("stage")} ${g.levelIdx + 1}`;
    $("st2").textContent = `👹 ${t("enemyHp")} +${bonus}%`;
    if (g.gold !== this.pg) {
      const c = $("goldchip");
      c.classList.remove("up");
      void c.offsetWidth;
      c.classList.add("up");
      this.pg = g.gold;
    } // gold pulse
    const nl = '⏩ <span class="lbl">' + t("next") + "</span>";
    if (nl !== this.nl) {
      this.nl = nl;
      $("next").innerHTML = nl;
    } // only rewrite when changed so clicks aren't lost
    $("next").disabled = g.state !== "countdown" || g.over;
    this.spells();
  }
  refresh() {
    this.hud();
    this.panel();
    this.radial();
  }
  radial() {
    // circle of icons; first tap previews (range / stats), the icon turns into a tick, second tap on the tick confirms
    const R = $("radial"),
      s = this.sel,
      g = this.game;
    let items = [];
    if (s && s.tower) {
      const w = s.tower,
        uc = w.upgradeCost(g.wave, g.maxLv),
        up = s.mode === "up",
        sl = s.mode === "sell";
      items = [
        {
          a: up ? "doup" : "up",
          ang: -90,
          ic: up ? "✔" : "⬆️",
          sub:
            uc == null ? (w.level < 6 ? "🔒" + g.maxLv : t("max")) : "💰" + uc,
          dis: uc == null || g.gold < uc,
          sel: up,
        },
        {
          a: sl ? "dosell" : "sell",
          ang: 90,
          ic: sl ? "✔" : "💰",
          sub: "+" + w.sellValue(),
          sel: sl,
        },
      ];
    } else if (s && s.sweeper) {
      const w = s.sweeper;
      items = w.repaired
        ? [
            { a: "rl", ang: 180, ic: "↺" },
            { a: "rr", ang: 0, ic: "↻" },
          ]
        : [
            {
              a: "fix",
              ang: -90,
              ic: "🔧",
              sub: "💰" + w.cost,
              dis: g.gold < w.cost,
            },
          ];
    } else if (s) {
      const full = g.towers.length >= g.cap;
      items = g.deck.map((k, i) => {
        const p = s.pick === k,
          cost = TOWERS[k].cost;
        return {
          a: p ? "ok" : "pick",
          k,
          ang: -90 + (360 * i) / g.deck.length,
          img: p ? null : thumb("tower", k, 1),
          ic: "✔",
          sub: "💰" + cost,
          poor: g.gold < cost,
          dis: p && (g.gold < cost || full),
          sel: p,
        };
      });
    }
    const h = s
      ? '<div class="rring"></div>' +
        items
          .map((it) => {
            const r = (it.ang * Math.PI) / 180;
            return `<button class="rb ${it.sel ? "sel" : ""} ${it.poor ? "poor" : ""}" data-a="${it.a}" ${it.k ? `data-k="${it.k}"` : ""} ${it.dis ? "disabled" : ""} style="left:${Math.round(Math.cos(r) * RR)}px;top:${Math.round(Math.sin(r) * RR)}px">${it.img ? `<img src="${it.img}" alt="">` : `<span class="ic">${it.ic}</span>`}${it.sub ? `<small>${it.sub}</small>` : ""}</button>`;
          })
          .join("")
      : "";
    if (h !== this.rkey) {
      this.rkey = h;
      R.innerHTML = h;
    }
  }
  rows(cur, nx, w) {
    // stat rows; with nx (next level) each row gets a green arrow + number
    const r = (l, v, d) =>
        `<div class="sr"><span>${l}</span><b>${v}</b>${d ? `<i class="up">▲ +${d}</i>` : ""}</div>`,
      df = (k) => (nx ? fmt(nx[k] - cur[k]) : "");
    return `<div class="pst">${r(t("dmg"), fmt(cur.dmg), df("dmg"))}${r(t("range"), fmt(cur.range), df("range"))}${r(t("rate"), fmt(cur.rate), df("rate"))}${r(t("hpT"), w ? Math.ceil(w.hp) + "/" + fmt(cur.hp) : fmt(cur.hp), df("hp"))}</div>`;
  }
  panel() {
    // absolute-positioned window at the bottom of the map (never shifts the layout)
    const p = $("panel"),
      g = this.game;
    let s = this.sel;
    if (s && s.tower && !g.towers.includes(s.tower)) s = this.sel = null; // destroyed or sold
    const ring = (c, r, x, z) => {
      this.ring.visible = c;
      if (c) {
        this.ring.position.set(x, 0.05, z);
        this.ring.scale.setScalar(r);
      }
    };
    let h = "";
    if (!s || (!s.tower && !s.sweeper && !s.pick)) {
      ring(false);
      if (!this.sel || (!s.tower && !s.sweeper)) {
        p.style.display = "none";
        return;
      }
    }
    if (s.sweeper) {
      const w = s.sweeper;
      ring(false);
      h = `<div class="ph"><b>🌀 ${t("sweeper")}${w.repaired ? "" : " · " + t("ruined")}</b><button class="x" data-a="close">✕</button></div><p class="st">${t("sweeperDesc")}${w.repaired ? `<br>${t("hpT")} ${Math.ceil(w.hp)}/${w.maxHp}` : ` · ${t("repair")} 💰${w.cost}${g.gold < w.cost ? " ⚠️ " + t("needGold") : ""}`}</p>`;
    } else if (s.tower) {
      const w = s.tower,
        up = s.mode === "up",
        uc = w.upgradeCost(g.wave, g.maxLv),
        cur = towerStats(w.def, w.level),
        nx = up && uc != null ? towerStats(w.def, w.level + 1) : null,
        pos = w.g.position;
      ring(true, nx ? nx.range : cur.range, pos.x, pos.z);
      this.ring.material.color.setHex(up ? 0x34d399 : 0x22d3ee);
      const D = w.def,
        nl = w.level + 1;
      let extra = "";
      if (D.nova)
        extra += `<div class="ab">✨ ${t("nova_" + D.nova)} ${w.level < 4 ? "🔒" : "✅"}${nx && nl === 4 ? ` <i class="up">▲ ${t("unlocked")}</i>` : ""}</div>`;
      if (w.type === "sniper")
        extra += `<div class="ab">🎯 ${w.multi} ${t("targets")}${nx && nl >= 4 ? ' <i class="up">▲ +1</i>' : ""}${w.level < 4 ? " 🔒 4" : ""}</div>`;
      if (w.type === "tesla")
        extra += `<div class="ab">🔗 ${w.chainN} ${t("chain")}${nx && nl >= 4 ? ` <i class="up">▲ +${nl === 4 ? 2 : 1}</i>` : ""}${w.level < 4 ? " 🔒 4" : ""}</div>`;
      if (w.type === "mortar")
        extra += `<div class="ab">💣 ${w.multi} ${t("shells")}${nx && nl >= 5 ? ' <i class="up">▲ +1</i>' : ""}${w.level < 5 ? " 🔒 5" : ""}</div>`;
      if (w.type === "barracks")
        extra += `<div class="ab">🛡️ 3 ${t("soldiers")} · ${t("hpT")} ${fmt(w.soldierHp)}${nx ? ` <i class="up">▲ +${fmt(w.soldierHp * 0.3)}</i>` : ""}</div>`;
      if (uc == null && w.level < 6)
        extra += `<div class="ab">🔒 ${t("lvCap")}: ${g.maxLv}</div>`;
      h = `<div class="ph"><img class="th" src="${thumb("tower", w.type, w.level)}" alt=""><div><b>${t(w.type)} ${ELEM[w.def.elem]} · ${t("level")} ${w.level}${nx ? ` <i class="up">➜ ${w.level + 1}</i>` : ""}</b></div><button class="x" data-a="close">✕</button></div>${this.rows(cur, nx, w)}${extra}`;
      if (up)
        h += `<div class="row"><button class="ok" data-a="doup" ${uc == null || g.gold < uc ? "disabled" : ""}>⬆ ${t("upgrade")} 💰${uc}</button><button data-a="cancel">${t("cancel")}</button></div>`;
      else if (s.mode === "sell")
        h += `<div class="row"><button class="ok" data-a="dosell">💰 ${t("sell")} +${w.sellValue()}</button><button data-a="cancel">${t("cancel")}</button></div>`;
    } else {
      // tile + chosen tower: preview range, stats, confirm
      const d = TOWERS[s.pick],
        full = g.towers.length >= g.cap,
        pos = wp(s.x, s.y);
      ring(true, d.range, pos.x, pos.z);
      this.ring.material.color.setHex(0x22d3ee);
      h = `<div class="ph"><img class="th" src="${thumb("tower", s.pick, 1)}" alt=""><div><b>${t(s.pick)} ${ELEM[d.elem]} ${t("el_" + d.elem)}</b></div><button class="x" data-a="close">✕</button></div>${this.rows(towerStats(d, 1), null, null)}<p class="st">${t("tw_" + s.pick)}${full ? " · ⚠️ " + t("capFull") : ""}</p>
        <div class="row"><button class="ok" data-a="ok" ${g.gold < d.cost || full ? "disabled" : ""}>✔ ${t("confirm")} 💰${d.cost}</button><button data-a="cancel">${t("cancel")}</button></div>`;
    }
    p.style.display = "block";
    if (h !== this.pkey) {
      this.pkey = h;
      p.innerHTML = h;
    }
  }
  spells(force) {
    // spell bar: lightning reservoir + owned spells (rebuilt only when changed)
    const g = this.game,
      key = [
        Math.floor(g.charge),
        g.spells.freeze,
        g.spells.meteor,
        g.spells.repair,
        this.armed,
      ].join();
    if (!force && key === this.spkey) return;
    this.spkey = key;
    const mk = (id, ic, sub, cls) =>
      `<button data-s="${id}" class="${cls}">${ic}<small>${sub}</small></button>`;
    let h = Save.spells().has("charge")
      ? mk(
          "bolt",
          "⚡",
          Math.floor(g.charge) + "%",
          (g.charge >= 100 ? "ready " : "") +
            (this.armed === "bolt" ? "sel" : ""),
        )
      : "";
    for (const k of ["freeze", "meteor", "repair"])
      if (g.spells[k] > 0)
        h += mk(
          k,
          SPELLS[k].icon,
          "×" + g.spells[k],
          this.armed === k ? "sel" : "",
        );
    $("spells").innerHTML = h;
  }
  useSpell(k) {
    const g = this.game;
    if (k === "bolt" || k === "meteor") {
      // tile-targeted spells
      if (k === "bolt" && g.charge < 100) return this.toast(t("notReady"));
      this.armed = this.armed === k ? null : k;
      if (this.armed) {
        this.select(null);
        this.toast(t("aim"));
      }
    } else g.cast(k);
    this.spells(true);
  }
  renderShop() {
    const g = this.game;
    $("shopgold").textContent = g.gold;
    $("shoplist").innerHTML = Object.keys(SPELLS)
      .filter((k) => Save.spells().has(k))
      .map(
        (k) =>
          `<div class="opt"><span>${SPELLS[k].icon} <b>${t("sp_" + k)}</b><br><small>${t("d_" + k)}</small></span><button data-k="${k}" ${g.gold < SPELLS[k].cost ? "disabled" : ""}>💰${SPELLS[k].cost}</button></div>`,
      )
      .join("");
    this.spells(true);
  }
  flash() {
    const f = $("flash");
    f.classList.add("on");
    setTimeout(() => f.classList.remove("on"), 90);
  } // lightning flash
  slides(i) {
    // intro / tutorial slides for a stage
    const L = LEVELS[i],
      c = CHAPTERS[L.ch],
      s = [],
      tw = INTRO_TOWER[i] || (i === 0 ? "cannon" : null),
      sp = INTRO_SPELL[i];
    if (i === 0)
      [1, 2, 3, 4].forEach((n) =>
        s.push({
          ic: ["🎯", "👆", "⬆️", "💰"][n - 1],
          t: "tut" + n + "T",
          d: "tut" + n + "D",
        }),
      );
    else if (i === c.first)
      s.push({ ic: c.icon, title: c.name[i18n.lang], d: "chD_" + c.id });
    if (tw) s.push({ img: thumb("tower", tw, 1), t: tw, d: "tw_" + tw });
    if (sp)
      s.push(
        sp === "charge"
          ? { ic: "⚡", t: "resT", d: "resD" }
          : { ic: SPELLS[sp].icon, t: "sp_" + sp, d: "d_" + sp },
      );
    if (i === 4) s.push({ ic: "🌀", t: "sweeper", d: "sweeperDesc" });
    if (L.hazard && i === c.first) s.push({ ic: "⛈️", t: "hazT", d: "hazD" });
    if (i === 7) s.push({ ic: "⭐", t: "lvUpT", d: "lvUpD" });
    if (i === 13)
      s.push({
        img: thumb("enemy", "snowling"),
        t: "snowling",
        d: "ab_snowling",
      });
    if (i === 15)
      s.push({ img: thumb("enemy", "yeti"), t: "yeti", d: "ab_yeti" });
    return s;
  }
  showIntro(i) {
    const s = this.slides(i);
    if (!s.length || Save.data.seen[i]) return;
    this.islides = s;
    this.ipos = 0;
    this.istage = i;
    this.renderIntro();
    this.show("intro");
  }
  renderIntro() {
    const s = this.islides[this.ipos];
    $("introimg").innerHTML = s.img
      ? `<img class="th big" src="${s.img}" alt="">`
      : `<div class="logo">${s.ic}</div>`;
    $("introT").textContent = s.title || t(s.t);
    $("introD").textContent = t(s.d);
    $("introdots").textContent = this.islides
      .map((_, j) => (j === this.ipos ? "●" : "○"))
      .join(" ");
    $("introgo").textContent = t(
      this.ipos === this.islides.length - 1 ? "introGo" : "introNext",
    );
  }
  introNext() {
    if (++this.ipos < this.islides.length) return this.renderIntro();
    Save.data.seen[this.istage] = 1;
    Save.save();
    this.hide("intro");
  }
  end(win) {
    // save the result, show stars + newly unlocked tower
    const g = this.game,
      L = g.level,
      before = Save.towers(),
      bs = Save.spells(),
      stars = Save.record(g.levelIdx, win, g.wave, g.hp / START_HP, g.kills),
      after = Save.towers();
    let h = `<p>${t("stage")} ${g.levelIdx + 1}: ${L.name[i18n.lang]}</p><p>${t("reached")} ${g.wave}/${L.waves}</p>`;
    if (win) {
      h += `<div class="stars big">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</div>`;
      for (const k of after)
        if (!before.has(k))
          h += `<div class="gi"><img class="th" src="${thumb("tower", k, 1)}" alt=""><div><b>🎁 ${t("towerUnlocked")}: ${t(k)}</b><p>${t("tw_" + k)}</p></div></div>`;
      for (const k of Save.spells())
        if (!bs.has(k))
          h += `<div class="gi"><div class="logo">${SPELLS[k].icon}</div><div><b>🎁 ${t("spellUnlocked")}: ${t("sp_" + k)}</b><p>${t("d_" + k)}</p></div></div>`;
      if (g.levelIdx + 1 >= LEVELS.length) h += `<p>${t("allDone")}</p>`;
    }
    $("overtitle").textContent = t(win ? "win" : "over");
    $("overtxt").innerHTML = h;
    $("overnext").style.display =
      win && g.levelIdx + 1 < LEVELS.length ? "block" : "none";
    $("over").classList.remove("hidden");
  }
}
