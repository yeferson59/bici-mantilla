/**
 * Hero choreography: a single function, `computePose(p, spin)`, says where every
 * joint of the rider is and how the bike is positioned for a scroll progress `p` between 0 and 1.
 *
 *   0.00 – 0.36  walks toward the bike
 *   0.36 – 0.57  grabs the handlebar and swings the right leg over
 *   0.57 – 0.66  pushes the pedal, sits down and lifts the other foot
 *   0.66 – 0.82  pedals seated and stands up
 *   0.82 – 1.00  standing sprint on the pedals
 *
 * Axes: +x is the direction the bike rolls, +y up, +z toward the camera.
 * "L" is the rider's left side (−z) and "R" the right (+z, the drivetrain side).
 */
import { Vector3 } from 'three';
import { clamp, smoothstep, TIMING } from './timing';

export { clamp, smoothstep, TIMING };

const v = (x = 0, y = 0, z = 0) => new Vector3(x, y, z);
const deg = (d: number) => (d * Math.PI) / 180;

/** Bike geometry in meters, with the origin on the ground below the bottom bracket. */
export const BIKE = {
  wheelRadius: 0.34,
  rearAxle: v(-0.43, 0.34, 0),
  frontAxle: v(0.62, 0.34, 0),
  bottomBracket: v(0, 0.29, 0),
  seatCluster: v(-0.17, 0.8, 0),
  saddle: v(-0.2, 0.96, 0),
  headTubeTop: v(0.42, 0.88, 0),
  headTubeBottom: v(0.455, 0.76, 0),
  stem: v(0.4, 0.955, 0),
  handlebar: v(0.5, 0.975, 0),
  crankLength: 0.17,
  pedalZ: 0.13,
  gripZ: 0.25,
};

export const BODY = {
  thigh: 0.46,
  shin: 0.46,
  ankleHeight: 0.07,
  torso: 0.5,
  halfHip: 0.1,
  halfShoulder: 0.19,
  upperArm: 0.3,
  forearm: 0.28,
  neck: 0.19,
};


const STRIDES = 3.5; // walk cycles
const STRIDE_LENGTH = 1.2; // meters per cycle
const RIDER_Z = -0.28; // walks along the left side of the bike
export const START_X = -STRIDES * STRIDE_LENGTH;

/** The right crank starts forward and up, ready for the first pedal stroke. */
const START_ANGLE = deg(35);
/** Meters the bike moves per pedal revolution. A multiple of the floor pattern. */
export const DISTANCE_PER_REV = 4.8;
export const MAX_CADENCE = Math.PI * 2 * 1.8; // rad/s at full sprint

/** Pedal revolutions that depend only on scroll (they can be reversed). */
function scriptedRevolutions(p: number) {
  return 0.6 * smoothstep(TIMING.straddle, TIMING.seated, p) + 2.4 * clamp((p - 0.62) / 0.38) ** 2;
}

/** Pedaling speed that keeps running over time even when the scroll is still. */
export function cadence(p: number) {
  return MAX_CADENCE * smoothstep(0.62, 0.86, p);
}

interface Target {
  pelvis: Vector3;
  torso: Vector3; // spine direction
  footL: Vector3; // ankles
  footR: Vector3;
  handL: Vector3 | null; // null = arm hanging
  handR: Vector3 | null;
  kneeL: Vector3; // direction each knee bends toward
  kneeR: Vector3;
  elbow: number; // 0 = elbows back (standing), 1 = elbows out (on the handlebar)
  toeL: number; // foot tilt in radians
  toeR: number;
  armSwing: number; // −1..1, swing while walking
}

export interface Pose {
  lean: number;
  crankAngle: number;
  distance: number;
  speed: number; // 0..1
  mounted: number; // 0 = on foot, 1 = on the bike
  pelvis: Vector3;
  neck: Vector3;
  head: Vector3;
  headUp: Vector3;
  torso: Vector3;
  hipL: Vector3;
  kneeL: Vector3;
  ankleL: Vector3;
  hipR: Vector3;
  kneeR: Vector3;
  ankleR: Vector3;
  shoulderL: Vector3;
  elbowL: Vector3;
  handL: Vector3;
  shoulderR: Vector3;
  elbowR: Vector3;
  handR: Vector3;
  toeL: number;
  toeR: number;
}

interface Context {
  p: number;
  theta: number;
  distance: number;
  gripL: Vector3;
  gripR: Vector3;
  pedalAnkleL: Vector3;
  pedalAnkleR: Vector3;
  onBike: (local: Vector3) => Vector3;
}

const KNEE_FORWARD = v(1, 0.15, 0);

function base(pelvis: Vector3, torso: Vector3): Target {
  return {
    pelvis,
    torso,
    footL: v(pelvis.x, BODY.ankleHeight, RIDER_Z - BODY.halfHip),
    footR: v(pelvis.x, BODY.ankleHeight, RIDER_Z + BODY.halfHip),
    handL: null,
    handR: null,
    kneeL: KNEE_FORWARD.clone(),
    kneeR: KNEE_FORWARD.clone(),
    elbow: 0,
    toeL: 0,
    toeR: 0,
    armSwing: 0,
  };
}

function leaning(degreesForward: number, towardBike = 0) {
  const a = deg(degreesForward);
  return v(Math.sin(a), Math.cos(a), towardBike).normalize();
}

function walk(phase: number, x: number): Target {
  const o = base(v(x, 0.925 - 0.015 * Math.cos(Math.PI * 4 * phase), RIDER_Z), leaning(4));
  const foot = (f: number, z: number): [Vector3, number] => {
    const cycle = f - Math.floor(f);
    if (cycle < 0.5) return [v(x + 0.3 - 1.2 * cycle, BODY.ankleHeight, z), 0];
    const u = (cycle - 0.5) / 0.5;
    const lift = Math.sin(Math.PI * u);
    return [v(x - 0.3 + 0.6 * u, BODY.ankleHeight + 0.11 * lift, z), -0.45 * lift];
  };
  [o.footL, o.toeL] = foot(phase, RIDER_Z - BODY.halfHip);
  [o.footR, o.toeR] = foot(phase + 0.5, RIDER_Z + BODY.halfHip);
  o.armSwing = Math.cos(Math.PI * 2 * phase);
  return o;
}

const standing = (): Target => base(v(0, 0.97, RIDER_Z), leaning(2));

function withHands(o: Target, c: Context): Target {
  o.handL = c.gripL;
  o.handR = c.gripR;
  o.elbow = 1;
  return o;
}

const grab = (c: Context) => withHands(base(v(0.02, 0.95, -0.27), leaning(25, 0.2)), c);

function legUp(c: Context) {
  const o = withHands(base(v(0, 0.97, -0.2), leaning(30, 0.15)), c);
  o.footL = v(0, BODY.ankleHeight, RIDER_Z - BODY.halfHip);
  o.footR = v(-0.55, 0.98, -0.05);
  o.kneeR = v(-0.2, -1, 0);
  o.toeR = -0.6;
  return o;
}

function legOver(c: Context) {
  const o = withHands(base(v(-0.01, 0.97, -0.12), leaning(32, 0.08)), c);
  o.footL = v(0, BODY.ankleHeight, RIDER_Z - BODY.halfHip);
  o.footR = v(-0.45, 0.8, 0.24);
  o.kneeR = v(0.6, 0.2, 1);
  o.toeR = -0.5;
  return o;
}

function straddle(c: Context) {
  const o = withHands(base(v(-0.02, 0.95, -0.06), leaning(35)), c);
  // The left foot is still on the ground and trails behind as the bike starts rolling.
  const drag = Math.min(c.distance, 0.45);
  o.footL = v(-drag, BODY.ankleHeight, RIDER_Z - BODY.halfHip);
  o.toeL = -drag * 1.3;
  o.footR = c.pedalAnkleR;
  o.toeR = -0.25;
  return o;
}

function seated(torsoDegrees: number) {
  return (c: Context) => {
    const o = withHands(base(c.onBike(v(-0.18, 1.04, 0)), leaning(torsoDegrees)), c);
    o.footL = c.pedalAnkleL;
    o.footR = c.pedalAnkleR;
    o.toeL = o.toeR = -0.25;
    return o;
  };
}

function sprint(c: Context) {
  const pelvis = v(-0.03, 1.1 + 0.02 * Math.cos(2 * c.theta), -0.035 * Math.sin(c.theta));
  const o = withHands(base(pelvis, leaning(56)), c);
  o.footL = c.pedalAnkleL;
  o.footR = c.pedalAnkleR;
  o.toeL = o.toeR = -0.38;
  return o;
}

const SCRIPT: [number, (c: Context) => Target][] = [
  [TIMING.walkEnd, standing],
  [TIMING.grab, grab],
  [TIMING.legUp, legUp],
  [TIMING.legOver, legOver],
  [TIMING.straddle, straddle],
  [TIMING.seated, seated(38)],
  [TIMING.seatedEnd, seated(46)],
  [TIMING.sprint, sprint],
  [1.001, sprint],
];

/** Two-bone solver: returns the middle joint and the reachable end point. */
function twoBoneIK(root: Vector3, target: Vector3, l1: number, l2: number, pole: Vector3): [Vector3, Vector3] {
  const dir = target.clone().sub(root);
  let dist = dir.length();
  if (dist < 1e-4) {
    dir.set(0, -1, 0);
    dist = 1e-4;
  } else {
    dir.divideScalar(dist);
  }
  const reach = clamp(dist, Math.abs(l1 - l2) + 1e-3, (l1 + l2) * 0.999);
  const projection = (l1 * l1 + reach * reach - l2 * l2) / (2 * reach);
  const height = Math.sqrt(Math.max(0, l1 * l1 - projection * projection));
  const perpendicular = pole.clone().addScaledVector(dir, -pole.dot(dir));
  if (perpendicular.lengthSq() < 1e-6) perpendicular.set(0, 0, 1).addScaledVector(dir, -dir.z);
  perpendicular.normalize();
  const mid = root.clone().addScaledVector(dir, projection).addScaledVector(perpendicular, height);
  const end = root.clone().addScaledVector(dir, reach);
  return [mid, end];
}

const X_AXIS = v(1, 0, 0);

function solve(o: Target): Omit<Pose, 'lean' | 'crankAngle' | 'distance' | 'speed' | 'mounted'> {
  const torso = o.torso.clone().normalize();
  const side = new Vector3().crossVectors(X_AXIS, torso).normalize(); // toward +z
  const neck = o.pelvis.clone().addScaledVector(torso, BODY.torso);
  const headUp = torso.clone().multiplyScalar(0.55).add(v(0.1, 0.45, 0)).normalize();
  const head = neck.clone().addScaledVector(headUp, BODY.neck);

  const hipL = o.pelvis.clone().addScaledVector(side, -BODY.halfHip);
  const hipR = o.pelvis.clone().addScaledVector(side, BODY.halfHip);
  const shoulderL = neck.clone().addScaledVector(side, -BODY.halfShoulder);
  const shoulderR = neck.clone().addScaledVector(side, BODY.halfShoulder);

  const [kneeL, ankleL] = twoBoneIK(hipL, o.footL, BODY.thigh, BODY.shin, o.kneeL);
  const [kneeR, ankleR] = twoBoneIK(hipR, o.footR, BODY.thigh, BODY.shin, o.kneeR);

  const hanging = (shoulder: Vector3, sign: number, swing: number) =>
    shoulder.clone().add(v(0.03 + 0.22 * swing, -0.53, sign * 0.05));
  const targetL = o.handL ?? hanging(shoulderL, -1, -o.armSwing);
  const targetR = o.handR ?? hanging(shoulderR, 1, o.armSwing);
  const elbowPole = (sign: number) =>
    v(-1, 0, sign * 0.3).lerp(v(-0.2, -0.5, sign), o.elbow);
  const [elbowL, handL] = twoBoneIK(shoulderL, targetL, BODY.upperArm, BODY.forearm, elbowPole(-1));
  const [elbowR, handR] = twoBoneIK(shoulderR, targetR, BODY.upperArm, BODY.forearm, elbowPole(1));

  return {
    pelvis: o.pelvis,
    torso,
    neck,
    head,
    headUp,
    hipL,
    kneeL,
    ankleL,
    hipR,
    kneeR,
    ankleR,
    shoulderL,
    elbowL,
    handL,
    shoulderR,
    elbowR,
    handR,
    toeL: o.toeL,
    toeR: o.toeR,
  };
}

/** Pre-solved blend: hanging hands are turned into points before interpolating. */
function blend(a: Target, b: Target, t: number): Target {
  const hand = (o: Target, side: 'L' | 'R') => {
    const direct = side === 'L' ? o.handL : o.handR;
    if (direct) return direct;
    const r = solve(o);
    return side === 'L' ? r.handL : r.handR;
  };
  const m = (x: number, y: number) => x + (y - x) * t;
  return {
    pelvis: a.pelvis.clone().lerp(b.pelvis, t),
    torso: a.torso.clone().lerp(b.torso, t),
    footL: a.footL.clone().lerp(b.footL, t),
    footR: a.footR.clone().lerp(b.footR, t),
    handL: hand(a, 'L').clone().lerp(hand(b, 'L'), t),
    handR: hand(a, 'R').clone().lerp(hand(b, 'R'), t),
    kneeL: a.kneeL.clone().lerp(b.kneeL, t),
    kneeR: a.kneeR.clone().lerp(b.kneeR, t),
    elbow: m(a.elbow, b.elbow),
    toeL: m(a.toeL, b.toeL),
    toeR: m(a.toeR, b.toeR),
    armSwing: 0,
  };
}

/**
 * @param p     scroll progress, 0..1
 * @param spin  extra pedaling radians accumulated over time (tracked by the scene)
 */
export function computePose(p: number, spin: number): Pose {
  const revolutions = scriptedRevolutions(p) + spin / (Math.PI * 2);
  const theta = START_ANGLE - revolutions * Math.PI * 2;
  const distance = revolutions * DISTANCE_PER_REV;

  const effort = 0.25 * smoothstep(0.62, 0.7, p) + 0.75 * smoothstep(TIMING.seatedEnd, 0.84, p);
  const propped = smoothstep(0.38, TIMING.grab, p) * (1 - smoothstep(TIMING.legOver, TIMING.straddle, p));
  const lean = -0.06 * propped + 0.1 * Math.sin(theta) * effort;

  const cos = Math.cos(lean);
  const sin = Math.sin(lean);
  const onBike = (l: Vector3) => v(l.x, l.y * cos - l.z * sin, l.y * sin + l.z * cos);
  const pedal = (angle: number, z: number) =>
    v(BIKE.crankLength * Math.cos(angle), BIKE.bottomBracket.y + BIKE.crankLength * Math.sin(angle), z);
  // The ankle sits behind and above the pedal: you pedal with the ball of the foot.
  const ankleAbove = (pedalCenter: Vector3) => onBike(pedalCenter.add(v(-0.11, 0.09, 0)));

  const c: Context = {
    p,
    theta,
    distance,
    onBike,
    gripL: onBike(v(BIKE.handlebar.x, BIKE.handlebar.y + 0.02, -BIKE.gripZ)),
    gripR: onBike(v(BIKE.handlebar.x, BIKE.handlebar.y + 0.02, BIKE.gripZ)),
    pedalAnkleL: ankleAbove(pedal(theta + Math.PI, -BIKE.pedalZ)),
    pedalAnkleR: ankleAbove(pedal(theta, BIKE.pedalZ)),
  };

  let target: Target;
  if (p < TIMING.walkEnd) {
    const phase = (STRIDES * p) / TIMING.walkEnd;
    const walking = walk(phase, START_X + STRIDE_LENGTH * phase);
    const stopping = smoothstep(TIMING.walkEnd - 0.035, TIMING.walkEnd, p);
    target = stopping > 0 ? blend(walking, standing(), stopping) : walking;
  } else {
    let i = 0;
    while (i < SCRIPT.length - 2 && p >= SCRIPT[i + 1][0]) i++;
    const [from, keyA] = SCRIPT[i];
    const [to, keyB] = SCRIPT[i + 1];
    target = blend(keyA(c), keyB(c), smoothstep(from, to, p));
  }

  return {
    ...solve(target),
    lean,
    crankAngle: theta,
    distance,
    speed: cadence(p) / MAX_CADENCE,
    mounted: smoothstep(TIMING.legOver, TIMING.seated, p),
  };
}
