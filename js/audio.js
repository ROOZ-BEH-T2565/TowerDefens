// Procedural Web Audio sound manager. No external files.
import { SOUNDS } from './config.js';
export class AudioManager {
  constructor() {
    this.muted = localStorage.getItem('td_mute') === '1';
    this.vol = parseFloat(localStorage.getItem('td_vol') ?? '.6');
    this.ctx = null; this.voices = 0;
  }
  unlock() { // must run after a user gesture
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      const comp = this.ctx.createDynamicsCompressor(); // avoids clipping
      this.master.connect(comp); comp.connect(this.ctx.destination); this.apply();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  apply() { if (this.master) this.master.gain.value = this.muted ? 0 : this.vol; }
  setMuted(m) { this.muted = m; localStorage.setItem('td_mute', m ? '1' : '0'); this.apply(); }
  setVol(v) { this.vol = v; localStorage.setItem('td_vol', v); this.apply(); }
  tone(f0, f1, dur, type = 'sine', vol = .3, delay = 0) {
    const c = this.ctx, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + .02);
    this.voices++; o.onended = () => this.voices--;
  }
  noise(dur, vol, freq, delay = 0) {
    const c = this.ctx, t = c.currentTime + delay, n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buf; f.type = 'lowpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t);
    this.voices++; s.onended = () => this.voices--;
  }
  play(name, variant) { // e.g. play('build'), play('shoot','sniper')
    if (!this.ctx || this.muted || this.voices > 14) return;
    let r = SOUNDS[name]; if (variant) r = r[variant]; if (!r) return;
    for (const s of r) s[0] === 'n' ? this.noise(s[1], s[2], s[3], s[4] || 0) : this.tone(...s);
  }
}
