import route from "@/content/journey-route.json";

export const JOURNEY_INTRO = 0.14;
export const JOURNEY_END = 0.94;
export const clampJourney = (value: number) =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
export const easeJourney = (value: number) => {
  const t = clampJourney(value);
  return t * t * (3 - 2 * t);
};

export function journeyStopProgress(index: number) {
  const safeIndex = Math.max(
    0,
    Math.min(route.stops.length - 1, Math.trunc(index)),
  );
  return (
    JOURNEY_INTRO +
    ((safeIndex + 0.64) / route.stops.length) * (JOURNEY_END - JOURNEY_INTRO)
  );
}

export function journeyScrollState(progress: number) {
  const p = clampJourney(progress);
  const travel =
    Math.max(0, (p - JOURNEY_INTRO) / (JOURNEY_END - JOURNEY_INTRO)) *
    route.stops.length;
  const index = Math.min(route.stops.length - 1, Math.floor(travel));
  const fraction = travel - index;
  const t = easeJourney(fraction / 0.38);
  const from = index > 0 ? route.stops[index - 1] : 0;
  return {
    index,
    overview: p <= JOURNEY_INTRO,
    firstApproach: index === 0 ? t : 1,
    distance: p <= JOURNEY_INTRO ? 0 : from + (route.stops[index] - from) * t,
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
