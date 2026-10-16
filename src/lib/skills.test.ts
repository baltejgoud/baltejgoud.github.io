import { describe, expect, it } from "vitest";
import { skills } from "@/content/skills";
import { categoryOrder, filterAnnouncement, idsInCategory } from "@/lib/skills";

describe("idsInCategory", () => {
  it("returns every id when no category is selected", () => {
    expect(idsInCategory(skills, null).size).toBe(skills.length);
  });

  it("returns exactly the ids of the selected category", () => {
    expect([...idsInCategory(skills, "frontend")]).toEqual([
      "react",
      "nextjs",
      "threejs",
      "electron",
      "tailwind",
    ]);
  });
});

describe("filterAnnouncement", () => {
  it("describes the unfiltered state", () => {
    expect(filterAnnouncement(skills, null)).toBe("All elements shown");
  });

  it("counts the highlighted elements", () => {
    expect(filterAnnouncement(skills, "core")).toBe("6 Core elements highlighted");
  });
});

describe("categoryOrder", () => {
  it("lists all six categories once", () => {
    expect(new Set(categoryOrder).size).toBe(6);
  });
});
