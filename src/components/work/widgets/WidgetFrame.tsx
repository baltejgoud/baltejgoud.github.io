import type { ReactNode } from "react";

interface WidgetFrameProps {
  title: string;
  caption: string;
  /** Marks synthetic data. Defaults to true. */
  illustrative?: boolean;
  children: ReactNode;
}

export function WidgetFrame({
  title,
  caption,
  illustrative = true,
  children,
}: WidgetFrameProps) {
  return (
    <figure className="project-widget flex h-full min-h-[380px] flex-col rounded-[20px] border border-line bg-paper p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <span className="label text-ink">{title}</span>
        {illustrative && (
          <span className="shrink-0 rounded-full bg-cream px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-stone">
            Illustrative
          </span>
        )}
      </div>
      <div className="mt-4 flex-1">{children}</div>
      <figcaption className="mt-4 font-mono text-[11px] leading-relaxed text-stone">
        {caption}
      </figcaption>
    </figure>
  );
}
