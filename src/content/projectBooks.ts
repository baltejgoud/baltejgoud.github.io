import type { WidgetKind } from "./types";

/** Cover art and reading prompts; project facts remain in projects.ts. */
export const projectBooks: Record<
  WidgetKind,
  {
    color: string;
    ink: string;
    accent: string;
    height: number;
    tilt: number;
    subject: string;
    headline: string;
    invitation: string;
  }
> = {
  forecast: {
    color: "#223e51",
    ink: "#fff0ce",
    accent: "#e8bb72",
    height: 286,
    tilt: -4,
    subject: "Signals & decisions",
    headline: "A little less guesswork.",
    invitation:
      "Pick an industry, then move across the forecast. Watch the suggested decision change.",
  },
  atlas: {
    color: "#a8c5cf",
    ink: "#203d51",
    accent: "#f6edce",
    height: 310,
    tilt: -1,
    subject: "A world of coworkers",
    headline: "Many minds. One workspace.",
    invitation:
      "208 screens, one rendering idea. Bring them together and see what changes.",
  },
  import: {
    color: "#456653",
    ink: "#f9edcc",
    accent: "#cbdba5",
    height: 272,
    tilt: 3,
    subject: "The human in the data",
    headline: "Your data, with a pulse.",
    invitation:
      "Walk through an Apple Health import. Review what arrived before choosing to save it.",
  },
  fairPrice: {
    color: "#bd6049",
    ink: "#fff0d7",
    accent: "#eed9a4",
    height: 298,
    tilt: -3,
    subject: "A fairer encore",
    headline: "A spare ticket. A fairer night.",
    invitation:
      "Move the asking price. Find the line between a fair listing and one that gets blocked.",
  },
  custody: {
    color: "#d7bb72",
    ink: "#354332",
    accent: "#fcf0cf",
    height: 280,
    tilt: 2,
    subject: "From farm to proof",
    headline: "A story you can verify.",
    invitation:
      "Follow the evidence from one hand to the next. Change a record and see where trust breaks.",
  },
  reconcile: {
    color: "#b2a4c3",
    ink: "#342e49",
    accent: "#f7e9d0",
    height: 302,
    tilt: 4,
    subject: "The art of trying again",
    headline: "When trying again goes wrong.",
    invitation:
      "Compare a blind retry with a reconciled run. The timeout is the same; the outcome is different.",
  },
};
