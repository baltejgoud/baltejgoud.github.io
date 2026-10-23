import route from "@/content/journey-route.json";
import { clampJourney, easeJourney } from "./careerJourney";

export const CAREER_MAP_SCROLL_SCREENS = 6.5;
const INTRO = 0.035;
const END = 0.965;
const DRIVE = 0.6;

/** Scroll, rather than a clock, owns both travel and the reading stops. */
export function careerMapState(progress: number) {
  const p = clampJourney(progress);
  const chapter =
    clampJourney((p - INTRO) / (END - INTRO)) * route.stops.length;
  const index = Math.min(route.stops.length - 1, Math.floor(chapter));
  const fraction = chapter - index;
  const from = index === 0 ? 0 : route.stops[index - 1];
  const overview = p <= INTRO;
  return {
    index,
    overview,
    arrived: !overview && fraction >= DRIVE,
    distance: overview
      ? 0
      : from + (route.stops[index] - from) * easeJourney(fraction / DRIVE),
  };
}

/** The middle of a checkpoint's reading stretch, for links and keyboard navigation. */
export function careerMapStopProgress(index: number) {
  const target = Math.max(
    0,
    Math.min(
      route.stops.length - 1,
      Math.trunc(Number.isFinite(index) ? index : 0),
    ),
  );
  return INTRO + ((target + 0.8) / route.stops.length) * (END - INTRO);
}
