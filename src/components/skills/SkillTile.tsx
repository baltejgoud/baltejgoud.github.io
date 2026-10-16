import type { Skill } from "@/content/types";
import { cn } from "@/lib/cn";
import { categoryMeta } from "@/lib/skills";

interface SkillTileProps {
  skill: Skill;
  number: number;
  state: "idle" | "match" | "dim";
  selected: boolean;
  tabIndex: number;
  onPreview: () => void;
  onFocus: () => void;
}

export function SkillTile({ skill, number, state, selected, tabIndex, onPreview, onFocus }: SkillTileProps) {
  return (
    <button
      type="button"
      tabIndex={tabIndex}
      onMouseEnter={onPreview}
      onClick={onPreview}
      onFocus={onFocus}
      aria-label={`${skill.name}, ${categoryMeta[skill.category].label}`}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "relative aspect-square rounded-[14px] border text-left transition-[background-color,color,opacity,border-color,transform,box-shadow] duration-300 ease-out-expo",
        state === "match"
          ? "border-ink bg-ink text-cream"
          : "border-line bg-paper/70 text-ink hover:-translate-y-0.5 hover:border-ink/40",
        state === "dim" && "opacity-35",
        selected && state !== "match" && "border-ink shadow-card",
      )}
    >
      <span className="absolute left-2 top-1.5 font-mono text-[10px] opacity-60">{number}</span>
      <span
        aria-hidden
        className="absolute right-2 top-2 size-1.5 rounded-full"
        style={{ background: categoryMeta[skill.category].color }}
      />
      <span className="absolute inset-0 grid place-items-center text-[1.4rem] font-extrabold tracking-tight sm:text-2xl md:text-[1.7rem] xl:text-[2rem]">
        {skill.symbol}
      </span>
      <span className="absolute inset-x-2 bottom-1.5 truncate text-[9.5px] font-medium opacity-70 md:text-[10.5px]">
        {skill.name}
      </span>
    </button>
  );
}
