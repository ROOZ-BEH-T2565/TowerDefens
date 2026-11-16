// Zero-dependency server: serves the game files AND relays WebSocket messages for LAN multiplayer (2-4 players).
// Run:  node server/server.js   then open http://<this-computer-ip>:8080 on every device in the same network.
const http = require("http"),
  fs = require("fs"),
  path = require("path"),
  crypto = require("crypto"),
  os = require("os");
const ROOT = path.join(__dirname, ".."),
  PORT = +process.env.PORT || 8080,
  MAX_PLAYERS = 4;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

// ---------- static files ----------
const server = http.createServer((req, res) => {
  let p;
  try {
    p = decodeURIComponent(req.url.split("?")[0]);
  } catch (e) {
    res.writeHead(400);
    return res.end();
  }
  if (p === "/") p = "/index.html";
  const f = path.normalize(path.join(ROOT, p));
  if (!f.startsWith(ROOT) || f.startsWith(path.join(ROOT, "server"))) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(f, (e, d) => {
    if (e) {
      res.writeHead(404);
      return res.end("Not found");
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(f)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(d);
  });
});

// ---------- minimal WebSocket (RFC 6455) ----------
const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
function frame(payload, op = 1) {
  const p = Buffer.isBuffer(payload) ? payload : Buffer.from(payload),
    n = p.length;
  let h;
  if (n < 126) h = Buffer.from([0x80 | op, n]);
  else if (n < 65536) {
    h = Buffer.alloc(4);
    h[0] = 0x80 | op;
    h[1] = 126;
    h.writeUInt16BE(n, 2);
  } else {
    h = Buffer.alloc(10);
    h[0] = 0x80 | op;
    h[1] = 127;
    h.writeBigUInt64BE(BigInt(n), 2);
  }
  return Buffer.concat([h, p]);
}
const send = (c, data, op = 1) => {
  if (!c.socket.destroyed) c.socket.write(frame(data, op));
};
const sendJ = (c, o) => send(c, JSON.stringify(o));
function parse(c) {
  for (;;) {
    const b = c.buf;
    if (b.length < 2) return;
    const fin = !!(b[0] & 0x80),
      op = b[0] & 15,
      masked = !!(b[1] & 0x80);
    let len = b[1] & 127,
      off = 2;
    if (len === 126) {
      if (b.length < 4) return;
      len = b.readUInt16BE(2);
      off = 4;
    } else if (len === 127) {
      if (b.length < 10) return;
      len = Number(b.readBigUInt64BE(2));
      off = 10;
    }
    if (len > 4e6) {
      c.socket.destroy();
      return;
    }
    if (masked) off += 4;
    if (b.length < off + len) return;
    let payload = Buffer.from(b.subarray(off, off + len));
    if (masked) {
      const m = b.subarray(off - 4, off);
      for (let i = 0; i < payload.length; i++) payload[i] ^= m[i & 3];
    }
    c.buf = b.subarray(off + len);
    if (op === 8) {
      c.socket.end();
      return;
    }
    if (op === 9) {
      send(c, payload, 10);
      continue;
    }
    if (op === 10) continue;
    c.frag.push(payload);
    if (!fin) continue;
    const text = Buffer.concat(c.frag).toString("utf8");
    c.frag = [];
    try {
      handle(c, text);
    } catch (e) {
      console.error("handler error", e);
    }
  }
}
server.on("upgrade", (req, socket) => {
  const key = req.headers["sec-websocket-key"];
  if (req.url.split("?")[0] !== "/ws" || !key) {
    socket.destroy();
    return;
  }
  socket.write(
    "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " +
      crypto
        .createHash("sha1")
        .update(key + GUID)
        .digest("base64") +
      "\r\n\r\n",
  );
  socket.setNoDelay(true);
  const c = {
    socket,
    buf: Buffer.alloc(0),
    frag: [],
    room: null,
    id: -1,
    name: "",
  };
  socket.on("data", (d) => {
    c.buf = Buffer.concat([c.buf, d]);
    parse(c);
  });
  socket.on("close", () => leave(c));
  socket.on("error", () => socket.destroy());
});

// ---------- rooms ----------
const rooms = new Map();
const clean = (s) =>
  String(s || "Player")
    .replace(/[<>&"']/g, "")
    .slice(0, 14) || "Player";
function newCode() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  for (;;) {
    let s = "";
    for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)];
    if (!rooms.has(s)) return s;
  }
}
const roster = (r) => r.players.map((p) => ({ id: p.id, name: p.name }));
const lobby = (r) =>
  r.players.forEach((p) =>
    sendJ(p, {
      t: "lobby",
      code: r.code,
      started: r.started,
      players: roster(r),
    }),
  );
function leave(c) {
  const r = c.room;
  if (!r) return;
  c.room = null;
  r.players = r.players.filter((p) => p !== c);
  if (c.id === 0) {
    r.players.forEach((p) => {
      sendJ(p, { t: "closed" });
      p.room = null;
    });
    rooms.delete(r.code);
    return;
  } // host left: close the room
  const h = r.players.find((p) => p.id === 0);
  if (h) sendJ(h, { t: "left", id: c.id });
  if (!r.started) lobby(r);
}
function handle(c, text) {
  let m;
  try {
    m = JSON.parse(text);
  } catch (e) {
    return;
  }
  const r = c.room;
  switch (m.t) {
    case "create": {
      leave(c);
      const room = { code: newCode(), players: [c], started: false };
      rooms.set(room.code, room);
      c.room = room;
      c.id = 0;
      c.name = clean(m.name);
      sendJ(c, { t: "created", code: room.code, id: 0 });
      lobby(room);
      break;
    }
    case "join": {
      leave(c);
      const room = rooms.get(
        String(m.code || "")
          .toUpperCase()
          .trim(),
      );
      if (!room) return sendJ(c, { t: "err", msg: "noroom" });
      if (room.started) return sendJ(c, { t: "err", msg: "started" });
      if (room.players.length >= MAX_PLAYERS)
        return sendJ(c, { t: "err", msg: "full" });
      let id = 1;
      while (room.players.some((p) => p.id === id)) id++;
      c.room = room;
      c.id = id;
      c.name = clean(m.name);
      room.players.push(c);
      sendJ(c, { t: "joined", code: room.code, id });
      lobby(room);
      break;
    }
    case "start":
      if (r && c.id === 0 && !r.started) {
        r.started = true;
        const out = { t: "start", cfg: m.cfg, players: roster(r) };
        r.players.forEach((p) => sendJ(p, out));
      }
      break;
    case "cmd":
      if (r && c.id !== 0) {
        const h = r.players.find((p) => p.id === 0);
        if (h) sendJ(h, { t: "cmd", from: c.id, d: m.d });
      }
      break;
    case "s":
      if (r && c.id === 0)
        r.players.forEach((p) => {
          if (p !== c) send(p, text);
        });
      break; // snapshots are relayed verbatim
  }
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    "\nTower Defense 3D server is running.\n  This computer:  http://localhost:" +
      PORT,
  );
  for (const list of Object.values(os.networkInterfaces()))
    for (const i of list || [])
      if (i.family === "IPv4" && !i.internal)
        console.log("  Other devices:  http://" + i.address + ":" + PORT);
  console.log(
    "\nOpen the address on every device (same Wi-Fi / LAN / phone hotspot), then use the Multiplayer menu.\n",
  );
});
