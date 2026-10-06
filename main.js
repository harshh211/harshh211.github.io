import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ---------- Renderer (draws the 3D scene onto the canvas) ----------
const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// ---------- Scene (the world) ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color('#f2c38b');   // warm sunset sky
scene.fog = new THREE.Fog('#f2c38b', 70, 180);   // fades the far water into the sky

// ---------- Camera (the viewer's eye) ----------
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 45, 75);

// ---------- Lights ----------
const skyLight = new THREE.HemisphereLight('#ffe8c7', '#1d4b5c', 1.2);
scene.add(skyLight);

const sun = new THREE.DirectionalLight('#ffd6a0', 2);
sun.position.set(40, 60, 20);
scene.add(sun);

// ---------- Water ----------
const waterGeo = new THREE.PlaneGeometry(300, 300, 120, 120);
waterGeo.rotateX(-Math.PI / 2); // lay it flat
const waterMat = new THREE.MeshStandardMaterial({
  color: '#2b7a8c',
  flatShading: true,  // low-poly faceted look
  roughness: 0.35,
  metalness: 0.1,
});
const water = new THREE.Mesh(waterGeo, waterMat);
scene.add(water);

// Remember the flat starting positions so waves are calculated from them
const basePositions = waterGeo.attributes.position.array.slice();

function updateWater(time) {
  const pos = waterGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = basePositions[i * 3];
    const z = basePositions[i * 3 + 2];
    const y =
      Math.sin(x * 0.15 + time) * 0.4 +
      Math.cos(z * 0.12 + time * 0.8) * 0.4 +
      Math.sin((x + z) * 0.08 + time * 1.3) * 0.2;
    pos.setY(i, y);
  }
  pos.needsUpdate = true;
}

// ---------- Controls (drag to look around) ----------
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;            // smooth movement
controls.maxPolarAngle = Math.PI / 2.2;   // can't go under the water
controls.minDistance = 20;
controls.maxDistance = 120;

// ---------- Resize with the window ----------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Animation loop (runs every frame) ----------
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();
  updateWater(t);
  controls.update();
  renderer.render(scene, camera);
});