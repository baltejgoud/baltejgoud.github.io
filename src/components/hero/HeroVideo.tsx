"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";
import { vars } from "@/lib/style";

interface HeroVideoProps {
  video: { src: string; poster: string };
  alt: string;
  className?: string;
}

/** Muted looping avatar clip; autoplays unless reduced motion is set, with a sound pill. */
export function HeroVideo({ video, alt, className }: HeroVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = usePrefersReducedMotion();
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (!reduced) ref.current?.play().catch(() => {});
  }, [reduced]);

  return (
    <div className={cn("relative h-full w-full", className)}>
      <video
        ref={ref}
        className="h-full w-full object-contain object-bottom"
        src={video.src}
        poster={video.poster}
        loop
        muted
        playsInline
        preload="metadata"
        aria-label={alt}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <div className="absolute bottom-[22%] left-1/2 flex -translate-x-1/2 gap-2">
        {!playing && (
          <button
            type="button"
            onClick={() => ref.current?.play()}
            className="h-10 rounded-full bg-paper px-4 text-xs font-semibold shadow-card"
          >
            Play
          </button>
        )}
        <button
          type="button"
          aria-pressed={!muted}
          onClick={() => setMuted((m) => !m)}
          className="flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-xs font-semibold text-cream"
        >
          <span aria-hidden className="flex h-3 items-end gap-[2px]">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn("w-[2px] origin-bottom rounded-full bg-cream", !muted && playing ? "eq-bar" : "h-1")}
                style={vars({ "--delay": `${i * 120}ms` })}
              />
            ))}
          </span>
          {muted ? "Sound off" : "Sound on"}
        </button>
      </div>
    </div>
  );
}
