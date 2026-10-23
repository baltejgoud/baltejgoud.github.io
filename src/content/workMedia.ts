/** Imagery for each project. "capture" is a real development screenshot; "concept" is illustration. */
export interface Shot {
  src: string;
  width: number;
  height: number;
  caption: string;
  kind: "capture" | "concept";
}

export interface WorkMedia {
  accent: string;
  cover: Shot;
  shots: Shot[];
}

const shot = (src: string, width: number, height: number, caption: string, kind: Shot["kind"] = "capture"): Shot => ({
  src: `/assets/work/${src}`,
  width,
  height,
  caption,
  kind,
});

export const workMedia: Record<string, WorkMedia> = {
  sanket: {
    accent: "#c96a4a",
    cover: shot("sanket-dashboard.webp", 1672, 941, "Decision dashboard, sandbox data"),
    shots: [
      shot("sanket-dashboard.webp", 1672, 941, "Decision dashboard, sandbox data"),
      shot("sanket-forecasts.webp", 1672, 941, "SKU forecasts with uncertainty bands, sandbox data"),
    ],
  },
  axon: {
    accent: "#5a7d9c",
    cover: shot("axon-campus.webp", 1920, 1080, "The procedural 3D campus"),
    shots: [
      shot("axon-campus.webp", 1920, 1080, "The procedural 3D campus"),
      shot("axon-review.webp", 1920, 1080, "Reviewing a proposed change before it lands"),
    ],
  },
  vigor: {
    accent: "#648f68",
    cover: shot("vigor-health.webp", 1276, 718, "Health overview, synthetic test data"),
    shots: [
      shot("vigor-health.webp", 1276, 718, "Health overview, synthetic test data"),
      shot("vigor-nutrition.webp", 1276, 2170, "Food diary and nutrition, synthetic test data"),
    ],
  },
  extraticket: {
    accent: "#bc754f",
    cover: shot("extraticket-home.webp", 1425, 1069, "Home and discovery, sample listings"),
    shots: [shot("extraticket-home.webp", 1425, 1069, "Home and discovery, sample listings")],
  },
  agritrust: {
    accent: "#7d8c52",
    cover: shot("agritrust-concept.webp", 1536, 1024, "Concept illustration of the evidence timeline", "concept"),
    shots: [shot("agritrust-concept.webp", 1536, 1024, "Concept illustration of the evidence timeline", "concept")],
  },
  tandem: {
    accent: "#9073a1",
    cover: shot("tandem-concept.webp", 1536, 1024, "Concept illustration of the operator console", "concept"),
    shots: [shot("tandem-concept.webp", 1536, 1024, "Concept illustration of the operator console", "concept")],
  },
};
