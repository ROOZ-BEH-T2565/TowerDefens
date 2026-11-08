// Three.js scene, camera, lights, renderer, auto-fit camera, resize and screen shake.
import * as THREE from 'three';
export class Scene3D {
  constructor(el) {
    this.el = el; this.shake = 0; this.k = 1.5;
    this.r = new THREE.WebGLRenderer({ antialias: true });
    this.r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.r.shadowMap.enabled = true; this.r.shadowMap.type = THREE.PCFSoftShadowMap;
    el.prepend(this.r.domElement);
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(40, 1, .1, 120);
    this.scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x223344, .9));
    const sun = new THREE.DirectionalLight(0xffffff, 1.7); sun.position.set(6, 12, 5); sun.castShadow = true; this.sun = sun;
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 });
    sun.shadow.camera.updateProjectionMatrix();
    this.scene.add(sun);
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ roughness: 1 }));
    this.ground.rotation.x = -Math.PI / 2; this.ground.position.y = -.12; this.ground.receiveShadow = true;
    this.scene.add(this.ground);
    this.scene.fog = new THREE.Fog(0, 30, 70);
    this.setTheme(true); this.resize();
    new ResizeObserver(() => this.resize()).observe(el); // follows the container (phone rotation, bottom panel...)
  }
  setQuality(hi) { this.sun.castShadow = hi; this.r.setPixelRatio(hi ? Math.min(window.devicePixelRatio || 1, 2) : 1); this.resize(); }
  setTheme(dark) {
    const c = dark ? 0x0b1020 : 0xdfe9ff;
    this.scene.background = new THREE.Color(c); this.scene.fog.color.set(c);
    this.ground.material.color.set(dark ? 0x15301f : 0x9fd08a);
  }
  resize() {
    const w = this.el.clientWidth || 1, h = this.el.clientHeight || 1;
    this.r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
    // find the closest camera distance at which the whole board (corners + tower height) fits on screen
    const pts = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) pts.push(new THREE.Vector3(sx * 6.4, 0, sz * 6.4), new THREE.Vector3(sx * 6.4, 1.8, sz * 6.4));
    let k = .7;
    for (; k < 8; k += .04) {
      this.cam.position.set(0, 12 * k, 11 * k); this.cam.lookAt(0, 0, 0); this.cam.updateMatrixWorld();
      if (pts.every(p => { const v = p.clone().project(this.cam); return Math.abs(v.x) < .96 && Math.abs(v.y) < .92; })) break;
    }
    this.k = k;
  }
  update(dt) {
    this.shake = Math.max(0, this.shake - dt * 1.5);
    const s = this.shake, k = this.k;
    this.cam.position.set((Math.random() - .5) * s, 12 * k + (Math.random() - .5) * s, 11 * k);
    this.cam.lookAt(0, 0, 0);
    this.r.render(this.scene, this.cam);
  }
}
