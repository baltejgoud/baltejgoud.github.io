import { CopyEmail } from "./CopyEmail";
import { LocalTime } from "./LocalTime";
import { Pill } from "@/components/ui/Pill";
import { profile } from "@/content/profile";

export function Contact() {
  const { contact } = profile;
  return (
    <section id="contact" aria-labelledby="contact-title" className="section border-t border-line">
      <div className="container-page">
        <p className="label" data-reveal>
          Contact
        </p>
        <h2
          id="contact-title"
          className="mt-6 text-[clamp(2.75rem,8vw,7.5rem)] font-extrabold leading-[0.95] tracking-[-0.045em]"
          data-reveal="mask"
        >
          <span className="mask">
            <span>{contact.lead}</span>
          </span>{" "}
          <span className="mask">
            <span className="accent">{contact.accent}</span>
          </span>
        </h2>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-stone" data-reveal>
          {contact.line}
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4" data-reveal>
          <a
            href={`mailto:${profile.email}`}
            className="break-all text-[clamp(1.25rem,3vw,2.25rem)] font-semibold tracking-tight underline decoration-line decoration-2 underline-offset-8 transition-colors hover:decoration-ink"
          >
            {profile.email}
          </a>
          <CopyEmail email={profile.email} />
        </div>
        <div className="mt-8 flex flex-wrap gap-3" data-reveal>
          <Pill href={profile.links.linkedin} variant="outline" external>
            LinkedIn <span aria-hidden>↗</span>
          </Pill>
          <Pill href={profile.links.github} variant="outline" external>
            GitHub <span aria-hidden>↗</span>
          </Pill>
          <Pill href={profile.links.resume} variant="outline">
            Résumé <span aria-hidden>↗</span>
          </Pill>
        </div>
        <p className="mt-16 font-mono text-xs text-stone">
          {profile.location} · <LocalTime />
        </p>
      </div>
    </section>
  );
}
