"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { splitWords } from "@/lib/valley/ink";
import { Sketch } from "./Sketch";
import { useScrollVar, type ScrollOffset } from "./useScrollVar";

export type InkMark = "marker" | "loop" | "wave" | "trend";

export type InkSegment =
  | string
  | { text: string; mark: InkMark; note?: string; seed?: number }
  | { chip: ReactNode; label: string };

const SOFT = 4;

/**
 * Copy that inks in word by word as it scrolls through the viewport. Marked phrases get an
 * analyst's annotation (marker, loop, wavy or trend underline) that draws once the phrase is inked.
 */
export function InkText({
  segments,
  className = "",
  offset = ["start 0.82", "end 0.5"],
}: {
  segments: InkSegment[];
  className?: string;
  offset?: ScrollOffset;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  useScrollVar(ref, "--ink", offset);

  let index = 0;
  const word = (text: string) => {
    const i = index++;
    return (
      <span key={i} className="p-ink-word" style={{ "--i": i } as CSSProperties}>
        {text}
      </span>
    );
  };

  const children = segments.map((segment, s) => {
    if (typeof segment === "string") return splitWords(segment).map(word);
    if ("chip" in segment) {
      const i = index++;
      return (
        <span key={`chip-${s}`} className="p-ink-word p-ink-chip" style={{ "--i": i } as CSSProperties}>
          {segment.chip}
          {segment.label}
        </span>
      );
    }
    const words = splitWords(segment.text);
    const trailing = segment.text.match(/\s+$/)?.[0] ?? "";
    const inner = words.map((w, i) => word(i === words.length - 1 ? w.trimEnd() : w));
    const end = index - 1;
    return (
      <span key={`mark-${s}`} className="p-annot" style={{ "--end": end } as CSSProperties}>
        <span className={`p-mark p-mark-${segment.mark}`}>
          {inner}
          {segment.mark !== "marker" && <Sketch kind={segment.mark} seed={segment.seed ?? s + 3} />}
        </span>
        {segment.note && (
          <span className="p-mark-note" aria-hidden>
            <Sketch kind="arrow" seed={(segment.seed ?? s) + 9} />
            {segment.note}
          </span>
        )}
        {trailing}
      </span>
    );
  });

  return (
    <p ref={ref} className={`p-ink ${className}`} style={{ "--span": index + SOFT, "--soft": SOFT } as CSSProperties}>
      {children}
    </p>
  );
}
