// Three.js scene, camera, lights, renderer, resize and screen shake.
import * as THREE from "three";
export class Scene3D {
  constructor(el) {
    this.el = el;
    this.shake = 0;
    this.r = new THREE.WebGLRenderer({ antialias: true });
    this.r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.r.shadowMap.enabled = true;
    this.r.shadowMap.type = THREE.PCFSoftShadowMap;
    el.prepend(this.r.domElement);
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    this.scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x223344, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 1.7);
    sun.position.set(6, 12, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -9,
      right: 9,
      top: 9,
      bottom: -9,
    });
    sun.shadow.camera.updateProjectionMatrix();
    this.scene.add(sun);
    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ roughness: 1 }),
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -0.12;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
    this.scene.fog = new THREE.Fog(0, 22, 45);
    this.setTheme(true);
    this.resize();
    addEventListener("resize", () => this.resize());
  }
  setTheme(dark) {
    const c = dark ? 0x0b1020 : 0xdfe9ff;
    this.scene.background = new THREE.Color(c);
    this.scene.fog.color.set(c);
    this.ground.material.color.set(dark ? 0x10172e : 0xc3d2f0);
  }
  resize() {
    const w = this.el.clientWidth || 1,
      h = this.el.clientHeight || 1;
    this.r.setSize(w, h);
    this.cam.aspect = w / h;
    this.cam.updateProjectionMatrix();
    this.k = Math.max(1, 1.05 / this.cam.aspect); // pull back on portrait screens so the board fits
  }
  update(dt) {
    this.shake = Math.max(0, this.shake - dt * 1.5);
    const s = this.shake,
      k = this.k;
    this.cam.position.set(
      (Math.random() - 0.5) * s,
      12 * k + (Math.random() - 0.5) * s,
      11 * k,
    );
    this.cam.lookAt(0, 0, 0);
    this.r.render(this.scene, this.cam);
  }
}
