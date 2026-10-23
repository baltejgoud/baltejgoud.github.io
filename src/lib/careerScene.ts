import route from "@/content/journey-route.json";
import { pointOnJourney } from "./careerJourney";

/** Geographic Spa, rotated as one ground plane and viewed from an aerial camera.
 * These constants also generate scripts/career-scene-guide.cjs. No corner is reshaped.
 */
export const CAREER_SCENE = { width: 1672, height: 941 };
const angle = (-25 * Math.PI) / 180;
const scale = 0.9805817783457503;
export function projectCareerPoint({ x, y }: { x: number; y: number }) {
  return {
    x: 390 + (x * Math.cos(angle) - y * Math.sin(angle) - 246.13384188936988) * scale,
    y: 125 + ((x * Math.sin(angle) + y * Math.cos(angle)) * 0.86 + 283.2574122043563) * scale,
  };
}
export const sceneRoad = route.points.map(([x, y]) => projectCareerPoint({ x, y }));
export const scenePath = sceneRoad.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join("");
export const sceneStops = route.positions.map(([x, y]) => projectCareerPoint({ x, y }));
export const scenePercent = ({ x, y }: { x: number; y: number }) => ({
  x: (x / CAREER_SCENE.width) * 100,
  y: (y / CAREER_SCENE.height) * 100,
});
export function pointOnCareerScene(progress: number) {
  const point = projectCareerPoint(pointOnJourney(progress));
  const before = projectCareerPoint(pointOnJourney(Math.max(0, progress - 0.0007)));
  const after = projectCareerPoint(pointOnJourney(Math.min(1, progress + 0.0007)));
  return { ...point, angle: Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI + 90 };
}

export const circuitLabels = ["University", "Tutoring", "Freelance", "Haritha", "Tectoro", "Sanket", "What’s Next?"];
export const circuitCaptions = ["THE FOUNDATION", "GIVING BACK", "SKILLS IN PRACTICE", "DATA INTO INSIGHT", "REAL-WORLD IMPACT", "BUILDING A COMPANY", "BIGGER HORIZONS"];
