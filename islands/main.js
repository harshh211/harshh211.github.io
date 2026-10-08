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
  color: '#1a64c8',
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
// ---------- Islands ----------
const sandMat = new THREE.MeshStandardMaterial({ color: '#e8c98f', flatShading: true });

// Bends the edges so every island gets its own outline
function wobble(geo, seed, amount, bump) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const a = Math.atan2(z, x);
    const s = 1 + amount * (Math.sin(a * 2 + seed) * 0.6 + Math.cos(a * 3 + seed * 1.7) * 0.4);
    pos.setX(i, x * s);
    pos.setZ(i, z * s);
    if (y > 0) pos.setY(i, y + bump * Math.sin(a * 3 + seed * 2.3));
  }
  geo.computeVertexNormals();
}

function makeIsland({ radius, height, sides, grass, seed, x, z }) {
  const island = new THREE.Group();

  // Sandy beach
  const sandGeo = new THREE.CylinderGeometry(radius, radius * 1.2, 1.6, sides);
  wobble(sandGeo, seed, 0.18, 0);
  island.add(new THREE.Mesh(sandGeo, sandMat));

  // Grassy hill on top
  const hillGeo = new THREE.CylinderGeometry(radius * 0.45, radius * 0.85, height, sides);
  wobble(hillGeo, seed + 1, 0.22, height * 0.15);
  const hill = new THREE.Mesh(
    hillGeo,
    new THREE.MeshStandardMaterial({ color: grass, flatShading: true })
  );
  hill.position.y = 0.7 + height / 2;
  island.add(hill);

  island.position.set(x, 0.5, z);
  island.rotation.y = seed;
  scene.add(island);
  return island;
}

// Different size, shape, height, and color for each island
const islands = {
  about:    makeIsland({ radius: 9,   height: 3,   sides: 9,  grass: '#6fa35b', seed: 1.3, x: -89, z: 61 }),
  exp:      makeIsland({ radius: 6,   height: 2,   sides: 7,  grass: '#8fb25a', seed: 2.7, x: -46, z: 12 }),
  projects: makeIsland({ radius: 12,  height: 5,   sides: 11, grass: '#4c8a4a', seed: 4.1, x: 13,  z: 18 }),
  skills:   makeIsland({ radius: 6.5, height: 2.5, sides: 8,  grass: '#a4a552', seed: 5.9, x: 54,  z: -39 }),
  contact:  makeIsland({ radius: 7,   height: 1.5, sides: 10, grass: '#7dbb7b', seed: 7.2, x: 89,  z: -61 }),
};
// ---------- Landmark: Warrior King on a Lion Throne (About Me) ----------
function makeStatue() {
  const s = new THREE.Group();
  const bronze = new THREE.MeshStandardMaterial({
    color: '#4b4640',
    roughness: 0.45,
    metalness: 0.55,
    flatShading: true,
  });
  const stone = new THREE.MeshStandardMaterial({ color: '#5f5b55', flatShading: true });
  const v = (x, y, z) => new THREE.Vector3(x, y, z);

  // Helpers: a rounded piece between two points, and a ball joint
  function limb(a, b, rEnd, rStart = rEnd, mat = bronze) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rEnd, rStart, dir.length(), 6), mat);
    mesh.position.copy(a).addScaledVector(dir, 0.5);
    mesh.quaternion.setFromUnitVectors(v(0, 1, 0), dir.normalize());
    s.add(mesh);
  }
  function ball(p, r) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), bronze);
    m.position.copy(p);
    s.add(m);
  }
  function box(w, h, d, x, y, z, mat = bronze) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    s.add(m);
    return m;
  }

  // Stone plinth and bronze base
  box(4, 0.8, 3.4, 0, -0.3, 0, stone);
  box(3.6, 0.5, 3, 0, 0.25, 0);

  // Throne: seat, back, round sun-ray medallion, side pillars
  box(2.0, 1.0, 1.5, 0, 1.0, -0.3);
  box(2.0, 1.8, 0.25, 0, 2.4, -1.05);
  const medallion = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.25, 12), bronze);
  medallion.rotation.x = Math.PI / 2;
  medallion.position.set(0, 3.5, -1.05);
  s.add(medallion);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const ray = box(0.12, 0.7, 0.08, Math.sin(a) * 0.8, 3.5 + Math.cos(a) * 0.8, -0.9);
    ray.rotation.z = -a;
  }
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.9, 6), bronze);
  crest.position.set(0, 5.1, -1.05);
  s.add(crest);
  [-1.15, 1.15].forEach((x) => {
    box(0.35, 2.8, 0.35, x, 2.9, -0.95);
    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 6), bronze);
    finial.position.set(x, 4.55, -0.95);
    s.add(finial);
  });

  // Two seated lions as armrests
  [-1.35, 1.35].forEach((x) => {
    box(0.7, 0.6, 1.0, x, 0.8, -0.1);                         // haunches
    limb(v(x, 0.8, 0.2), v(x, 1.6, 0.35), 0.28, 0.32);        // chest
    const mane = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), bronze);
    mane.position.set(x, 1.85, 0.4);
    s.add(mane);
    box(0.4, 0.38, 0.4, x, 1.8, 0.68);                        // face
    box(0.24, 0.18, 0.2, x, 1.7, 0.92);                       // snout
    limb(v(x - 0.15, 1.1, 0.45), v(x - 0.15, 0.5, 0.55), 0.09);  // front legs
    limb(v(x + 0.15, 1.1, 0.45), v(x + 0.15, 0.5, 0.55), 0.09);
  });

  // Legs and boots
  [-0.45, 0.45].forEach((x) => {
    limb(v(x * 0.7, 1.75, -0.4), v(x, 1.75, 0.6), 0.27);     // thigh
    limb(v(x, 1.75, 0.6), v(x * 1.1, 0.75, 0.7), 0.2, 0.25); // shin
    box(0.35, 0.25, 0.6, x * 1.1, 0.62, 0.85);               // boot
  });

  // Long flowing robe over the legs, and a waist sash
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.95, 1.1, 8), bronze);
  robe.position.set(0, 1.35, 0.15);
  s.add(robe);
  const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.18, 8), bronze);
  sash.position.set(0, 1.95, -0.3);
  s.add(sash);

  // Torso and broad shoulders
  limb(v(0, 1.9, -0.35), v(0, 3.3, -0.3), 0.55, 0.5);
  limb(v(-0.7, 3.2, -0.3), v(0.7, 3.2, -0.3), 0.2);

  // Necklace
  const necklace = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.04, 4, 12), bronze);
  necklace.rotation.x = -1.2;
  necklace.position.set(0, 3.15, -0.12);
  s.add(necklace);

  // Head, beard, and turban
  ball(v(0, 3.7, -0.25), 0.38);
  const beard = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.4, 6), bronze);
  beard.rotation.x = Math.PI;
  beard.position.set(0, 3.45, -0.05);
  s.add(beard);
  const turban = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.37, 0.38, 8), bronze);
  turban.position.set(0, 4.0, -0.27);
  turban.rotation.x = 0.15;
  s.add(turban);
  ball(v(0, 4.22, -0.1), 0.12);

  // Right arm: hand resting on the lion's head
  limb(v(-0.7, 3.15, -0.3), v(-1.0, 2.3, 0.0), 0.17, 0.2);
  ball(v(-1.0, 2.3, 0.0), 0.19);
  limb(v(-1.0, 2.3, 0.0), v(-1.25, 2.05, 0.6), 0.15, 0.17);
  ball(v(-1.25, 2.05, 0.6), 0.2);

  // Left arm: hand on the knee, gripping a sword
  limb(v(0.7, 3.15, -0.3), v(0.9, 2.4, 0.05), 0.17, 0.2);
  ball(v(0.9, 2.4, 0.05), 0.19);
  limb(v(0.9, 2.4, 0.05), v(0.6, 1.95, 0.6), 0.15, 0.17);
  ball(v(0.6, 1.95, 0.6), 0.2);

  // Sword: hilt above the hand, blade angled down past the knee
  limb(v(0.6, 1.95, 0.6), v(0.48, 2.25, 0.5), 0.05);
  box(0.4, 0.06, 0.1, 0.57, 2.02, 0.58);
  limb(v(0.62, 1.9, 0.62), v(1.6, 0.9, 1.25), 0.05, 0.07);

  return s;
}

const statue = makeStatue();
statue.scale.setScalar(1.5);
statue.position.set(0, 3.5, 0);
statue.rotation.y = -1.3; // cancel the island's turn so he faces the viewer
islands.about.add(statue);

// ---------- Landmark: Black Mirror Tower (Experience) ----------

// A tiny "fake world" for the glass to reflect: sunset sky, teal sea, a bright sun
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene();
envScene.background = new THREE.Color('#f2c38b');
const envSea = new THREE.Mesh(
  new THREE.PlaneGeometry(150, 150),
  new THREE.MeshBasicMaterial({ color: '#2b7a8c', side: THREE.DoubleSide })
);
envSea.rotation.x = -Math.PI / 2;
envSea.position.y = -1;
envScene.add(envSea);
const envSun = new THREE.Mesh(
  new THREE.BoxGeometry(8, 8, 8),
  new THREE.MeshBasicMaterial({ color: '#ffffff' })
);
envSun.position.set(25, 18, -10);
envScene.add(envSun);
const reflectionMap = pmrem.fromScene(envScene, 0, 0.1, 200).texture;

function makeTower() {
  const t = new THREE.Group();
  const glass = new THREE.MeshStandardMaterial({
    color: '#2a2f36',
    metalness: 1,
    roughness: 0.05,
    envMap: reflectionMap,
    flatShading: true,
  });
  const frame = new THREE.MeshStandardMaterial({ color: '#15171a', roughness: 0.6 });

  // Base that sits into the hill
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.8, 3.8), frame);
  plinth.position.y = -0.2;
  t.add(plinth);

  // One section of the tower: mirror glass + floor lines + corner fins
  function tier(w, h, y0) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), glass);
    body.position.y = y0 + h / 2;
    t.add(body);

    for (let y = y0 + 0.9; y < y0 + h; y += 0.9) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.06, w + 0.04), frame);
      line.position.y = y;
      t.add(line);
    }

    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, h, 0.12), frame);
      fin.position.set((sx * w) / 2, y0 + h / 2, (sz * w) / 2);
      t.add(fin);
    });

    const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.15, w + 0.1), frame);
    cap.position.y = y0 + h;
    t.add(cap);
  }

  tier(3.2, 6, 0);    // bottom
  tier(2.4, 3, 6);    // middle
  tier(1.6, 2, 9);    // top

  // Antenna with a red light
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2, 6), frame);
  antenna.position.y = 12.1;
  t.add(antenna);
  const beacon = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.15, 0),
    new THREE.MeshStandardMaterial({ color: '#ff3b30', emissive: '#ff3b30', emissiveIntensity: 2 })
  );
  beacon.position.y = 13.15;
  t.add(beacon);

  return t;
}

const tower = makeTower();
tower.position.set(0, 2.6, 0);
islands.exp.add(tower);

// ---------- Landmark: Fortress (Projects) ----------
function makeFortress() {
  const f = new THREE.Group();
  const mat = (color) => new THREE.MeshStandardMaterial({ color, flatShading: true });
  const stone = mat('#9a958c');
  const darkStone = mat('#7d786f');
  const roofMat = mat('#2f4d6b');

  const half = 3;    // fortress is 6 x 6
  const wallH = 1.6;

  // Stone platform so it sits flat on the hill
  const base = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5, 1.2, 8), darkStone);
  base.position.y = -0.4;
  f.add(base);

  // 4 walls
  [[0, half], [0, -half], [half, 0], [-half, 0]].forEach(([x, z]) => {
    const alongX = x === 0;
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(alongX ? half * 2 : 0.5, wallH, alongX ? 0.5 : half * 2),
      stone
    );
    wall.position.set(x, wallH / 2, z);
    f.add(wall);
  });

  // Corner towers with pointed roofs
  [[half, half], [half, -half], [-half, half], [-half, -half]].forEach(([x, z]) => {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 2.6, 8), darkStone);
    tower.position.set(x, 1.3, z);
    f.add(tower);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.2, 8), roofMat);
    roof.position.set(x, 3.2, z);
    f.add(roof);
  });

  // Central keep
  const keep = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.6, 2.2), stone);
  keep.position.y = 1.8;
  f.add(keep);

  const keepRoof = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.6, 4), roofMat);
  keepRoof.position.y = 4.4;
  keepRoof.rotation.y = Math.PI / 4;
  f.add(keepRoof);

  // Gold flag on top
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 4), mat('#333333'));
  pole.position.y = 6.1;
  f.add(pole);

  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.04), mat('#f2b544'));
  flag.position.set(0.47, 6.7, 0);
  f.add(flag);

  return f;
}

const fortress = makeFortress();
fortress.position.set(0, 5.4, 0);
islands.projects.add(fortress);

// ---------- Landmark: Giant Screwdriver + Screws (Skills) ----------
const steel = new THREE.MeshStandardMaterial({
  color: '#c9ced4',
  metalness: 0.85,
  roughness: 0.25,
  envMap: reflectionMap,
  flatShading: true,
});
const darkSteel = new THREE.MeshStandardMaterial({ color: '#3a3e44', metalness: 0.6, roughness: 0.4 });

function makeScrewdriver() {
  const sd = new THREE.Group();
  const mat = (color) => new THREE.MeshStandardMaterial({ color, flatShading: true });

  // Flat tip (points down into the ground)
  const tip = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.5, 0.08), steel);
  tip.position.y = 0.25;
  sd.add(tip);

  // Metal shaft
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 4, 8), steel);
  shaft.position.y = 2.5;
  sd.add(shaft);

  // Collar where shaft meets handle
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 8), steel);
  collar.position.y = 4.7;
  sd.add(collar);

  // Red handle with gold grip bands
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 2.6, 8), mat('#c8463d'));
  handle.position.y = 6.2;
  sd.add(handle);
  [5.5, 6.2, 6.9].forEach((y) => {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.58, 0.15, 8), mat('#f2b544'));
    band.position.y = y;
    sd.add(band);
  });
  const endCap = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.25, 8), mat('#a83a32'));
  endCap.position.y = 7.6;
  sd.add(endCap);

  return sd;
}

function makeScrew() {
  const sc = new THREE.Group();

  // Head with a cross slot
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.45, 0.25, 10), steel);
  head.position.y = 1.3;
  sc.add(head);
  [0, Math.PI / 2].forEach((r) => {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.1), darkSteel);
    slot.position.y = 1.43;
    slot.rotation.y = r;
    sc.add(slot);
  });

  // Shank with threads
  const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.7, 8), steel);
  shank.position.y = 0.35;
  sc.add(shank);
  for (let y = -0.3; y <= 1.0; y += 0.22) {
    const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.07, 8), steel);
    thread.position.y = y;
    thread.rotation.x = 0.15;
    sc.add(thread);
  }

  // Pointed end
    const point = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.35, 8), steel);
  point.rotation.x = Math.PI;
  point.position.y = -0.68;
  sc.add(point);

  return sc;
}

const skillsLandmark = new THREE.Group();

// Screwdriver planted at an angle, tip in the ground
const screwdriver = makeScrewdriver();
screwdriver.position.set(-0.8, -0.2, 0);
screwdriver.rotation.set(0.15, 0, 0.45);
skillsLandmark.add(screwdriver);

// Screws: two standing upright (half screwed in), one lying on its side
const screwSpots = [
  { pos: [1.6, -0.1, 0.9],  rot: [0, 0, 0.1] },
  { pos: [1.1, -0.4, -1.4], rot: [0.2, 0, -0.15] },
  { pos: [-1.6, 0.35, 1.3], rot: [0, 0.6, Math.PI / 2] },
];
screwSpots.forEach(({ pos, rot }) => {
  const s = makeScrew();
  s.scale.setScalar(1.3);
  s.position.set(...pos);
  s.rotation.set(...rot);
  skillsLandmark.add(s);
});

skillsLandmark.position.set(0, 3.2, 0);
islands.skills.add(skillsLandmark);

// ---------- Landmark: Dock + Sailboat (Let's Connect) ----------
function makeDock() {
  const d = new THREE.Group();
  const mat = (color) => new THREE.MeshStandardMaterial({ color, flatShading: true });
  const wood = mat('#8a5a34');
  const darkWood = mat('#5e3d24');

  // Wooden deck reaching from the beach out over the water
  const deck = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 1.6), wood);
  deck.position.x = 3;
  d.add(deck);

  // Posts holding up the deck
  for (let i = 0; i <= 3; i++) {
    [-0.7, 0.7].forEach((z) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.4, 6), darkWood);
      post.position.set(i * 2, -1.0, z);
      d.add(post);
    });
  }

  // Mailbox on the beach ("get in touch")
  const mailPost = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.1, 0.15), darkWood);
  mailPost.position.set(0.8, 0.4, -1.3);
  d.add(mailPost);
  const mailbox = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.4), mat('#c8463d'));
  mailbox.position.set(0.8, 1.15, -1.3);
  d.add(mailbox);

  // Sailboat tied up at the end of the dock
  const boat = new THREE.Group();

  const hullGeo = new THREE.BoxGeometry(2.6, 0.6, 1.2);
  const hp = hullGeo.attributes.position;
  for (let i = 0; i < hp.count; i++) {
    if (hp.getY(i) < 0) {            // narrow the bottom
      hp.setZ(i, hp.getZ(i) * 0.4);
      hp.setX(i, hp.getX(i) * 0.8);
    }
    if (hp.getX(i) > 0) {            // point the front
      hp.setZ(i, hp.getZ(i) * 0.5);
    }
  }
  hullGeo.computeVertexNormals();
  boat.add(new THREE.Mesh(hullGeo, mat('#f4efe6')));

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), darkWood);
  mast.position.y = 1.6;
  boat.add(mast);

  const sailShape = new THREE.Shape();
  sailShape.moveTo(0, 0);
  sailShape.lineTo(0, 2.2);
  sailShape.lineTo(1.3, 0);
  const sail = new THREE.Mesh(
    new THREE.ShapeGeometry(sailShape),
    new THREE.MeshStandardMaterial({ color: '#f2b544', side: THREE.DoubleSide, flatShading: true })
  );
  sail.position.set(0.08, 0.6, 0);
  boat.add(sail);

  boat.position.set(5, -1.1, 2.2);
  d.add(boat);

  return { dock: d, boat };
}

const { dock, boat } = makeDock();
dock.position.set(6.5, 0.95, 0);
islands.contact.add(dock);

// ---------- Make landmarks bigger ----------
fortress.scale.setScalar(1.3);
skillsLandmark.scale.setScalar(1.5);
dock.scale.setScalar(1.4);

// ---------- Make islands (and everything on them) bigger ----------
Object.values(islands).forEach((island) => island.scale.setScalar(1.8));

// ---------- Dotted path connecting the islands ----------
const pathOrder = [islands.about, islands.exp, islands.projects, islands.skills, islands.contact];
const islandRadii = [9, 6, 12, 6.5, 7].map((r) => r * 1.8 * 1.3); // how far each beach reaches

// Build a wavy curve: each island center, with a bend between each pair
const pathPoints = [];
pathOrder.forEach((island, i) => {
  const a = island.position;
  pathPoints.push(new THREE.Vector3(a.x, 0, a.z));
  const next = pathOrder[i + 1];
  if (next) {
    const b = next.position;
    const mid = new THREE.Vector3((a.x + b.x) / 2, 0, (a.z + b.z) / 2);
    const dir = new THREE.Vector3(b.x - a.x, 0, b.z - a.z).normalize();
    const side = i % 2 === 0 ? 1 : -1;            // bend left, then right, then left...
    mid.x += -dir.z * 12 * side;
    mid.z += dir.x * 12 * side;
    pathPoints.push(mid);
  }
});
const pathCurve = new THREE.CatmullRomCurve3(pathPoints);

// Place cream-colored dashes along the curve, skipping spots on the islands
const dashGeo = new THREE.BoxGeometry(2.4, 0.25, 0.7);
const dashMat = new THREE.MeshStandardMaterial({
  color: '#f4e6c8',
  emissive: '#f4e6c8',
  emissiveIntensity: 0.25,
  flatShading: true,
});
const dashCount = Math.floor(pathCurve.getLength() / 4.5);

for (let i = 0; i <= dashCount; i++) {
  const u = i / dashCount;
  const p = pathCurve.getPointAt(u);

  const onIsland = pathOrder.some(
    (island, k) => Math.hypot(p.x - island.position.x, p.z - island.position.z) < islandRadii[k]
  );
  if (onIsland) continue;

  const t = pathCurve.getTangentAt(u);
  const dash = new THREE.Mesh(dashGeo, dashMat);
  dash.position.set(p.x, 1.3, p.z);
  dash.rotation.y = Math.atan2(-t.z, t.x);
  scene.add(dash);
}

// ---------- Floating labels above each island ----------
function makeLabel(text) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d');

  // Dark pill background
  ctx.fillStyle = 'rgba(10, 22, 38, 0.85)';
  ctx.beginPath();
  ctx.roundRect(8, 16, 496, 96, 48);
  ctx.fill();

  // Gold outline
  ctx.strokeStyle = '#f2b544';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Text
  ctx.fillStyle = '#f4efe6';
  ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 66);

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, depthTest: false, fog: false })
  );
  sprite.scale.set(24, 6, 1);
  sprite.renderOrder = 10; // draw on top of everything
  return sprite;
}

const labelInfo = [
  { island: islands.about,    text: 'About Me',      height: 26 },
  { island: islands.exp,      text: 'Experience',    height: 33 },
  { island: islands.projects, text: 'Projects',      height: 32 },
  { island: islands.skills,   text: 'Skills',        height: 31 },
  { island: islands.contact,  text: "Let's Connect", height: 14 },
];

labelInfo.forEach(({ island, text, height }) => {
  const label = makeLabel(text);
  label.position.set(island.position.x, height, island.position.z);
  scene.add(label);
});

// ---------- Camera + view for the spread-out map ----------
camera.position.set(0, 118, 122);              // start with the whole map in view
scene.fog = new THREE.Fog('#f2c38b', 160, 450); // push the haze farther out
water.scale.set(2, 1, 2);                       // bigger ocean so you never see the edge

// ---------- Controls (Clash of Clans style) ----------
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);

// Mouse: left-drag = slide the map, right-drag = rotate, scroll = zoom
controls.mouseButtons = {
  LEFT: THREE.MOUSE.PAN,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.ROTATE,
};
// Touch: one finger = slide, two fingers = pinch zoom + twist rotate
controls.touches = {
  ONE: THREE.TOUCH.PAN,
  TWO: THREE.TOUCH.DOLLY_ROTATE,
};

controls.screenSpacePanning = false; // slide along the ground, not up into the sky
controls.zoomToCursor = true;        // zoom toward where you point
controls.enableDamping = true;       // smooth, game-like glide
controls.dampingFactor = 0.08;

// Keep the camera tilted at a fixed game angle
controls.minPolarAngle = 0.6;
controls.maxPolarAngle = 0.95;

// Zoom limits
controls.minDistance = 30;
controls.maxDistance = 200;

// Don't let the map slide too far off-screen
const bounds = { minX: -105, maxX: 105, minZ: -80, maxZ: 80 };
controls.addEventListener('change', () => {
  const t = controls.target;
  const cx = THREE.MathUtils.clamp(t.x, bounds.minX, bounds.maxX);
  const cz = THREE.MathUtils.clamp(t.z, bounds.minZ, bounds.maxZ);
  const dx = cx - t.x;
  const dz = cz - t.z;
  if (dx !== 0 || dz !== 0) {
    t.x = cx;
    t.z = cz;
    camera.position.x += dx;
    camera.position.z += dz;
  }
});

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