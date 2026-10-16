/**
 * Dashed S-curve down the timeline: one cubic segment per milestone, swinging
 * between 42% and 58% of the width (desktop) or a gentle 20px rail (mobile).
 */
export function journeyPath(width: number, height: number, turns: number, centered: boolean): string {
  const cx = centered ? width / 2 : 20;
  const amp = centered ? width * 0.08 : 10;
  const seg = height / Math.max(turns, 1);
  let d = `M ${cx} 0`;
  for (let i = 0; i < turns; i++) {
    const y0 = i * seg;
    const dir = i % 2 === 0 ? 1 : -1;
    const x = cx + amp * dir;
    d += ` C ${x} ${y0 + seg * 0.35}, ${x} ${y0 + seg * 0.65}, ${cx} ${y0 + seg}`;
  }
  return d;
}
