/**
 * The hero's 3D scene. Everything is built in code from simple shapes:
 * the white bike, the yellow rider with a red helmet and a hexagon floor like the one on the business card.
 */
import * as THREE from 'three';
import { BIKE, BODY, DISTANCE_PER_REV, TIMING, cadence, clamp, computePose, smoothstep, type Pose } from './pose';

const COLOR = {
  background: 0x19191b,
  yellow: 0xffe600,
  red: 0xe2222c,
  white: 0xf4f4f0,
  metal: 0x9c9ca3,
};

const UP = new THREE.Vector3(0, 1, 0);
const V = THREE.Vector3;

export interface Region {
  /** Fraction of the canvas, from the left and from the top, taken up by the text. */
  x: number;
  y: number;
}

export interface HeroScene {
  /** Advances the animation. `p` is the 0..1 scroll and `dt` the seconds since the previous frame. */
  update(p: number, dt: number): void;
  resize(width: number, height: number, region: Region): void;
  lowerQuality(): void;
  dispose(): void;
}

function material(color: number, extra: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05, flatShading: true, ...extra });
}

/** Cylinder between two points. */
function tube(a: THREE.Vector3, b: THREE.Vector3, radius: number, mat: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 8), mat);
  orient(mesh, a, b);
  return mesh;
}

function orient(mesh: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) {
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
}

const withZ = (p: THREE.Vector3, z: number) => new V(p.x, p.y, z);

function createWheel(mat: THREE.Material, spokeMat: THREE.Material, accentMat: THREE.Material) {
  const wheel = new THREE.Group();
  const r = BIKE.wheelRadius;
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(r - 0.025, 0.025, 8, 40), mat));
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI;
    const tip = new V(Math.cos(a), Math.sin(a), 0).multiplyScalar(r - 0.04);
    wheel.add(tube(tip.clone().negate(), tip, 0.006, spokeMat));
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.11, 10), spokeMat);
  hub.rotation.x = Math.PI / 2;
  wheel.add(hub);
  // A reflector so the spin is noticeable.
  const reflector = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.03), accentMat);
  reflector.position.set(0, r - 0.12, 0);
  wheel.add(reflector);
  return wheel;
}

function createBike() {
  const group = new THREE.Group();
  const frame = material(COLOR.white, { roughness: 0.4, metalness: 0.25 });
  const metal = material(COLOR.metal, { roughness: 0.45, metalness: 0.5 });
  const red = material(COLOR.red);
  const yellow = material(COLOR.yellow);
  const b = BIKE;

  const topTubeEnd = new V(0.415, 0.865, 0);
  const downTubeEnd = new V(0.447, 0.785, 0);
  group.add(
    tube(b.bottomBracket, b.seatCluster, 0.022, frame),
    tube(b.seatCluster, b.saddle, 0.015, metal),
    tube(b.seatCluster, topTubeEnd, 0.02, frame),
    tube(b.bottomBracket, downTubeEnd, 0.026, frame),
    tube(b.headTubeTop, b.headTubeBottom, 0.03, frame),
    tube(b.headTubeTop, b.stem, 0.016, metal),
    tube(b.stem, b.handlebar, 0.018, metal),
    tube(withZ(b.handlebar, -0.31), withZ(b.handlebar, 0.31), 0.014, metal),
  );
  for (const side of [-1, 1]) {
    group.add(
      tube(withZ(b.bottomBracket, side * 0.03), withZ(b.rearAxle, side * 0.062), 0.013, frame),
      tube(withZ(b.seatCluster, side * 0.02), withZ(b.rearAxle, side * 0.062), 0.011, frame),
      tube(withZ(b.headTubeBottom, side * 0.03), withZ(b.frontAxle, side * 0.055), 0.016, frame),
      tube(withZ(b.handlebar, side * 0.2), withZ(b.handlebar, side * 0.31), 0.02, red),
    );
  }

  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.035, 0.12), red);
  saddle.position.set(b.saddle.x + 0.01, b.saddle.y + 0.015, 0);
  group.add(saddle);

  const wheels = [b.rearAxle, b.frontAxle].map((axle) => {
    const wheel = createWheel(frame, metal, yellow);
    wheel.position.copy(axle);
    group.add(wheel);
    return wheel;
  });

  // Drivetrain: chainring, cranks, pedals, cog and chain, on the camera side.
  const cranks = new THREE.Group();
  cranks.position.copy(b.bottomBracket);
  const chainring = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.092, 0.012, 18), yellow);
  chainring.rotation.x = Math.PI / 2;
  chainring.position.z = 0.055;
  cranks.add(chainring);
  const pedals: THREE.Mesh[] = [];
  for (const side of [1, -1]) {
    const z = side * 0.085;
    cranks.add(tube(new V(0, 0, z), new V(side * b.crankLength, 0, z), 0.014, metal));
    const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.022, 0.075), metal);
    pedal.position.set(side * b.crankLength, 0, side * b.pedalZ);
    cranks.add(pedal);
    pedals.push(pedal);
  }
  group.add(cranks);

  const cog = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 14), metal);
  cog.rotation.x = Math.PI / 2;
  cog.position.set(b.rearAxle.x, b.rearAxle.y, 0.055);
  group.add(
    cog,
    tube(new V(0, b.bottomBracket.y + 0.092, 0.055), new V(b.rearAxle.x, b.rearAxle.y + 0.045, 0.055), 0.006, metal),
    tube(new V(0, b.bottomBracket.y - 0.092, 0.055), new V(b.rearAxle.x, b.rearAxle.y - 0.045, 0.055), 0.006, metal),
  );

  return {
    group,
    apply(pose: Pose) {
      group.rotation.x = pose.lean;
      cranks.rotation.z = pose.crankAngle;
      for (const pedal of pedals) pedal.rotation.z = -pose.crankAngle; // always level
      const wheelSpin = -pose.distance / b.wheelRadius;
      for (const wheel of wheels) wheel.rotation.z = wheelSpin;
    },
  };
}

function createRider() {
  const group = new THREE.Group();
  const skin = material(COLOR.yellow, { roughness: 0.55 });
  const red = material(COLOR.red, { roughness: 0.4 });
  const white = material(COLOR.white);

  const capsule = (radius: number, length: number, mat: THREE.Material = skin) => {
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, Math.max(0.01, length - radius), 2, 7), mat);
    group.add(mesh);
    return mesh;
  };
  const ball = (radius: number, mat: THREE.Material = skin) => {
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 1), mat);
    group.add(mesh);
    return mesh;
  };

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.115, BODY.torso, 7), skin);
  torso.scale.set(0.7, 1, 1.05);
  const hips = ball(0.125);
  hips.scale.set(0.85, 0.75, 1.1);
  const neck = capsule(0.045, BODY.neck);
  const head = ball(0.105);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.122, 9, 4, 0, Math.PI * 2, 0, Math.PI * 0.52), red);
  group.add(torso, helmet);

  const limbs = () => ({
    thigh: capsule(0.068, BODY.thigh),
    shin: capsule(0.052, BODY.shin),
    upperArm: capsule(0.047, BODY.upperArm),
    forearm: capsule(0.04, BODY.forearm),
    shoulder: ball(0.062),
    hand: ball(0.046),
    shoe: (() => {
      const z = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.07, 0.095), white);
      group.add(z);
      return z;
    })(),
  });
  const left = limbs();
  const right = limbs();

  const tmp = new V();
  const placeShoe = (mesh: THREE.Mesh, ankle: THREE.Vector3, toe: number) => {
    // The shoe sticks out forward from the ankle and rotates with the foot's tilt.
    tmp.set(0.06, -0.035, 0).applyAxisAngle(new V(0, 0, 1), toe);
    mesh.position.copy(ankle).add(tmp);
    mesh.rotation.set(0, 0, toe);
  };

  return {
    group,
    apply(p: Pose) {
      orient(torso, p.pelvis, p.neck);
      hips.position.copy(p.pelvis);
      orient(neck, p.neck, p.head);
      head.position.copy(p.head);
      helmet.position.copy(p.head).addScaledVector(p.headUp, 0.012);
      helmet.quaternion.setFromUnitVectors(UP, p.headUp);

      orient(left.thigh, p.hipL, p.kneeL);
      orient(left.shin, p.kneeL, p.ankleL);
      orient(left.upperArm, p.shoulderL, p.elbowL);
      orient(left.forearm, p.elbowL, p.handL);
      left.shoulder.position.copy(p.shoulderL);
      left.hand.position.copy(p.handL);
      placeShoe(left.shoe, p.ankleL, p.toeL);

      orient(right.thigh, p.hipR, p.kneeR);
      orient(right.shin, p.kneeR, p.ankleR);
      orient(right.upperArm, p.shoulderR, p.elbowR);
      orient(right.forearm, p.elbowR, p.handR);
      right.shoulder.position.copy(p.shoulderR);
      right.hand.position.copy(p.handR);
      placeShoe(right.shoe, p.ankleR, p.toeR);
    },
  };
}

/** Stable pseudo-random number from two integers. */
function pseudoRandom(a: number, b: number) {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Hexagon floor. The pattern repeats every DISTANCE_PER_REV meters along x,
 * so the ground can scroll endlessly under the bike like a treadmill.
 */
function createGround() {
  const group = new THREE.Group();
  const spacing = DISTANCE_PER_REV / 4; // distance between columns
  const radius = spacing / Math.sqrt(3);
  const rowZ = radius * 1.5;
  const cols = 32;
  const rows = 24;

  const geometry = new THREE.CylinderGeometry(radius * 0.95, radius * 0.95, 0.02, 6);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const tiles = new THREE.InstancedMesh(geometry, mat, cols * rows);
  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();
  let n = 0;
  for (let f = 0; f < rows; f++) {
    for (let c = 0; c < cols; c++) {
      const x = (c - cols / 2) * spacing + (f % 2 ? spacing / 2 : 0);
      const z = (f - 15) * rowZ;
      matrix.makeTranslation(x, -0.01, z);
      tiles.setMatrixAt(n, matrix);
      const tone = pseudoRandom(c % 4, f);
      const gray = tone > 0.9 ? 0.2 : 0.105 + tone * 0.055;
      color.setRGB(gray, gray, gray * 1.03, THREE.SRGBColorSpace);
      tiles.setColorAt(n, color);
      n++;
    }
  }
  group.add(tiles);

  const base = new THREE.Mesh(
    new THREE.PlaneGeometry(cols * spacing + 4, rows * rowZ + 4),
    new THREE.MeshBasicMaterial({ color: 0x111112 }),
  );
  base.rotation.x = -Math.PI / 2;
  base.position.set(0, -0.025, (rows / 2 - 15) * rowZ);
  group.add(base);

  // Dashed lane line between the camera and the bike.
  const dashes = Math.floor((cols * spacing) / 2.4);
  const laneLine = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.1, 0.012, 0.07),
    new THREE.MeshBasicMaterial({ color: 0x3f3f44 }),
    dashes,
  );
  for (let i = 0; i < dashes; i++) {
    matrix.makeTranslation((i - dashes / 2) * 2.4, 0.005, 1.3);
    laneLine.setMatrixAt(i, matrix);
  }
  group.add(laneLine);

  return {
    group,
    apply(distance: number) {
      group.position.x = -(((distance % DISTANCE_PER_REV) + DISTANCE_PER_REV) % DISTANCE_PER_REV);
    },
  };
}

/** Speed lines that only appear when the bike is going fast. */
function createSpeedLines() {
  const count = 26;
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.012, 0.012), mat, count);
  mesh.frustumCulled = false;
  const streaks = Array.from({ length: count }, (_, i) => ({
    x: pseudoRandom(i, 1) * 20,
    // Below camera height, so they don't cross the text.
    y: 0.15 + pseudoRandom(i, 2) * 1.05,
    z: -2.6 + pseudoRandom(i, 3) * 3.6,
    length: 0.6 + pseudoRandom(i, 4) * 1.6,
    factor: 0.7 + pseudoRandom(i, 5) * 0.8,
  }));
  const color = new THREE.Color();
  streaks.forEach((_, i) => mesh.setColorAt(i, color.set(i % 3 === 0 ? COLOR.yellow : COLOR.white)));
  const matrix = new THREE.Matrix4();
  const scale = new V();
  const position = new V();
  const noRotation = new THREE.Quaternion();
  return {
    mesh,
    apply(distance: number, speed: number) {
      mat.opacity = 0.55 * speed * speed;
      mesh.visible = mat.opacity > 0.01;
      if (!mesh.visible) return;
      streaks.forEach((d, i) => {
        const travel = d.x - distance * d.factor;
        position.set((((travel % 20) + 20) % 20) - 10, d.y, d.z);
        scale.set(d.length * (0.4 + speed), 1, 1);
        matrix.compose(position, noRotation, scale);
        mesh.setMatrixAt(i, matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

function createShadows() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(0,0,0,0.6)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  const create = (width: number, depth: number) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.012;
    return mesh;
  };
  return { create, texture };
}

/** Piecewise interpolation of a value: points = [[p0, v0], [p1, v1], ...] */
function piecewise(p: number, points: [number, number][]) {
  if (p <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    if (p <= points[i][0]) {
      const [p0, v0] = points[i - 1];
      const [p1, v1] = points[i];
      return v0 + (v1 - v0) * smoothstep(p0, p1, p);
    }
  }
  return points[points.length - 1][1];
}

export function createScene(canvas: HTMLCanvasElement): HeroScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const fog = new THREE.Fog(COLOR.background, 8, 24);
  scene.fog = fog;

  const FOV = 30;
  const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 80);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2a30, 1.25));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(3, 6, 5);
  const backLight = new THREE.DirectionalLight(0xfff2a0, 1.3);
  backLight.position.set(-5, 3, -4);
  scene.add(sun, backLight);

  const ground = createGround();
  const bike = createBike();
  const rider = createRider();
  const speedLines = createSpeedLines();
  const shadows = createShadows();
  const bikeShadow = shadows.create(2.1, 0.6);
  bikeShadow.position.x = 0.1;
  const riderShadow = shadows.create(0.75, 0.55);
  scene.add(ground.group, bikeShadow, riderShadow, bike.group, rider.group, speedLines.mesh);

  let aspect = 1;
  let spin = 0;
  let clock = 0;
  const lookTarget = new V();

  function frameShot(p: number, pose: Pose) {
    const riderX = pose.pelvis.x;
    // During the walk both rider and bike fit; afterwards the camera moves in and turns toward the front.
    const portrait = aspect < 1;
    const neededWidth = Math.max(
      Math.abs(riderX) + 2.7,
      piecewise(p, [[TIMING.walkEnd, portrait ? 2.5 : 2.9], [TIMING.sprint, portrait ? 2.9 : 3.5]]),
    );
    const baseDistance = piecewise(p, [[TIMING.walkEnd, 5.6], [TIMING.straddle, 5.1], [TIMING.sprint, 6.0], [1, 6.5]]);
    // On portrait screens the camera doesn't pull back as far: it prefers big figures to showing the whole path.
    const distance = clamp(neededWidth / (2 * TAN * aspect), baseDistance, portrait ? 8.5 : 13);
    const visibleWidth = 2 * TAN * aspect * distance;
    const visibleHeight = 2 * TAN * distance;

    // If both don't fit, the rider wins: the bike enters the frame as the rider gets closer.
    const midpoint = riderX / 2 + 0.1;
    const centerX = Math.min(midpoint, riderX + Math.max(0.3, visibleWidth / 2 - 1));
    const shake = Math.sin(clock * 37) * 0.006 * pose.speed;
    lookTarget.set(centerX, visibleHeight * (portrait ? 0.31 : 0.27) + shake, 0);

    const azimuth = piecewise(p, [[0, -0.12], [TIMING.walkEnd, 0.14], [TIMING.straddle, 0.3], [TIMING.sprint, 0.6], [1, 0.72]]);
    camera.position.set(
      lookTarget.x + Math.sin(azimuth) * distance,
      lookTarget.y + 0.45,
      lookTarget.z + Math.cos(azimuth) * distance,
    );
    camera.lookAt(lookTarget);
    fog.near = distance + 1.5;
    fog.far = distance + 16;
  }

  return {
    update(p, dt) {
      clock += dt;
      const w = cadence(p);
      if (w > 0) {
        spin += w * dt;
      } else if (spin !== 0) {
        // When scrolling back, the crank finishes its turn to end up in the starting position again.
        const goal = Math.round(spin / (Math.PI * 2)) * Math.PI * 2;
        spin += (goal - spin) * Math.min(1, dt * 8);
        if (Math.abs(goal - spin) < 1e-3) spin = 0;
      }
      const pose = computePose(p, spin);
      bike.apply(pose);
      rider.apply(pose);
      ground.apply(pose.distance);
      speedLines.apply(pose.distance, pose.speed);
      riderShadow.position.set(pose.pelvis.x, 0.013, pose.pelvis.z);
      (riderShadow.material as THREE.MeshBasicMaterial).opacity = 1 - pose.mounted;
      frameShot(p, pose);
      renderer.render(scene, camera);
    },
    resize(width, height, region) {
      renderer.setSize(width, height, false);
      // The action is framed in the part of the canvas the text leaves free.
      const regionWidth = width * (1 - region.x);
      const regionHeight = height * (1 - region.y);
      aspect = regionWidth / regionHeight;
      camera.aspect = aspect;
      camera.setViewOffset(regionWidth, regionHeight, -width * region.x, -height * region.y, width, height);
      camera.updateProjectionMatrix();
    },
    lowerQuality() {
      renderer.setPixelRatio(1);
    },
    dispose() {
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        const mat = mesh.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      });
      shadows.texture.dispose();
      renderer.dispose();
    },
  };
}
