export type SkillCategory =
  | "languages"
  | "frontend"
  | "backend"
  | "databases"
  | "tools"
  | "core";

export interface Skill {
  id: string;
  /** One or two letters, periodic-table style */
  symbol: string;
  name: string;
  category: SkillCategory;
  /** simple-icons slug; omitted when the technology has no logo */
  icon?: string;
  usage: string;
}

export type WidgetKind =
  | "forecast"
  | "atlas"
  | "import"
  | "fairPrice"
  | "custody"
  | "reconcile";

export interface Project {
  id: string;
  index: string;
  title: string;
  category: string;
  role: string;
  summary: string;
  features: string[];
  stack: string[];
  links: { github?: string; caseStudy?: string };
  widget: WidgetKind;
}

export interface Certification {
  title: string;
  issuer: string;
  year?: string;
  href?: string;
}

export interface Milestone {
  kind: "education" | "experience" | "next";
  dates?: string;
  role: string;
  org: string;
  bullets: string[];
  tags: string[];
  /** Giant background year shown beside this milestone */
  watermark?: string;
}

export type AchievementIcon =
  | "trophy"
  | "award"
  | "graduation"
  | "layers"
  | "bot"
  | "plug"
  | "apple"
  | "chart";

export interface Achievement {
  icon: AchievementIcon;
  title: string;
  description: string;
  metric: string;
  size?: "wide";
}

export interface Fact {
  label: string;
  value: string;
  /** Shows the pulsing availability dot */
  live?: boolean;
}

export interface HeroMediaContent {
  image: { src: string; alt: string };
  /** Optional talking-avatar clip; the sound toggle appears only when set */
  video?: { src: string; poster: string };
}
