// Multiplayer (co-op, 2-4 players over a LAN / Wi-Fi / hotspot through server/server.js).
//  Net        - WebSocket connection + lobby messages
//  NetHost    - the host runs the normal Game; it applies the players' commands and broadcasts snapshots (15/s)
//  RemoteGame - clients run no simulation: they mirror the host's snapshots with the same 3D objects and send commands
import * as THREE from "three";
import { TOWERS, SPELLS } from "./config.js";
import { Game } from "./game.js";
import { Enemy } from "./enemy.js";
import { Tower } from "./tower.js";
import { soldierModel } from "./soldier.js";
import { wp } from "./grid.js";
const r2 = (v) => Math.round(v * 100) / 100,
  int = (v, a, b) => Math.max(a, Math.min(b, v | 0));

export class Net {
  constructor(ui) {
    this.ui = ui;
    this.ws = null;
    this.role = null;
    this.id = -1;
    this.code = "";
    this.players = [];
    this.host = null;
  }
  get active() {
    return !!this.ws && this.ws.readyState === 1;
  }
  connect(addr) {
    return new Promise((res, rej) => {
      let ws;
      try {
        ws = new WebSocket(`ws://${addr}/ws`);
      } catch (e) {
        return rej(e);
      }
      const timer = setTimeout(() => {
        try {
          ws.close();
        } catch (e) {
          /* ignore */
        }
        rej(new Error("timeout"));
      }, 5000);
      ws.onopen = () => {
        clearTimeout(timer);
        this.ws = ws;
        res();
      };
      ws.onerror = () => {
        clearTimeout(timer);
        rej(new Error("connect"));
      };
      ws.onmessage = (e) => {
        try {
          this.recv(JSON.parse(e.data));
        } catch (err) {
          console.error(err);
        }
      };
      ws.onclose = () => {
        if (this.ws === ws) {
          this.ws = null;
          this.ui.netClosed("lost");
        }
      };
    });
  }
  send(o) {
    if (this.active) this.ws.send(JSON.stringify(o));
  }
  create(name) {
    this.send({ t: "create", name });
  }
  join(code, name) {
    this.send({ t: "join", code, name });
  }
  start(cfg) {
    this.send({ t: "start", cfg });
  }
  cmd(d) {
    this.send({ t: "cmd", d });
  }
  close() {
    this.detachHost();
    const ws = this.ws;
    this.ws = null;
    this.role = null;
    this.code = "";
    this.players = [];
    try {
      ws && ws.close();
    } catch (e) {
      /* ignore */
    }
  }
  detachHost() {
    if (this.host) {
      this.host.detach();
      this.host = null;
    }
  }
  recv(m) {
    switch (m.t) {
      case "created":
        this.role = "host";
        this.id = 0;
        this.code = m.code;
        this.ui.renderLobby();
        break;
      case "joined":
        this.role = "client";
        this.id = m.id;
        this.code = m.code;
        this.ui.renderLobby();
        break;
      case "lobby":
        this.players = m.players;
        this.ui.renderLobby();
        break;
      case "start":
        this.players = m.players;
        this.ui.netStart(m.cfg, m.players);
        break;
      case "cmd":
        if (this.host) this.host.onCmd(m.from, m.d);
        break;
      case "s":
        if (this.ui.game.remote) this.ui.game.applySnap(m);
        break;
      case "left":
        this.players = this.players.filter((p) => p.id !== m.id);
        this.ui.netLeft(m.id);
        break;
      case "closed":
        this.ui.netClosed("host");
        break;
      case "err":
        this.ui.netError(m.msg);
        break;
    }
  }
}

export class NetHost {
  constructor(net, game) {
    Object.assign(this, { net, game, ev: [], acc: 0, seq: 0, undo: [] });
    game.net = this;
    game.mp = true;
    const wrap = (o, n, f) => {
      const orig = o[n];
      this.undo.push(() => {
        o[n] = orig;
      });
      o[n] = (...a) => {
        f(...a);
        return orig.apply(o, a);
      };
    };
    const q = (...a) => {
      if (this.ev.length < 60) this.ev.push(a);
    };
    wrap(game.audio, "play", (n, v) => {
      if (n !== "hit" && n !== "click") q("snd", n, v || null);
    }); // every sound is replayed on the clients
    wrap(game.fx, "ring", (p, c, r) => q("ring", r2(p.x), r2(p.z), c, r));
    wrap(game.fx, "ball", (p, c, r) => q("ball", r2(p.x), r2(p.z), c, r));
    wrap(game.fx, "bolt", (p) => q("bolt", r2(p.x), r2(p.z)));
    wrap(game.fx, "mark", (p, c, r, l) => q("mark", r2(p.x), r2(p.z), c, r, l));
    wrap(game.fx, "debris", (p, c, n) => q("dbr", r2(p.x), r2(p.z), c, n || 8));
    wrap(game.fx, "beam", (a, b, c) =>
      q("beam", r2(a.x), r2(a.y), r2(a.z), r2(b.x), r2(b.y), r2(b.z), c),
    );
  }
  detach() {
    this.undo.forEach((f) => f());
    this.undo = [];
    this.game.net = null;
    this.game.mp = false;
  }
  onCmd(from, d) {
    // commands from the other players (the host's own UI calls the game directly)
    const g = this.game;
    if (!d || g.over) return;
    try {
      switch (d.c) {
        case "build":
          if (TOWERS[d.type])
            g.build(d.type, int(d.x, 0, 11), int(d.y, 0, 11), from);
          break;
        case "up": {
          const w = g.grid.occ.get(int(d.x, 0, 11) + "," + int(d.y, 0, 11));
          if (w && w.type) g.upgrade(w);
          break;
        }
        case "sell": {
          const w = g.grid.occ.get(int(d.x, 0, 11) + "," + int(d.y, 0, 11));
          if (w && w.type && g.towers.includes(w)) g.sell(w);
          break;
        }
        case "wave":
          g.startWave(true);
          break;
        case "cast":
          if (["bolt", "meteor", "freeze", "repair"].includes(d.k))
            g.cast(d.k, int(d.x, 0, 11), int(d.y, 0, 11));
          break;
        case "buy":
          if (SPELLS[d.k]) g.buySpell(d.k);
          break;
        case "fix":
          g.repairSweeper();
          break;
        case "rot":
          if (g.sweeper.enabled && g.sweeper.repaired)
            g.sweeper.rotate(d.v > 0 ? 1 : -1);
          break;
      }
    } catch (e) {
      console.error("command failed", e);
    }
  }
  tick(dt) {
    this.acc += dt;
    if (this.acc < 0.066) return;
    this.acc = 0;
    this.net.send({ t: "s", ...this.snapshot() });
  }
  snapshot() {
    const g = this.game,
      sw = g.sweeper,
      so = [];
    g.towers.forEach(
      (w) =>
        w.slots &&
        w.slots.forEach((sl) => {
          if (sl.s)
            so.push([
              r2(sl.s.g.position.x),
              r2(sl.s.g.position.z),
              r2(sl.s.g.rotation.y),
              r2(Math.max(0, sl.s.hp) / sl.s.max),
            ]);
        }),
    );
    return {
      k: ++this.seq,
      st: [
        g.gold,
        g.hp,
        g.maxHp,
        g.wave,
        g.state === "wave" ? 1 : 0,
        r2(g.timer),
        Math.floor(g.charge),
        g.spells.freeze,
        g.spells.meteor,
        g.spells.repair,
        r2(g.sc.shake),
        g.over ? 1 : 0,
        g.kills,
        r2(g.waveProgress()),
      ],
      en: g.enemies
        .filter((e) => !e.dead)
        .map((e) => [
          e.id,
          e.type,
          r2(e.g.position.x),
          r2(e.g.position.z),
          r2(e.g.rotation.y),
          r2(Math.max(e.hp, 0) / e.max),
          (e.slow > 0 ? 1 : 0) |
            (e.stun > 0 ? 2 : 0) |
            (e.healT > 0 ? 4 : 0) |
            (e.dots.burn ? 8 : 0) |
            (e.dots.poison ? 16 : 0) |
            (e.shield > 0 ? 32 : 0) |
            (e.auraT > 0 ? 64 : 0),
        ]),
      tw: g.towers.map((w) => [
        w.x,
        w.y,
        w.type,
        w.level,
        Math.ceil(w.hp),
        w.stun > 0 ? 1 : 0,
        r2(w.aim || 0),
        w.owner,
      ]),
      so,
      sw: sw.enabled
        ? [sw.repaired ? 1 : 0, r2(sw.angle), Math.ceil(sw.hp), sw.cost]
        : null,
      ev: this.ev.splice(0, 40),
    };
  }
}

export class RemoteGame extends Game {
  constructor(sc, grid, audio) {
    super(sc, grid, audio);
    Object.assign(this, {
      remote: true,
      emap: new Map(),
      tmap: new Map(),
      so: [],
      wprog: 0,
      conn: null,
      gold: 0,
      hp: 1,
      maxHp: 1,
      wave: 0,
      state: "countdown",
      timer: 0,
      kills: 0,
      charge: 0,
      spells: { freeze: 0, meteor: 0, repair: 0 },
    });
  }
  clearWorld() {
    super.clearWorld();
    this.emap.clear();
    this.tmap.clear();
    (this.so || []).forEach((m) => {
      this.sc.scene.remove(m);
      m.traverse((o) => {
        o.geometry?.dispose();
        o.material?.dispose();
      });
    });
    this.so = [];
  }
  waveProgress() {
    return this.wprog;
  }
  removeTower(w) {
    this.tmap.delete(w.x + "," + w.y);
    this.towers.splice(this.towers.indexOf(w), 1);
    this.grid.occ.delete(w.x + "," + w.y);
    w.dispose();
  }
  update(dt) {
    // no simulation: ease the mirrored objects toward the latest snapshot
    if (!this.level || !this.sweeper) return;
    const k = 1 - Math.exp(-dt * 14),
      cam = this.sc.cam;
    for (const e of this.enemies) {
      const p = e.g.position;
      p.x += (e.tx - p.x) * k;
      p.z += (e.tz - p.z) * k;
      e.visual(dt, cam, this);
    }
    for (const w of this.towers) w.visual(dt, cam);
    for (const m of this.so)
      if (m.visible) {
        m.position.x += (m.tx - m.position.x) * k;
        m.position.z += (m.tz - m.position.z) * k;
        let da = m.ry - m.rotation.y;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        m.rotation.y += da * Math.min(1, dt * 12);
      }
    this.fx.update(dt);
    this.sweeper.update(dt, this);
    this.updDying(dt);
    for (let i = this.ruins.length - 1; i >= 0; i--) {
      const r = this.ruins[i];
      r.t -= dt;
      if (r.t < 0.5) r.g.scale.setScalar(Math.max(0.01, r.t / 0.5));
      if (r.t <= 0) {
        this.dropRuin(r.g);
        this.ruins.splice(i, 1);
      }
    }
  }
  applySnap(s) {
    if (!this.level || !this.sweeper) return;
    const st = s.st;
    Object.assign(this, {
      gold: st[0],
      hp: st[1],
      maxHp: st[2],
      wave: st[3],
      state: st[4] ? "wave" : "countdown",
      timer: st[5],
      charge: st[6],
      spells: { freeze: st[7], meteor: st[8], repair: st[9] },
      kills: st[12],
      wprog: st[13],
    });
    this.sc.shake = Math.max(this.sc.shake, st[10]);
    const seen = new Set();
    for (const [id, type, x, z, ry, hr, fl] of s.en) {
      // enemies
      seen.add(id);
      let e = this.emap.get(id);
      if (!e) {
        e = new Enemy(type, 1, this.grid.waypoints, this.sc.scene);
        e.id = id;
        e.max = 1;
        e.g.position.set(x, 0, z);
        e.g.rotation.y = ry;
        this.emap.set(id, e);
        this.enemies.push(e);
      }
      e.tx = x;
      e.tz = z;
      e.tr = ry;
      e.hp = hr;
      e.setBar();
      e.slow = fl & 1 ? 1 : 0;
      e.stun = fl & 2 ? 1 : 0;
      e.healT = fl & 4 ? 1 : 0;
      e.shield = fl & 32 ? 1 : 0;
      e.auraT = fl & 64 ? 1 : 0;
      e.dots = {};
      if (fl & 8) e.dots.burn = true;
      if (fl & 16) e.dots.poison = true;
    }
    for (const [id, e] of [...this.emap])
      if (!seen.has(id)) {
        // gone: died or reached the base
        this.emap.delete(id);
        this.enemies.splice(this.enemies.indexOf(e), 1);
        e.bar.visible = false;
        e.dying = 0.28;
        this.dying.push(e);
        this.fx.burst(e.g.position.clone().setY(0.4), e.c.color, 14, 3.5, 0.1);
      }
    const have = new Set();
    for (const [x, y, type, lv, hp, stun, aim, owner] of s.tw) {
      // towers
      const key = x + "," + y;
      have.add(key);
      let w = this.tmap.get(key);
      if (w && w.type !== type) {
        this.removeTower(w);
        w = null;
      }
      if (!w) {
        w = new Tower(type, x, y, wp(x, y), this.sc.scene);
        w.remote = true;
        if (this.mp) w.setOwner(owner);
        w.level = lv;
        w.build();
        w.pop = 0.35;
        w.popUp = false;
        w.g.scale.setScalar(0.02);
        this.tmap.set(key, w);
        this.towers.push(w);
        this.grid.occ.set(key, w);
        this.audio.play("build");
      } else if (w.level !== lv) {
        w.level = lv;
        w.build();
        w.pop = 0.35;
        w.popUp = true;
      }
      w.hp = hp;
      w.stun = stun ? 1 : 0;
      w.aim = aim;
    }
    for (const [key, w] of [...this.tmap])
      if (!have.has(key)) this.removeTower(w);
    if (s.sw && this.sweeper.enabled)
      this.sweeper.setState(!!s.sw[0], s.sw[1], s.sw[2], s.sw[3]);
    while (this.so.length < s.so.length) {
      const m = soldierModel();
      m.visible = false;
      this.sc.scene.add(m);
      this.so.push(m);
    } // barracks soldiers
    this.so.forEach((m, i) => {
      const a = s.so[i];
      m.visible = !!a;
      if (!a) return;
      if (m.tx === undefined) {
        m.position.set(a[0], 0, a[1]);
        m.rotation.y = a[2];
      }
      m.tx = a[0];
      m.tz = a[1];
      m.ry = a[2];
    });
    for (const v of s.ev) this.fxEvent(v);
    if (st[11] && !this.over) {
      this.over = true;
      this.ui.end(false);
    }
    this.ui.refresh();
    if (!document.getElementById("shop").classList.contains("hidden"))
      this.ui.renderShop();
  }
  fxEvent(v) {
    const fx = this.fx,
      P = (x, z, y = 0) => new THREE.Vector3(x, y, z);
    switch (v[0]) {
      case "snd":
        this.audio.play(v[1], v[2] || undefined);
        if (v[1] === "wind") this.sweeper.blast = 0.6;
        break;
      case "ring":
        fx.ring(P(v[1], v[2]), v[3], v[4]);
        break;
      case "ball":
        fx.ball(P(v[1], v[2], 0.5), v[3], v[4]);
        break;
      case "bolt":
        fx.bolt(P(v[1], v[2]));
        break;
      case "mark":
        fx.mark(P(v[1], v[2]), v[3], v[4], v[5]);
        break;
      case "dbr":
        fx.debris(P(v[1], v[2], 0.5), v[3], v[4]);
        break;
      case "beam":
        fx.beam(
          new THREE.Vector3(v[1], v[2], v[3]),
          new THREE.Vector3(v[4], v[5], v[6]),
          v[7],
        );
        break;
      case "sh":
        fx.beam(P(v[1], v[2], 0.6), P(v[3], v[4], 0.4), v[5]);
        break; // tower shot tracer
      case "ruin":
        this.ruins.push({
          g: Tower.broken(v[3], wp(v[1], v[2]), this.sc.scene),
          t: 3,
        });
        break;
      case "toast":
        this.ui.toast(v[1]);
        break;
      case "vig":
        this.ui.vignette();
        break;
      case "fl":
        this.ui.flash();
        break;
    }
  }
  // player actions become commands for the host
  cmd(d) {
    if (this.conn) this.conn.cmd(d);
  }
  build(type, x, y) {
    this.cmd({ c: "build", type, x, y });
    this.ui.select(null);
    return null;
  }
  upgrade(w) {
    this.cmd({ c: "up", x: w.x, y: w.y });
  }
  sell(w) {
    this.cmd({ c: "sell", x: w.x, y: w.y });
  }
  startWave() {
    this.cmd({ c: "wave" });
  }
  cast(kind, x, y) {
    this.cmd({ c: "cast", k: kind, x, y });
    return true;
  }
  buySpell(k) {
    this.cmd({ c: "buy", k });
  }
  repairSweeper() {
    this.cmd({ c: "fix" });
  }
  rotSweeper(v) {
    this.cmd({ c: "rot", v });
  }
}
