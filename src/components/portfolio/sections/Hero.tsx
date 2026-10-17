"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowDown, Music2 } from "lucide-react";
import { depths, fadeOut, layerPose } from "@/lib/valley/camera";
import { mulberry32 } from "@/lib/random";
import { heroArt, heroPins, type HeroLayer } from "@/content/hero";
import { lqip } from "@/content/lqip";
import { Sketch } from "../motion/Sketch";
import { useSite } from "../SiteContext";
import "./hero.css";

const motes = (() => {
  const rand = mulberry32(42);
  return Array.from({ length: 16 }, () => ({
    x: rand() * 100,
    y: 35 + rand() * 60,
    size: 2 + rand() * 3,
    delay: rand() * -14,
    drift: 10 + rand() * 9,
  }));
})();

function Layer({
  layer,
  progress,
  reduced,
  onLoad,
  children,
}: {
  layer: HeroLayer;
  progress: MotionValue<number>;
  reduced: boolean;
  onLoad?: () => void;
  children?: React.ReactNode;
}) {
  const depth = depths[layer.depth];
  const y = useTransform(progress, (v) => `${(reduced ? 0 : layerPose(v, depth).y) * 100}%`);
  const scale = useTransform(progress, (v) => (reduced ? 1 : layerPose(v, depth).scale));
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (img.current?.complete) onLoad?.();
  }, [onLoad]);

  return (
    <motion.div className={`h-layer h-layer-${layer.depth}`} style={{ y, scale }}>
      <div className="h-canvas">
        <picture>
          <source media="(max-width: 760px)" srcSet={layer.mobileSrc} />
          {/* A plain img inside <picture>: the static export serves files unoptimised anyway. */}
          <img
            ref={img}
            src={layer.src}
            alt={layer.depth === "ground" ? heroArt.alt : ""}
            aria-hidden={layer.depth === "ground" ? undefined : true}
            width={heroArt.width}
            height={heroArt.height}
            fetchPriority={layer.depth === "ground" ? "high" : "auto"}
            decoding="async"
            onLoad={onLoad}
          />
        </picture>
        {children}
      </div>
    </motion.div>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion() ?? false;
  const { goToStop, openMusic } = useSite();
  const [loaded, setLoaded] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const copyY = useTransform(scrollYProgress, [0, 0.6], reduced ? [0, 0] : [0, -90]);
  const copyOpacity = useTransform(scrollYProgress, (v) => (reduced ? 1 : fadeOut(v, 0.05, 0.55)));
  const uiOpacity = useTransform(scrollYProgress, (v) => (reduced ? 1 : fadeOut(v, 0, 0.35)));
  const pinOpacity = useTransform(scrollYProgress, (v) => (reduced ? 1 : fadeOut(v, 0.05, 0.45)));
  const frontY = useTransform(scrollYProgress, (v) => `${(reduced ? 0 : layerPose(v, depths.front).y) * 100}%`);
  const frontScale = useTransform(scrollYProgress, (v) => (reduced ? 1 : layerPose(v, depths.front).scale));

  const scrollToLife = () => document.getElementById("life")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });

  return (
    <section
      id="top"
      ref={ref}
      className={`h-hero ${loaded ? "is-loaded" : ""}`}
      aria-label="Welcome to the valley"
      data-dock-section
      style={{ "--lqip": `url(${lqip.valley})`, "--lqip-m": `url(${lqip.valleyMobile})` } as CSSProperties}
    >
      <div
        className="h-stage"
        style={
          {
            "--ratio": heroArt.width / heroArt.height,
            "--ratio-m": heroArt.mobileWidth / heroArt.mobileHeight,
          } as CSSProperties
        }
      >
        <div className="h-world">
          <div className="h-canvas h-placeholder" aria-hidden />
          {heroArt.layers.map((layer, index) => (
            <Layer
              key={`${layer.depth}-${index}`}
              layer={layer}
              progress={scrollYProgress}
              reduced={reduced}
              onLoad={index === 0 ? () => setLoaded(true) : undefined}
            >
              {layer.depth === "ground" && (
                <motion.div className="h-pins" style={{ opacity: pinOpacity }}>
                  {heroPins.map((pin, i) => (
                    <button
                      key={pin.id}
                      type="button"
                      className={`h-pin ${pin.atMobile ? "" : "h-pin-wide"}`}
                      style={
                        {
                          "--x": pin.at[0],
                          "--y": pin.at[1],
                          "--mx": pin.atMobile?.[0] ?? 0,
                          "--my": pin.atMobile?.[1] ?? 0,
                          "--d": i,
                        } as CSSProperties
                      }
                      onClick={() => goToStop(pin.stop)}
                      aria-label={`${pin.label}, ${pin.when}: ${pin.fact}. Open this stop in the journey.`}
                    >
                      <span className="h-pin-label">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={pin.logo} alt="" width={26} height={26} />
                        <span>
                          <strong>{pin.label}</strong>
                          <small>{pin.when}</small>
                        </span>
                      </span>
                      <span className="h-pin-tip">{pin.fact}</span>
                      <span className="h-pin-stem" />
                      <span className="h-pin-dot" />
                    </button>
                  ))}
                  <span className="h-pin-hint" aria-hidden>
                    every point is a stop. tap one
                    <Sketch kind="arrow" seed={4} />
                  </span>
                </motion.div>
              )}
            </Layer>
          ))}
        </div>
        <motion.button
          type="button"
          className="h-me"
          style={{ y: frontY }}
          onClick={scrollToLife}
          aria-label="That’s me. Go to the off-the-clock board."
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroArt.cutout.src}
            width={heroArt.cutout.width}
            height={heroArt.cutout.height}
            alt={heroArt.cutout.alt}
            decoding="async"
          />
          <span className="h-me-tag">
            That’s me <Sketch kind="arrow" seed={8} />
          </span>
        </motion.button>
        <motion.div className="h-bokeh" style={{ y: frontY, scale: frontScale }} aria-hidden>
          <span />
          <span />
          <span />
          <span />
          <span />
        </motion.div>
        <div className="h-sky-light" aria-hidden />
        <div className="h-stars" aria-hidden />
        <svg className="h-birds" viewBox="0 0 120 40" aria-hidden>
          {[
            [8, 22, 1],
            [24, 14, 0.8],
            [38, 25, 0.9],
            [52, 10, 0.7],
          ].map(([x, y, s], i) => (
            <path
              key={i}
              className="h-bird"
              style={{ "--b": i } as CSSProperties}
              transform={`translate(${x} ${y}) scale(${s})`}
              d="M-6 0 Q-3 -3 0 0 Q3 -3 6 0"
            />
          ))}
        </svg>
        <div className="h-motes" aria-hidden>
          {motes.map((m, i) => (
            <span
              key={i}
              style={
                {
                  left: `${m.x}%`,
                  top: `${m.y}%`,
                  width: m.size,
                  height: m.size,
                  animationDelay: `${m.delay}s`,
                  animationDuration: `${m.drift}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <div className="h-shade" aria-hidden />
      </div>

      <motion.div className="h-ribbon" style={{ opacity: uiOpacity }}>
        A little world of data, ideas & things I build
      </motion.div>

      <motion.div className="h-copy" style={{ y: copyY, opacity: copyOpacity }}>
        <p className="h-hello">
          <span className="h-signal" aria-hidden>
            <i />
          </span>
          hey, I’m Baltej
        </p>
        <h1>
          <span className="h-line">
            <span>Turning data into</span>
          </span>
          <span className="h-line">
            <span>
              <span className="h-useful">
                something useful.
                <Sketch kind="trend" seed={12} className="h-trend" />
              </span>
            </span>
          </span>
        </h1>
        <p className="h-sub">
          Data analyst. AI engineer. Co-founder of Sanket.
          <br />
          Curious enough to build the whole thing.
        </p>
      </motion.div>

      <motion.button type="button" className="h-music" onClick={openMusic} style={{ opacity: uiOpacity }}>
        <span className="h-eq" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <Music2 size={16} /> A little Anirudh?
      </motion.button>

      <motion.a href="#story" className="h-cue" style={{ opacity: uiOpacity }}>
        <span className="h-mouse" aria-hidden>
          <i />
        </span>
        scroll to wander in <ArrowDown size={14} />
      </motion.a>
    </section>
  );
}
