import { certifications } from "./certifications";

export type SectionId =
  | "about"
  | "skills"
  | "work"
  | "certifications"
  | "experience"
  | "achievements";

/** Numbered sections in page order. Index numbers come from lib/sections.ts, never hard-coded. */
export const sections: { id: SectionId; label: string; visible: boolean }[] = [
  { id: "about", label: "About", visible: true },
  { id: "skills", label: "Skills", visible: true },
  { id: "work", label: "Selected work", visible: true },
  { id: "certifications", label: "Certifications", visible: certifications.length > 0 },
  { id: "experience", label: "Journey", visible: true },
  { id: "achievements", label: "Achievements", visible: true },
];

export const navItems = [
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "work", label: "Work" },
  { id: "experience", label: "Experience" },
  { id: "achievements", label: "Achievements" },
  { id: "contact", label: "Contact" },
] as const;

export const navIds: readonly string[] = navItems.map((item) => item.id);
