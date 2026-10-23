import type { Skill, SkillCategory } from "@/content/types";

export const categoryOrder: SkillCategory[] = [
  "languages",
  "frontend",
  "backend",
  "databases",
  "tools",
  "core",
];

export const categoryMeta: Record<SkillCategory, { label: string; color: string }> = {
  languages: { label: "Languages", color: "var(--color-cat-lang)" },
  frontend: { label: "Frontend", color: "var(--color-cat-front)" },
  backend: { label: "Backend", color: "var(--color-cat-back)" },
  databases: { label: "Databases", color: "var(--color-cat-data)" },
  tools: { label: "Tools", color: "var(--color-cat-tools)" },
  core: { label: "Core", color: "var(--color-cat-core)" },
};

/** Ids of the skills a filter highlights; `null` means no filter (every skill). */
export function idsInCategory(list: readonly Skill[], category: SkillCategory | null): Set<string> {
  return new Set(list.filter((s) => category === null || s.category === category).map((s) => s.id));
}

/** Text for the polite live region under the filter pills. */
export function filterAnnouncement(list: readonly Skill[], category: SkillCategory | null): string {
  if (category === null) return "All elements shown";
  const count = list.filter((s) => s.category === category).length;
  return `${count} ${categoryMeta[category].label} elements highlighted`;
}
