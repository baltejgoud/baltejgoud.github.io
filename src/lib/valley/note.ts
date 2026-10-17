export interface DraftNote {
  name: string;
  message: string;
}

export const NOTE_LIMITS = { name: 60, message: 1200 } as const;

/** Trims and clamps a draft so the mail link stays within what mail clients accept. */
export function cleanNote(note: DraftNote): DraftNote {
  return {
    name: note.name.trim().slice(0, NOTE_LIMITS.name),
    message: note.message.trim().slice(0, NOTE_LIMITS.message),
  };
}

/** A mailto: link that opens the visitor's mail app with the note ready to send. */
export function noteMailto(to: string, note: DraftNote): string {
  const { name, message } = cleanNote(note);
  const from = name || "a visitor";
  const subject = `A note from ${from}, via your portfolio`;
  const body = `${message}\n\n— ${from}`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Plain-text version for the copy-to-clipboard fallback. */
export function noteText(note: DraftNote): string {
  const { name, message } = cleanNote(note);
  return `${message}\n\n— ${name || "a visitor"}`;
}
