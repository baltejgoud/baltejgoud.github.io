"use client";

import { useEffect, useState } from "react";
import { WidgetFrame } from "./WidgetFrame";
import { cn } from "@/lib/cn";
import { hasWebCrypto } from "@/lib/hash";
import { chainHashes, defaultChain, tamperedPayloads, verify, type CustodyStep } from "@/lib/widgets/custody";

export function CustodyWidget() {
  const [chain, setChain] = useState<CustodyStep[]>(defaultChain);
  const [signed, setSigned] = useState<string[]>([]);
  const [current, setCurrent] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    chainHashes(defaultChain).then((hashes) => {
      if (!alive) return;
      setSigned(hashes);
      setCurrent(hashes);
    });
    return () => {
      alive = false;
    };
  }, []);

  const ok = verify(signed, current);
  const firstBroken = ok.indexOf(false);
  const tamper = (id: string) => {
    const next = chain.map((s) => (s.id === id ? { ...s, payload: tamperedPayloads[id] } : s));
    setChain(next);
    chainHashes(next).then(setCurrent);
  };
  const reset = () => {
    setChain(defaultChain);
    setCurrent(signed);
  };

  return (
    <WidgetFrame
      title="AgriTrust · Custody chain"
      caption={
        hasWebCrypto()
          ? "Each step hashes its record with the one before it (SHA-256 via Web Crypto)."
          : "Each step hashes its record with the one before it (non-cryptographic fallback hash)."
      }
    >
      <ol className="space-y-2">
        {chain.map((step, i) => {
          const good = ok[i] ?? true;
          const tampered = step.payload !== defaultChain[i].payload;
          return (
            <li
              key={step.id}
              className={cn("rounded-xl border px-3 py-2.5 transition-colors", good ? "border-line bg-paper" : "border-alert/40 bg-alert/5")}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{step.label}</span>
                <span className={cn("font-mono text-[10px]", good ? "text-stone" : "text-alert")}>
                  {current[i] ? current[i].slice(0, 8) : "········"} {good ? "✓" : "✕"}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="truncate font-mono text-[11px] text-stone">{step.payload}</span>
                <button
                  type="button"
                  disabled={tampered || signed.length === 0}
                  onClick={() => tamper(step.id)}
                  className="shrink-0 text-[11px] font-medium underline underline-offset-4 disabled:no-underline disabled:opacity-40"
                >
                  Tamper
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex items-center justify-between" aria-live="polite">
        <p className={cn("text-sm font-semibold", firstBroken >= 0 ? "text-alert" : "text-ink")}>
          {firstBroken >= 0 ? `Chain broken from step ${firstBroken + 1}` : "Chain verified"}
        </p>
        <button type="button" onClick={reset} className="text-xs font-medium underline underline-offset-4">
          Reset
        </button>
      </div>
    </WidgetFrame>
  );
}
