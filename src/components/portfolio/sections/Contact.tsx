"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useInView } from "motion/react";
import { ArrowUp, ArrowUpRight, BriefcaseBusiness, Copy, GitFork as Github, ContactRound as Linkedin, Mail, Radio } from "lucide-react";
import { profile } from "@/content/profile";
import { wallNotes } from "@/content/notes";
import { NOTE_LIMITS, noteMailto, noteText } from "@/lib/valley/note";
import { useSite } from "../SiteContext";
import "./contact.css";

const colors = ["yellow", "blue", "pink", "green"] as const;

const channels = [
  { key: "E", label: "Email", line: "Roles, projects, or just hi.", href: `mailto:${profile.email}`, icon: Mail, external: false },
  { key: "L", label: "LinkedIn", line: "The work and the journey.", href: profile.links.linkedin, icon: Linkedin, external: true },
  { key: "G", label: "GitHub", line: "The things I build.", href: profile.links.github, icon: Github, external: true },
  { key: "R", label: "Résumé", line: "The story, on one page.", href: profile.links.resume, icon: BriefcaseBusiness, external: false },
];

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function Contact() {
  const { toast } = useSite();
  const section = useRef<HTMLElement>(null);
  const inView = useInView(section, { amount: 0.3 });
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [color, setColor] = useState<(typeof colors)[number]>("yellow");
  const [pinging, setPinging] = useState(0);
  const [pressed, setPressed] = useState<string | null>(null);

  // Single-letter shortcuts, only while this section is on screen and nobody is typing.
  useEffect(() => {
    if (!inView) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true'], dialog")) return;
      const channel = channels.find((c) => c.key === event.key.toUpperCase());
      if (!channel) return;
      event.preventDefault();
      setPressed(channel.key);
      window.setTimeout(() => setPressed(null), 220);
      if (channel.external) window.open(channel.href, "_blank", "noopener");
      else window.location.href = channel.href;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inView]);

  const transmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) return;
    setPinging((n) => n + 1);
    toast("Opening your mail app with the note ready to send.");
    const href = noteMailto(profile.email, { name, message });
    window.setTimeout(() => {
      window.location.href = href;
    }, 520);
  };
  const copyNote = async () => {
    if (!message.trim()) {
      toast("Write something first, then copy it.");
      return;
    }
    toast((await copyText(noteText({ name, message }))) ? `Copied. Paste it into an email to ${profile.email}.` : `Email it to ${profile.email}.`);
  };
  const copyEmail = async () => {
    toast((await copyText(profile.email)) ? "Email copied. Say hello!" : `Email me at ${profile.email}`);
  };

  return (
    <section id="hello" ref={section} className="p-section c-contact p-paper-edge" data-dock="hello">
      <span id="contact" className="p-anchor-alias" aria-hidden />
      <div className="c-radar" aria-hidden>
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="p-wrap">
        <div className="c-head" data-reveal>
          <p className="c-eyebrow">
            <Radio size={15} /> Send a signal
          </p>
          <h2>
            Let’s make
            <br />
            something <span>useful.</span>
          </h2>
          <p className="c-lead">Hiring for data or AI roles? Have a problem worth solving? I’d love to hear about it.</p>
        </div>

        {wallNotes.length > 0 && (
          <div className="c-received" data-reveal>
            <p className="c-received-label">Signals received</p>
            <ul>
              {wallNotes.map((note) => (
                <li key={`${note.name}-${note.message.slice(0, 12)}`} className={`c-wall-note c-note-${note.color}`}>
                  <p>“{note.message}”</p>
                  <strong>{note.name}</strong>
                  {note.role && <small>{note.role}</small>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="c-grid">
          <form className={`c-composer c-note-${color}`} onSubmit={transmit} data-reveal>
            <span className="p-tape" />
            <p className="c-composer-title">Leave me a note</p>
            <label className="sr-only" htmlFor="c-message">
              Your note
            </label>
            <textarea
              id="c-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={NOTE_LIMITS.message}
              rows={5}
              required
              placeholder="A hello, a role, a problem worth solving…"
            />
            <label className="c-name">
              <span>from</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={NOTE_LIMITS.name}
                placeholder="your name"
                autoComplete="name"
              />
            </label>
            <div className="c-composer-foot">
              <div className="c-colors" role="group" aria-label="Note colour">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`c-note-${c}`}
                    aria-label={`${c} paper`}
                    aria-pressed={color === c}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
              <div className="c-actions">
                <button type="button" className="p-text-link" onClick={copyNote}>
                  <Copy size={15} /> Copy
                </button>
                <button type="submit" className="p-button p-dark-button c-transmit">
                  {pinging > 0 && <span key={pinging} className="c-ping" aria-hidden />}
                  Transmit <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
            <small className="c-composer-note">Transmit opens your email app with the note filled in, so you can check it before it’s sent.</small>
          </form>

          <div className="c-channels" data-reveal>
            {channels.map(({ key, label, line, href, icon: Icon, external }, i) => (
              <a
                key={key}
                href={href}
                className={`c-key ${pressed === key ? "is-pressed" : ""}`}
                style={{ "--i": i } as CSSProperties}
                {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                <span className="c-key-cap">
                  <Icon size={26} strokeWidth={1.7} />
                  <kbd>{key}</kbd>
                </span>
                <span className="c-key-text">
                  <strong>{label}</strong>
                  <small>{line}</small>
                </span>
                <ArrowUpRight size={17} className="c-key-arrow" />
              </a>
            ))}
            <p className="c-shortcuts" aria-hidden>
              shortcuts work while you’re here: <kbd>E</kbd> <kbd>L</kbd> <kbd>G</kbd> <kbd>R</kbd>
            </p>
            <div className="c-email">
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
              <button type="button" aria-label="Copy email address" onClick={copyEmail}>
                <Copy size={16} />
              </button>
            </div>
          </div>
        </div>

        <footer className="c-footer">
          <span>
            © {profile.copyrightYear} {profile.name}
          </span>
          <span>Made with curiosity, in Hyderabad.</span>
          <a href="#top">
            Back to the valley <ArrowUp size={14} />
          </a>
        </footer>
      </div>
    </section>
  );
}
