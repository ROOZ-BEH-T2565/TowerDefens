// Renders small preview images of towers and enemies (real 3D models) for the deck screen and the guide.
import * as THREE from 'three';
import { Tower } from './tower.js';
import { buildModel } from './enemy.js';
const cache = {}; let R, scene, cam;
function init() {
  R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  R.setSize(112, 112); R.setPixelRatio(1); R.setClearColor(0x000000, 0);
  scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.2));
  const d = new THREE.DirectionalLight(0xffffff, 1.6); d.position.set(3, 6, 4); scene.add(d);
  cam = new THREE.PerspectiveCamera(32, 1, .1, 50);
}
export function thumb(kind, key, level = 1) { // returns a data URL (cached)
  const id = kind + key + level; if (cache[id] !== undefined) return cache[id];
  try {
    if (!R) init();
    let obj;
    if (kind === 'tower') { const tw = new Tower(key, 0, 0, new THREE.Vector3(), new THREE.Scene()); tw.level = level; tw.build(); obj = tw.g; }
    else obj = buildModel(key);
    scene.add(obj);
    const box = new THREE.Box3().setFromObject(obj), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    const r = Math.max(sz.x, sz.y, sz.z) * .5 || 1, dist = r / Math.tan(THREE.MathUtils.degToRad(16)) * 1.2;
    cam.position.set(c.x + dist * .5, c.y + dist * .4, c.z + dist * .78); cam.lookAt(c);
    R.render(scene, cam); cache[id] = R.domElement.toDataURL('image/png');
    scene.remove(obj); obj.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
  } catch (e) { console.error(e); cache[id] = ''; }
  return cache[id];
}
