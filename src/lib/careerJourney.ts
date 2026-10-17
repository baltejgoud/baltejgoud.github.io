import route from "@/content/journey-route.json";

export const JOURNEY_INTRO = 0.05;
export const JOURNEY_END = 0.94;
/** Share of the first approach the car waits on the grid before the lights go out. */
export const LIGHTS_OUT = 0.5;
export const clampJourney = (value: number) =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
export const easeJourney = (value: number) => {
  const t = clampJourney(value);
  return t * t * (3 - 2 * t);
};

const legMetres = route.stops.map(
  (to, i) => (to - (i > 0 ? route.stops[i - 1] : 0)) * route.circuitLength,
);
/**
 * Scroll given to each chapter, in viewport heights: a fixed share for reading
 * the story plus one screen per 1.7 km of its leg, so long legs drive at the
 * same pace as short ones instead of flashing past. The first chapter also
 * holds the drone dive and the start lights.
 */
export const JOURNEY_CHAPTERS = legMetres.map(
  (metres, i) => 0.6 + metres / 1700 + (i === 0 ? 0.45 : 0),
);
const chapterTotal = JOURNEY_CHAPTERS.reduce((sum, h) => sum + h, 0);
const chapterStarts = JOURNEY_CHAPTERS.reduce<number[]>(
  (starts, h) => [...starts, starts[starts.length - 1] + h / chapterTotal],
  [0],
);
/**
 * Scroll track length in viewport heights beyond the pinned screen, sized so
 * the chapters fill the range between the intro and the outro.
 */
export const JOURNEY_SCROLL_SCREENS =
  chapterTotal / (JOURNEY_END - JOURNEY_INTRO);

const clampIndex = (index: number) =>
  Math.max(0, Math.min(route.stops.length - 1, Math.trunc(index)));
/** Scroll progress `fraction` of the way through chapter `index`. */
export function journeyProgressAt(index: number, fraction: number) {
  const i = clampIndex(index);
  return (
    JOURNEY_INTRO +
    (chapterStarts[i] + fraction * (chapterStarts[i + 1] - chapterStarts[i])) *
      (JOURNEY_END - JOURNEY_INTRO)
  );
}
/** Share of a chapter by which the car has arrived and the story is up. */
export const JOURNEY_ARRIVED = 0.64;
export const journeyStopProgress = (index: number) =>
  journeyProgressAt(index, JOURNEY_ARRIVED);

export function journeyScrollState(progress: number) {
  const p = clampJourney(progress);
  const travel = Math.max(
    0,
    (p - JOURNEY_INTRO) / (JOURNEY_END - JOURNEY_INTRO),
  );
  let index = 0;
  while (index < route.stops.length - 1 && travel >= chapterStarts[index + 1])
    index++;
  const fraction =
    (travel - chapterStarts[index]) /
    (chapterStarts[index + 1] - chapterStarts[index]);
  // Give the drive over half a chapter's scroll distance. Short travel windows
  // made a single wheel gesture fling the chase camera hundreds of metres.
  const t = easeJourney(fraction / 0.55);
  const from = index > 0 ? route.stops[index - 1] : 0;
  // The first leg starts on the grid: the car only launches once the lights go out.
  const moved =
    index === 0 ? easeJourney((t - LIGHTS_OUT) / (1 - LIGHTS_OUT)) : t;
  return {
    index,
    fraction,
    overview: p <= JOURNEY_INTRO,
    arrival: p <= JOURNEY_INTRO ? 0 : clampJourney((fraction - 0.49) / 0.14),
    firstApproach: index === 0 ? t : 1,
    distance:
      p <= JOURNEY_INTRO ? 0 : from + (route.stops[index] - from) * moved,
  };
}

/**
 * The route cut into one leg per stop, so scrolling only repaints the leg being travelled
 * instead of re-dashing the whole route every frame.
 */
export const journeyLegs = route.stops.map((to, i) => {
  const from = i > 0 ? route.stops[i - 1] : 0;
  const start = pointOnJourney(from);
  const end = pointOnJourney(to);
  const inside = route.points.filter((_, j) => {
    const at = route.lengths[j] / route.totalLength;
    return at > from && at < to;
  });
  const points = [[start.x, start.y], ...inside, [end.x, end.y]];
  return {
    from,
    to,
    path: points
      .map(([x, y], j) => `${j ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(""),
  };
});

/** How much of a leg (0..1) is drawn once the traveller has covered `distance` of the route. */
export const journeyLegProgress = (
  distance: number,
  leg: { from: number; to: number },
) => clampJourney((distance - leg.from) / (leg.to - leg.from));

export function pointOnJourney(distance: number) {
  const target = clampJourney(distance) * route.totalLength;
  let low = 0;
  let high = route.lengths.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (route.lengths[mid] < target) low = mid + 1;
    else high = mid;
  }
  const end = Math.max(1, low);
  const start = end - 1;
  const span = route.lengths[end] - route.lengths[start];
  const mix =
    span > 0
      ? Math.max(0, Math.min(1, (target - route.lengths[start]) / span))
      : 0;
  const a = route.points[start];
  const b = route.points[end];
  return {
    x: a[0] + (b[0] - a[0]) * mix,
    y: a[1] + (b[1] - a[1]) * mix,
    angle: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI + 90,
  };
}
