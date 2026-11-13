/**
 * What the hero needs before loading the 3D scene: no `three` here, so the home page
 * does not download the library until it is actually going to render.
 */
export const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));
export const smoothstep = (from: number, to: number, x: number) => {
  const t = clamp((x - from) / (to - from));
  return t * t * (3 - 2 * t);
};

export const TIMING = {
  walkEnd: 0.36,
  grab: 0.42,
  legUp: 0.48,
  legOver: 0.52,
  straddle: 0.57,
  seated: 0.66,
  seatedEnd: 0.76,
  sprint: 0.82,
};
