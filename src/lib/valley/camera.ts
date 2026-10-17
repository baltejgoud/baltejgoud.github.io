/** How one hero layer reacts to the scroll "camera". */
export interface LayerDepth {
  /** Fraction of the scrolled distance the layer drifts back down (1 = pinned, 0 = scrolls with the page). */
  lag: number;
  /** Extra scale at the end of the fly-in. */
  zoom: number;
}

export interface LayerPose {
  /** Vertical offset as a fraction of the hero height. */
  y: number;
  scale: number;
}

export const depths = {
  sky: { lag: 0.62, zoom: 0.06 },
  ground: { lag: 0.44, zoom: 0.2 },
  front: { lag: 0.2, zoom: 0.46 },
} as const satisfies Record<string, LayerDepth>;

export type DepthName = keyof typeof depths;

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Ease-in so the camera accelerates into the valley instead of lurching at the first pixel of scroll. */
export const easeInQuad = (t: number) => t * t;

/** Pose of a layer at hero scroll progress `p` (0 = top of page, 1 = hero scrolled away). */
export function layerPose(p: number, depth: LayerDepth): LayerPose {
  const t = clamp01(p);
  return { y: t * depth.lag, scale: 1 + easeInQuad(t) * depth.zoom };
}

/** Linear fade from 1 to 0 between `from` and `to` progress. */
export function fadeOut(p: number, from: number, to: number): number {
  if (to <= from) return p >= to ? 0 : 1;
  return 1 - clamp01((p - from) / (to - from));
}
