// Procedural terrain textures (canvas) with matching bump maps. Light neutral colours so the theme colour tints them.
import * as THREE from "three";
const cache = {};
function paint(ctx, n, style, role, seed, bump) {
  let s = seed;
  const r = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const D = (a) => (bump ? `rgba(0,0,0,${a * 2.2})` : `rgba(0,0,0,${a})`),
    L = (a) =>
      bump ? `rgba(255,255,255,${a * 2.2})` : `rgba(255,255,255,${a})`;
  ctx.fillStyle = bump ? "#808080" : "#e9e9e9";
  ctx.fillRect(0, 0, n, n);
  const many = (c, fn) => {
    for (let i = 0; i < c; i++) fn(r() * n, r() * n);
  };
  const line = (x, y, len, ang, col, w) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  };
  const blob = (x, y, rad, col) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, col);
    g.addColorStop(1, "rgba(128,128,128,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  };
  many(900, (x, y) => {
    ctx.fillStyle = r() < 0.5 ? D(0.07) : L(0.1);
    ctx.fillRect(x, y, 1 + r() * 2, 1 + r() * 2);
  }); // fine grain
  if (style === "grass" && role === "tile")
    many(320, (x, y) =>
      line(
        x,
        y,
        5 + r() * 8,
        -1.2 - r() * 0.6,
        r() < 0.5 ? D(0.16) : L(0.22),
        1.2,
      ),
    ); // blades
  else if (style === "sand") {
    for (let y = 8; y < n; y += 13) {
      ctx.strokeStyle = D(role === "path" ? 0.12 : 0.07);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= n; x += 8)
        ctx.lineTo(x, y + Math.sin(x * 0.08 + y) * 3);
      ctx.stroke();
    }
  } else if (style === "lava" || style === "ash") {
    many(26, (x, y) => {
      let a = r() * 6.28;
      for (let k = 0; k < 7; k++) {
        const l = 8 + r() * 14;
        line(x, y, l, a, D(0.4), 2);
        x += Math.cos(a) * l;
        y += Math.sin(a) * l;
        a += (r() - 0.5) * 1.2;
      }
    });
  } else if (style === "slate") {
    for (let y = 0, row = 0; y < n; y += 64, row++) {
      ctx.fillStyle = D(0.22);
      ctx.fillRect(0, y, n, 3);
      for (let x = (row % 2) * 32; x < n; x += 64) ctx.fillRect(x, y, 3, 64);
    }
    many(14, (x, y) => blob(x, y, 30, D(0.1)));
  } else if (style === "snow") {
    many(14, (x, y) => blob(x, y, 40, role === "path" ? D(0.12) : L(0.3)));
    many(120, (x, y) => {
      ctx.fillStyle = L(0.9);
      ctx.fillRect(x, y, 1.5, 1.5);
    });
    if (role === "path")
      many(40, (x, y) => line(x, y, 10 + r() * 20, r() * 6.28, L(0.35), 1));
  }
  if (style === "grass" && role === "path") {
    many(60, (x, y) => {
      ctx.fillStyle = r() < 0.5 ? D(0.2) : L(0.25);
      ctx.beginPath();
      ctx.ellipse(x, y, 3 + r() * 4, 2 + r() * 3, r() * 3, 0, 6.28);
      ctx.fill();
    });
  }
  if (role === "path" && style !== "grass" && style !== "sand")
    many(50, (x, y) => {
      ctx.fillStyle = D(0.18);
      ctx.beginPath();
      ctx.ellipse(x, y, 2 + r() * 4, 2 + r() * 3, r() * 3, 0, 6.28);
      ctx.fill();
    });
}
function make(style, role, seed, bump) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  paint(c.getContext("2d"), 256, style, role, seed, bump);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  if (!bump) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export function terrainTextures(style = "grass") {
  if (cache[style]) return cache[style];
  const tile = make(style, "tile", 11, false),
    ground = tile.clone();
  ground.wrapS = ground.wrapT = THREE.RepeatWrapping;
  ground.repeat.set(26, 26);
  ground.needsUpdate = true;
  return (cache[style] = {
    tile,
    tileBump: make(style, "tile", 11, true),
    path: make(style, "path", 29, false),
    pathBump: make(style, "path", 29, true),
    ground,
  });
}
