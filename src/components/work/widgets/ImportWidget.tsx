"use client";

import { useEffect, useReducer } from "react";
import { WidgetFrame } from "./WidgetFrame";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/cn";
import { importReducer, initialImport, recordedDays, reviewSummary } from "@/lib/widgets/importer";

const STEPS = ["Parse", "Review", "Save"];
const STEP_INDEX = { idle: -1, parsing: 0, review: 1, saving: 2, saved: 3, cancelled: -1 } as const;

export function ImportWidget() {
  const [state, dispatch] = useReducer(importReducer, initialImport);
  const { phase, progress } = state;

  useEffect(() => {
    if (phase !== "parsing" && phase !== "saving") return;
    const id = window.setInterval(() => dispatch({ type: "tick", amount: phase === "parsing" ? 3 : 6 }), 50);
    return () => window.clearInterval(id);
  }, [phase]);

  const step = STEP_INDEX[phase];
  return (
    <WidgetFrame title="VIGOR · Apple Health import" caption="Illustrative export. Nothing is saved until the import has been reviewed.">
      <div className="flex items-center justify-between rounded-xl bg-cream px-3 py-2.5">
        <span className="font-mono text-xs">export.zip</span>
        <span className="font-mono text-[11px] text-stone">Apple Health · 412 MB</span>
      </div>
      <ol className="mt-4 grid grid-cols-3 gap-2">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={cn(
              "rounded-lg border px-2 py-1.5 text-center text-xs font-medium",
              i < step ? "border-ink bg-ink text-cream" : i === step ? "border-ink text-ink" : "border-line text-stone",
            )}
          >
            {label}
          </li>
        ))}
      </ol>
      <div
        role="progressbar"
        aria-label="Import progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-cream"
      >
        <div className="h-full rounded-full bg-ink" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-4 min-h-[128px]" aria-live="polite">
        {phase === "idle" && <Pill onClick={() => dispatch({ type: "start" })}>Start import</Pill>}
        {(phase === "parsing" || phase === "saving") && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-stone">{phase === "parsing" ? "Parsing records…" : "Saving reviewed records…"}</p>
            <Pill variant="outline" onClick={() => dispatch({ type: "cancel" })}>
              Cancel
            </Pill>
          </div>
        )}
        {phase === "review" && (
          <div>
            <p className="text-sm">
              <strong>{reviewSummary.records.toLocaleString("en-IN")}</strong> records · {reviewSummary.types} types ·{" "}
              <span className="text-stone">{reviewSummary.missingTypes} types missing</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill onClick={() => dispatch({ type: "save" })}>Save records</Pill>
              <Pill variant="outline" onClick={() => dispatch({ type: "reset" })}>
                Discard
              </Pill>
            </div>
          </div>
        )}
        {phase === "cancelled" && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-stone">Import cancelled — nothing saved.</p>
            <Pill variant="outline" onClick={() => dispatch({ type: "start" })}>
              Start again
            </Pill>
          </div>
        )}
        {phase === "saved" && (
          <div>
            <p className="label">Last 14 days · steps</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {recordedDays.map((recorded, i) => (
                <li
                  key={i}
                  title={recorded ? "Recorded" : "Unknown"}
                  className={cn("size-4 rounded-full", recorded ? "bg-ink" : "border border-dashed border-stone")}
                >
                  <span className="sr-only">
                    Day {i + 1}: {recorded ? "recorded" : "unknown"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 font-mono text-[10px] text-stone">● recorded · ○ unknown, never counted as zero</p>
            <button
              type="button"
              onClick={() => dispatch({ type: "reset" })}
              className="mt-2 text-xs font-medium underline underline-offset-4"
            >
              Run again
            </button>
          </div>
        )}
      </div>
    </WidgetFrame>
  );
}
