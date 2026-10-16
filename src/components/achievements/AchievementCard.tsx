import { Apple, Award, Bot, ChartLine, GraduationCap, Layers, Plug, Trophy, type LucideIcon } from "lucide-react";
import type { Achievement, AchievementIcon } from "@/content/types";
import { cn } from "@/lib/cn";
import { pad2 } from "@/lib/sections";

const icons: Record<AchievementIcon, LucideIcon> = {
  trophy: Trophy,
  award: Award,
  graduation: GraduationCap,
  layers: Layers,
  bot: Bot,
  plug: Plug,
  apple: Apple,
  chart: ChartLine,
};

export function AchievementCard({ achievement, index }: { achievement: Achievement; index: number }) {
  const Icon = icons[achievement.icon];
  return (
    <article
      className={cn(
        "flex h-[320px] shrink-0 snap-start flex-col justify-between rounded-[24px] border border-line bg-paper p-6 shadow-card",
        achievement.size === "wide" ? "w-[min(560px,86vw)]" : "w-[min(400px,82vw)]",
      )}
    >
      <div className="flex items-start justify-between">
        <span className="grid size-11 place-items-center rounded-xl bg-ink text-cream">
          <Icon aria-hidden className="size-5" />
        </span>
        <span className="font-mono text-xs text-stone">{pad2(index + 1)}</span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className="max-w-[13rem]">
          <h3 className="font-bold leading-snug">{achievement.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-stone">{achievement.description}</p>
        </div>
        <p className="shrink-0 text-right text-[clamp(2.25rem,3.6vw,3.5rem)] font-extrabold leading-[0.85] tracking-[-0.05em]">
          {achievement.metric}
        </p>
      </div>
    </article>
  );
}
