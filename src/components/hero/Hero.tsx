import { HeroMedia } from "./HeroMedia";
import { HeroPointer } from "./HeroPointer";
import { Watermark } from "./Watermark";
import { Pill } from "@/components/ui/Pill";
import { hero, profile } from "@/content/profile";
import { vars } from "@/lib/style";

export function Hero() {
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[max(100svh,640px)] flex-col overflow-hidden pt-[var(--nav-h)]"
    >
      <HeroPointer />
      <div
        className="parallax pointer-events-none absolute inset-x-0 top-[calc(var(--nav-h)+4svh)] -z-10 md:top-[16svh]"
        style={vars({ "--depth": -12 })}
      >
        <Watermark text={profile.firstName} />
      </div>
      <div
        className="parallax relative mx-auto mt-6 h-[56svh] w-full max-w-[420px] md:absolute md:inset-x-0 md:bottom-0 md:mt-0 md:h-[84svh] md:max-w-none"
        style={vars({ "--depth": 6 })}
      >
        <HeroMedia {...hero} />
      </div>
      <div className="container-page relative z-10 mt-auto flex flex-col gap-6 pb-8 pt-6 md:flex-row md:items-end md:justify-between md:pb-12">
        <div>
          <p className="label hero-fade" style={vars({ "--delay": "350ms" })}>
            {profile.fullName}
          </p>
          <h1
            id="hero-title"
            className="mt-3 text-[clamp(3rem,7vw,7.5rem)] font-extrabold leading-[0.92] tracking-[-0.045em]"
          >
            <span className="mask block">
              <span className="hero-rise" style={vars({ "--delay": "450ms" })}>
                {profile.title.lead}
              </span>
            </span>
            <span className="mask block">
              <span className="hero-rise accent" style={vars({ "--delay": "540ms" })}>
                {profile.title.accent}
              </span>
            </span>
          </h1>
          <p className="hero-fade mt-4 max-w-sm text-stone" style={vars({ "--delay": "700ms" })}>
            {profile.tagline}
          </p>
        </div>
        <div className="hero-fade" style={vars({ "--delay": "800ms" })}>
          <Pill href="#work" magnetic>
            Explore work <span aria-hidden>↓</span>
          </Pill>
        </div>
      </div>
    </section>
  );
}
