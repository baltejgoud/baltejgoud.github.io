export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Offset that pulls an element toward the pointer, capped at `max` pixels on each axis. */
export function magneticOffset(
  pointerX: number,
  pointerY: number,
  rect: Rect,
  max = 8,
): { x: number; y: number } {
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));
  const dx = (pointerX - (rect.left + rect.width / 2)) / (rect.width / 2);
  const dy = (pointerY - (rect.top + rect.height / 2)) / (rect.height / 2);
  return { x: clamp(dx) * max, y: clamp(dy) * max };
}
