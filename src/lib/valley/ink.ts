/**
 * Splits copy into words while keeping every space (leading ones included), so the joined words
 * match the original text exactly. InkText gives each word an index; CSS then inks word i once
 * `--ink * (count + soft) - i` passes 0, fully inked `soft` words later.
 */
export function splitWords(text: string): string[] {
  const words = text.match(/\s*\S+\s*/g);
  if (words) return words;
  return text ? [text] : [];
}
