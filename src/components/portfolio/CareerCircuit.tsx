import { forwardRef, type RefObject } from "react";
import Image from "next/image";
import route from "@/content/journey-route.json";
import { CAREER_SCENE, circuitCaptions, circuitLabels, scenePath, scenePercent, sceneStops, pointOnCareerScene } from "@/lib/careerScene";

export const CareerCircuit = forwardRef<HTMLDivElement, {
  progressRef: RefObject<SVGPathElement | null>;
  boardRef: RefObject<HTMLDivElement | null>;
  selected: number;
  overview: boolean;
  onSelect: (index: number) => void;
}>(function CareerCircuit({ progressRef, boardRef, selected, onSelect }, carRef) {
  const start = scenePercent(pointOnCareerScene(0));
  return (
    <div className="cm-map" aria-label="Cinematic aerial view of the real Spa-Francorchamps circuit">
      <div ref={boardRef} className="cm-map-board">
        <Image className="cm-terrain" src="/assets/journey/spa-cinematic.webp" alt="" fill sizes="(max-width: 650px) 950px, 100vw" />
        <svg className="cm-map-art" viewBox={`0 0 ${CAREER_SCENE.width} ${CAREER_SCENE.height}`} aria-hidden="true">
          <defs>
            <filter id="cm-road-grain" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" stitchTiles="stitch" result="noise" />
              <feColorMatrix in="noise" type="saturate" values="0" />
              <feComposite in2="SourceGraphic" operator="in" />
              <feBlend in2="SourceGraphic" mode="soft-light" />
            </filter>
          </defs>
          <path d={scenePath} className="cm-road-shadow" />
          <path d={scenePath} className="cm-road-light" />
          <path d={scenePath} className="cm-track-border" />
          <path d={scenePath} className="cm-curb-yellow" />
          <path d={scenePath} className="cm-curb-red" />
          <path d={scenePath} className="cm-track" />
          <path d={scenePath} className="cm-route" />
          <path ref={progressRef} d={scenePath} className="cm-route-complete" pathLength={1} strokeDasharray="1" strokeDashoffset="1" />
          <path d={scenePath} className="cm-road-center" />
        </svg>
        {sceneStops.map((point, index) => {
          const at = scenePercent(point);
          return (
            <button key={index} className={`cm-pin cm-pin-${index} ${selected === index ? "is-active" : ""}`}
              style={{ left: `${at.x}%`, top: `${at.y}%` }} onClick={() => onSelect(index)}
              aria-label={`Checkpoint ${index + 1}: ${circuitLabels[index]}, ${route.corners[index]}`}
              aria-current={selected === index ? "step" : undefined}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{circuitLabels[index]}<small>{circuitCaptions[index]}</small></b>
            </button>
          );
        })}
        <div ref={carRef} className="cm-car" style={{ left: `${start.x}%`, top: `${start.y}%` }} role="img" aria-label="Formula 1 car on the Spa circuit">
          <div className="cm-car-heading"><Image src="/assets/journey/red-bull-car.png" alt="" width={256} height={588} sizes="18px" /></div>
        </div>
      </div>
      <div className="cm-map-shade" aria-hidden="true" />
      <div className="cm-atmosphere" aria-hidden="true" />
    </div>
  );
});
