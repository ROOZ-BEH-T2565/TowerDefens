// Drifting ambient particles per chapter: fireflies, dust, embers, rain, snow, ash (a single THREE.Points object).
import * as THREE from 'three';
let sprite;
const dotTex = () => {
  if (sprite) return sprite;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return (sprite = new THREE.CanvasTexture(c));
};
const KINDS = { fireflies: { n: 70, color: 0xd8ff7a, size: .17, add: true }, dust: { n: 90, color: 0xe8d2a0, size: .1 }, embers: { n: 110, color: 0xff8a3a, size: .14, add: true },
  rain: { n: 260, color: 0xbcd4ff, size: .06 }, snow: { n: 220, color: 0xffffff, size: .12 }, ash: { n: 110, color: 0x9a8a8a, size: .1 } };
export class Ambient {
  constructor(scene, kind) {
    const K = KINDS[kind] || KINDS.fireflies; Object.assign(this, { scene, kind, n: K.n, add: !!K.add });
    this.p = new Float32Array(K.n * 3); this.v = new Float32Array(K.n * 3); this.ph = new Float32Array(K.n);
    for (let i = 0; i < K.n; i++) this.spawn(i, true);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(this.p, 3));
    const col = new THREE.Color(K.color); if (K.add) col.multiplyScalar(1.8); // >1 so the bloom pass makes glowing particles shine
    this.mat = new THREE.PointsMaterial({ map: dotTex(), color: col, size: K.size, transparent: true, depthWrite: false, opacity: .85, blending: K.add ? THREE.AdditiveBlending : THREE.NormalBlending });
    this.pts = new THREE.Points(geo, this.mat); this.pts.frustumCulled = false; scene.add(this.pts);
  }
  spawn(i, init) {
    const k = this.kind, p = this.p, v = this.v, j = i * 3, R = Math.random;
    p[j] = (R() - .5) * 20; p[j + 2] = (R() - .5) * 20; this.ph[i] = R() * 6.28;
    if (k === 'rain') { p[j + 1] = init ? R() * 9 : 9; v[j] = -.6; v[j + 1] = -9 - R() * 3; v[j + 2] = 0; }
    else if (k === 'snow') { p[j + 1] = init ? R() * 8 : 8; v[j] = (R() - .5) * .3; v[j + 1] = -.5 - R() * .5; v[j + 2] = 0; }
    else if (k === 'ash') { p[j + 1] = init ? R() * 6 : 6; v[j] = .15; v[j + 1] = -.25 - R() * .2; v[j + 2] = 0; }
    else if (k === 'embers') { p[j + 1] = init ? R() * 5 : 0; v[j] = (R() - .5) * .25; v[j + 1] = .35 + R() * .5; v[j + 2] = 0; }
    else if (k === 'dust') { p[j + 1] = .1 + R() * 1.2; v[j] = .5 + R() * .4; v[j + 1] = 0; v[j + 2] = (R() - .5) * .1; }
    else { p[j + 1] = .2 + R() * 1.5; v[j] = v[j + 1] = v[j + 2] = 0; } // fireflies wander
  }
  update(dt) {
    const t = performance.now() / 1000, k = this.kind, p = this.p, v = this.v;
    for (let i = 0; i < this.n; i++) {
      const j = i * 3, ph = this.ph[i];
      if (k === 'fireflies') { p[j] += Math.sin(t * .6 + ph) * dt * .5; p[j + 1] += Math.cos(t * .9 + ph * 2) * dt * .25; p[j + 2] += Math.sin(t * .5 + ph * 3) * dt * .5; }
      else { p[j] += v[j] * dt + (k === 'snow' || k === 'ash' || k === 'embers' ? Math.sin(t + ph) * dt * .3 : 0); p[j + 1] += v[j + 1] * dt; p[j + 2] += v[j + 2] * dt; }
      if (p[j + 1] < 0 && (k === 'rain' || k === 'snow' || k === 'ash')) this.spawn(i, false);
      else if (p[j + 1] > 5 && k === 'embers') this.spawn(i, false);
      if (p[j] > 10) p[j] = -10; else if (p[j] < -10) p[j] = 10;
    }
    this.pts.geometry.attributes.position.needsUpdate = true;
    if (k === 'fireflies') this.mat.opacity = .65 + .3 * Math.sin(t * 3);
  }
  dispose() { this.scene.remove(this.pts); this.pts.geometry.dispose(); this.mat.dispose(); }
}
