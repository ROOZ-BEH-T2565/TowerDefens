// Three.js scene: PBR lighting, environment reflections + bloom (loaded lazily), terrain textures, ambient particles,
// auto-fit camera with smooth zoom / pan, screen shake.
import * as THREE from "three";
import { Ambient } from "./ambient.js";
import { terrainTextures } from "./textures.js";
export class Scene3D {
  constructor(el) {
    Object.assign(this, {
      el,
      shake: 0,
      k: 1.5,
      gcol: [0x15301f, 0x9fd08a],
      dark: true,
      zoom: 1,
      zt: 1,
      panX: 0,
      panZ: 0,
      ptx: 0,
      ptz: 0,
      bloomOn: true,
      comp: null,
      ambient: null,
      gstyle: "grass",
    });
    this.r = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.r.shadowMap.enabled = true;
    this.r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.r.toneMapping = THREE.ACESFilmicToneMapping;
    this.r.toneMappingExposure = 1.15;
    el.prepend(this.r.domElement);
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(40, 1, 0.1, 120);
    this.hemi = new THREE.HemisphereLight(0xcfe0ff, 0x2a3a2a, 0.55);
    this.scene.add(this.hemi);
    const sun = new THREE.DirectionalLight(0xfff1dc, 2.1);
    sun.position.set(6, 12, 5);
    sun.castShadow = true;
    this.sun = sun;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    Object.assign(sun.shadow.camera, {
      left: -9,
      right: 9,
      top: 9,
      bottom: -9,
    });
    sun.shadow.camera.updateProjectionMatrix();
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0x8fb4ff, 0.5);
    rim.position.set(-6, 5, -8);
    this.scene.add(rim); // cool back light for depth
    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ roughness: 1, envMapIntensity: 0.3 }),
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -0.12;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
    this.scene.fog = new THREE.Fog(0, 30, 70);
    this.setGround(this.gcol, "grass");
    this.resize();
    new ResizeObserver(() => this.resize()).observe(el); // follows the container (phone rotation...)
    this.initAddons();
  }
  async initAddons() {
    // environment reflections + bloom; the game still runs without them if the CDN is unreachable
    try {
      const [
        { RoomEnvironment },
        { EffectComposer },
        { RenderPass },
        { UnrealBloomPass },
        { OutputPass },
      ] = await Promise.all([
        import("three/addons/environments/RoomEnvironment.js"),
        import("three/addons/postprocessing/EffectComposer.js"),
        import("three/addons/postprocessing/RenderPass.js"),
        import("three/addons/postprocessing/UnrealBloomPass.js"),
        import("three/addons/postprocessing/OutputPass.js"),
      ]);
      const pm = new THREE.PMREMGenerator(this.r);
      this.scene.environment = pm.fromScene(
        new RoomEnvironment(),
        0.04,
      ).texture;
      pm.dispose();
      this.comp = new EffectComposer(this.r);
      this.comp.addPass(new RenderPass(this.scene, this.cam));
      this.bloom = new UnrealBloomPass(
        new THREE.Vector2(256, 256),
        0.6,
        0.5,
        1.0,
      );
      this.comp.addPass(this.bloom);
      this.comp.addPass(new OutputPass());
      this.resize();
      this.setGround(this.gcol, this.gstyle);
    } catch (e) {
      console.warn(
        "Graphics add-ons unavailable (basic rendering is used):",
        e,
      );
      this.comp = null;
    }
  }
  setAmbient(kind) {
    if (this.ambient) this.ambient.dispose();
    this.ambient = kind ? new Ambient(this.scene, kind) : null;
  }
  setGround(cols, style = "grass") {
    // per-level ground colours + texture
    this.gcol = cols;
    this.gstyle = style;
    this.ground.material.map = terrainTextures(style).ground;
    this.ground.material.needsUpdate = true;
    if (this.bloom) this.bloom.threshold = style === "snow" ? 1.7 : 1.0; // bright snow must not bloom
    this.setTheme(this.dark);
  }
  zoomBy(f) {
    this.zt = Math.min(1.15, Math.max(0.45, this.zt * f));
    this.clampPan();
  } // wheel / pinch / buttons (eased in update)
  resetView(smooth) {
    this.zt = 1;
    this.ptx = this.ptz = 0;
    if (!smooth) {
      this.zoom = 1;
      this.panX = this.panZ = 0;
    }
  }
  clampPan() {
    const L = 8 * Math.max(0, 1 - this.zt);
    this.ptx = Math.max(-L, Math.min(L, this.ptx));
    this.ptz = Math.max(-L, Math.min(L, this.ptz));
  }
  pan(dx, dy) {
    // drag the map (only possible when zoomed in)
    const D = 16.3 * this.k * this.zoom,
      hv = 2 * D * Math.tan(THREE.MathUtils.degToRad(20)),
      W = this.el.clientWidth || 1,
      H = this.el.clientHeight || 1;
    this.ptx -= (dx * hv * this.cam.aspect) / W;
    this.ptz -= (dy * hv) / H / 0.737;
    this.clampPan();
  }
  setQuality(hi) {
    this.sun.castShadow = hi;
    this.bloomOn = hi;
    this.r.setPixelRatio(hi ? Math.min(window.devicePixelRatio || 1, 2) : 1);
    this.resize();
  }
  setTheme(dark) {
    this.dark = dark;
    const c = dark ? 0x0b1020 : 0xdfe9ff;
    this.scene.background = new THREE.Color(c);
    this.scene.fog.color.set(c);
    this.ground.material.color.set(dark ? this.gcol[0] : this.gcol[1]);
    this.hemi.intensity = dark ? 0.55 : 0.8;
  }
  resize() {
    const w = this.el.clientWidth || 1,
      h = this.el.clientHeight || 1;
    this.r.setSize(w, h, false);
    this.cam.aspect = w / h;
    this.cam.updateProjectionMatrix();
    if (this.comp) {
      this.comp.setPixelRatio(this.r.getPixelRatio());
      this.comp.setSize(w, h);
    }
    // find the closest camera distance at which the whole board (corners + tower height) fits on screen
    const pts = [];
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        pts.push(
          new THREE.Vector3(sx * 6.4, 0, sz * 6.4),
          new THREE.Vector3(sx * 6.4, 1.8, sz * 6.4),
        );
    let k = 0.7;
    for (; k < 8; k += 0.04) {
      this.cam.position.set(0, 12 * k, 11 * k);
      this.cam.lookAt(0, 0, 0);
      this.cam.updateMatrixWorld();
      if (
        pts.every((p) => {
          const v = p.clone().project(this.cam);
          return Math.abs(v.x) < 0.96 && Math.abs(v.y) < 0.92;
        })
      )
        break;
    }
    this.k = k;
  }
  update(dt) {
    this.shake = Math.max(0, this.shake - dt * 1.5);
    const a = 1 - Math.exp(-dt * 12); // exponential easing = frame-rate independent smoothing
    this.zoom += (this.zt - this.zoom) * a;
    this.panX += (this.ptx - this.panX) * a;
    this.panZ += (this.ptz - this.panZ) * a;
    this.ambient?.update(dt);
    const s = this.shake,
      k = this.k,
      m = this.zoom,
      tx = this.panX,
      tz = this.panZ;
    this.cam.position.set(
      tx + (Math.random() - 0.5) * s,
      12 * k * m + (Math.random() - 0.5) * s,
      tz + 11 * k * m,
    );
    this.cam.lookAt(tx, 0, tz);
    if (this.comp && this.bloomOn) {
      try {
        this.comp.render();
        return;
      } catch (e) {
        console.warn("bloom disabled", e);
        this.bloomOn = false;
      }
    }
    this.r.render(this.scene, this.cam);
  }
}
