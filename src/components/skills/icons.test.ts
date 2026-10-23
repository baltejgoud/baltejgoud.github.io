import { describe, expect, it } from "vitest";
import { skillIcons } from "./icons";
import { skills } from "@/content/skills";

describe("skillIcons", () => {
  it("has a logo for every skill that names one", () => {
    for (const s of skills) if (s.icon) expect(skillIcons[s.icon], s.icon).toBeDefined();
  });

  it("imports no unused logos", () => {
    const used = new Set(skills.map((s) => s.icon).filter(Boolean));
    for (const slug of Object.keys(skillIcons)) expect(used.has(slug), slug).toBe(true);
  });
});
