export type ImportPhase = "idle" | "parsing" | "review" | "saving" | "saved" | "cancelled";

export interface ImportState {
  phase: ImportPhase;
  progress: number;
}

export type ImportEvent =
  | { type: "start" }
  | { type: "tick"; amount: number }
  | { type: "cancel" }
  | { type: "save" }
  | { type: "reset" };

export const initialImport: ImportState = { phase: "idle", progress: 0 };

/** Illustrative counts shown at the review step. */
export const reviewSummary = { records: 12480, types: 9, missingTypes: 3 };

/** Illustrative 14-day step history: false means no measurement (unknown, never zero). */
export const recordedDays: boolean[] = [
  true, true, false, true, true, true, false, false, true, true, true, false, true, true,
];

export function importReducer(state: ImportState, event: ImportEvent): ImportState {
  switch (event.type) {
    case "start":
      return state.phase === "idle" || state.phase === "cancelled" || state.phase === "saved"
        ? { phase: "parsing", progress: 0 }
        : state;
    case "tick": {
      if (state.phase !== "parsing" && state.phase !== "saving") return state;
      const progress = Math.min(100, state.progress + event.amount);
      if (progress < 100) return { ...state, progress };
      return { phase: state.phase === "parsing" ? "review" : "saved", progress: 100 };
    }
    case "cancel":
      return state.phase === "parsing" || state.phase === "saving" ? { ...state, phase: "cancelled" } : state;
    case "save":
      return state.phase === "review" ? { phase: "saving", progress: 0 } : state;
    case "reset":
      return initialImport;
  }
}
