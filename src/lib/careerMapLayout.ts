/** The road's outer verge plus the geography labels, with no spare margin; pins are fitted separately. */
export const CAREER_MAP_BOUNDS = { x: 110, y: 78, width: 1280, height: 846 };
/** Half the verge stroke (56 map units in career-journey.css). */
const ROAD_HALF_WIDTH = 28;

export function careerMapPercent(point: { x: number; y: number }) {
  const b = CAREER_MAP_BOUNDS;
  return {
    x: ((point.x - b.x) / b.width) * 100,
    y: ((point.y - b.y) / b.height) * 100,
  };
}

type Point = { x: number; y: number };
type Box = { left: number; top: number; right: number; bottom: number };
/** A checkpoint in map units, with its pin and label as pixel offsets from that point. */
export type CareerMapMark = Point & { box: Box };

/**
 * Largest uniform scale, and the most central placement at it, where the whole road and every
 * checkpoint label clear the screen furniture. Furniture blocks only its own patch, so on a wide
 * screen the circuit's empty south-west corner can slide in beside the dock instead of above it.
 */
export function fitCareerMap(
  frame: { width: number; height: number },
  furniture: Box[],
  road: Point[],
  marks: CareerMapMark[],
) {
  const b = CAREER_MAP_BOUNDS;
  const clearance = 14;
  const edge = 12;
  const step = 6;
  const blocked = (left: number, top: number, right: number, bottom: number) =>
    left < edge ||
    top < edge ||
    right > frame.width - edge ||
    bottom > frame.height - edge ||
    furniture.some(
      (f) =>
        left < f.right + clearance &&
        right > f.left - clearance &&
        top < f.bottom + clearance &&
        bottom > f.top - clearance,
    );
  // Outermost road first: a placement that collides usually does so at the circuit's edge.
  const centre = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  const outline = [...road].sort(
    (p, q) =>
      Math.hypot(q.x - centre.x, q.y - centre.y) -
      Math.hypot(p.x - centre.x, p.y - centre.y),
  );
  const fits = (scale: number, x: number, y: number) => {
    const labelsClear = marks.every((m) => {
      const px = x + (m.x - b.x) * scale;
      const py = y + (m.y - b.y) * scale;
      return !blocked(
        px + m.box.left,
        py + m.box.top,
        px + m.box.right,
        py + m.box.bottom,
      );
    });
    if (!labelsClear) return false;
    const half = ROAD_HALF_WIDTH * scale;
    return outline.every((p) => {
      const px = x + (p.x - b.x) * scale;
      const py = y + (p.y - b.y) * scale;
      return !blocked(px - half, py - half, px + half, py + half);
    });
  };
  const place = (scale: number) => {
    const width = b.width * scale;
    const height = b.height * scale;
    const cx = (frame.width - width) / 2;
    const cy = (frame.height - height) / 2;
    const spots: (Point & { d: number })[] = [];
    for (let y = 0; y <= frame.height - height; y += step)
      for (let x = 0; x <= frame.width - width; x += step)
        spots.push({ x, y, d: (x - cx) ** 2 + (y - cy) ** 2 });
    spots.sort((p, q) => p.d - q.d);
    const at = spots.find((p) => fits(scale, p.x, p.y));
    return at && { x: at.x, y: at.y, width, height, scale };
  };
  let low = 0.2;
  let high = Math.min(1.3, frame.width / b.width, frame.height / b.height);
  let best: ReturnType<typeof place> = undefined;
  for (let i = 0; i < 12; i++) {
    const mid = (low + high) / 2;
    const at = place(mid);
    if (at) {
      low = mid;
      best = at;
    } else high = mid;
  }
  return best ?? null;
}

/** Prefer an adjacent clearing, scoring candidate popovers against the actual route. */
export function placeCareerPopup(
  anchor: Point,
  card: { width: number; height: number },
  viewport: { width: number; height: number },
  road: Point[],
  protectedAreas: Box[] = [],
) {
  const margin = 96;
  const maxX = Math.max(margin, viewport.width - card.width - 30);
  const maxY = Math.max(88, viewport.height - card.height - 108);
  const candidates = [
    { x: anchor.x - card.width - 22, y: anchor.y + 50 },
    { x: anchor.x + 38, y: anchor.y + 35 },
    { x: anchor.x - card.width - 38, y: anchor.y - card.height - 30 },
    { x: anchor.x + 38, y: anchor.y - card.height - 30 },
    { x: viewport.width * 0.23, y: viewport.height * 0.44 },
    { x: viewport.width * 0.12, y: viewport.height * 0.49 },
    { x: viewport.width * 0.44, y: viewport.height * 0.45 },
    { x: viewport.width * 0.3164, y: viewport.height * 0.55 },
    { x: viewport.width * 0.42, y: viewport.height * 0.61 },
  ].map((p) => ({
    x: Math.max(margin, Math.min(maxX, p.x)),
    y: Math.max(88, Math.min(maxY, p.y)),
  }));
  const score = (p: Point) => {
    const inside = (q: Point, pad: number) =>
      q.x > p.x - pad &&
      q.x < p.x + card.width + pad &&
      q.y > p.y - pad &&
      q.y < p.y + card.height + pad;
    const collisions = road.filter((q) => inside(q, 18)).length;
    const distance = Math.hypot(
      anchor.x - Math.max(p.x, Math.min(p.x + card.width, anchor.x)),
      anchor.y - Math.max(p.y, Math.min(p.y + card.height, anchor.y)),
    );
    const obscuresUI = protectedAreas.some((area) =>
      p.x < area.right + 16 && p.x + card.width > area.left - 16 &&
      p.y < area.bottom + 16 && p.y + card.height > area.top - 16,
    );
    return collisions * 1000 + (obscuresUI ? 1000000 : 0) + (inside(anchor, 35) ? 100000 : 0) + distance;
  };
  return candidates.reduce((best, next) =>
    score(next) < score(best) ? next : best,
  );
}
