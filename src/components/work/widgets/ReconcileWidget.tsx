"use client";

import { useEffect, useMemo, useState } from "react";
import { WidgetFrame } from "./WidgetFrame";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/cn";
import { runTransfer, type RunMode, type Tone } from "@/lib/widgets/reconcile";

const toneClass: Record<Tone, string> = {
  info: "text-cream/80",
  warn: "text-[#e9c46a]",
  ok: "text-[#86d39b]",
  error: "text-[#f08a7c]",
};

export function ReconcileWidget() {
  const [mode, setMode] = useState<RunMode | null>(null);
  const [runId, setRunId] = useState(0);
  const [shown, setShown] = useState(0);
  const result = useMemo(() => (mode ? runTransfer(mode) : null), [mode]);
  const total = result?.lines.length ?? 0;

  useEffect(() => {
    if (shown >= total) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(() => setShown((n) => n + 1), reduced ? 0 : 380);
    return () => window.clearTimeout(id);
  }, [shown, total, runId]);

  const run = (next: RunMode) => {
    setMode(next);
    setShown(0);
    setRunId((n) => n + 1);
  };
  const done = result !== null && shown >= total;

  return (
    <WidgetFrame title="Tandem · Transfer after a timeout" caption="Simulated banking interface. Compare a blind retry with reconciliation.">
      <div className="flex flex-wrap gap-2">
        <Pill variant={mode === "naive" ? "solid" : "outline"} onClick={() => run("naive")}>
          Naive retry
        </Pill>
        <Pill variant={mode === "tandem" ? "solid" : "outline"} onClick={() => run("tandem")}>
          Tandem run
        </Pill>
      </div>
      <div className="mt-4 h-[176px] overflow-hidden rounded-xl bg-ink p-4 font-mono text-[11px] leading-relaxed" aria-live="polite">
        {!result && <p className="text-cream/50">$ choose a run to start</p>}
        {result?.lines.slice(0, shown).map((line, i) => (
          <p key={`${runId}-${i}`} className={toneClass[line.tone]}>
            {line.text}
          </p>
        ))}
      </div>
      <p className={cn("mt-3 text-sm font-semibold", !done && "invisible", result && result.transfers > 1 ? "text-alert" : "text-ink")}>
        {result && (result.transfers > 1 ? `✕ ${result.transfers} transfers posted` : "✓ 1 transfer posted")}
      </p>
    </WidgetFrame>
  );
}
