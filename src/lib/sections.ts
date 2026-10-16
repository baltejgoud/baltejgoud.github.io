export interface SectionEntry {
  id: string;
  visible: boolean;
}

/** Two-digit index for each visible section, in order: { about: "01", … }. Hidden sections get none. */
export function sectionIndices(list: readonly SectionEntry[]): Record<string, string> {
  const indices: Record<string, string> = {};
  let n = 0;
  for (const section of list) if (section.visible) indices[section.id] = pad2(++n);
  return indices;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
