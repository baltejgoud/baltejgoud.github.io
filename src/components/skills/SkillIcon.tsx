import { skillIcons } from "./icons";
import type { Skill } from "@/content/types";

/** Brand logo in its own colour, or the element symbol when the skill has no logo. */
export function SkillIcon({ skill, className }: { skill: Skill; className?: string }) {
  const icon = skill.icon ? skillIcons[skill.icon] : undefined;
  if (!icon) {
    return (
      <span aria-hidden className="text-2xl font-extrabold tracking-tight lg:text-4xl">
        {skill.symbol}
      </span>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label={`${icon.title} logo`}>
      <path d={icon.path} fill={`#${icon.hex}`} />
    </svg>
  );
}
