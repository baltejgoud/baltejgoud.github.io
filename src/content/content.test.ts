import { describe, expect, it } from "vitest";
import { achievements } from "@/content/achievements";
import { certifications } from "@/content/certifications";
import { journey } from "@/content/journey";
import { projects } from "@/content/projects";
import { skills } from "@/content/skills";
import { categoryOrder } from "@/lib/skills";

describe("skills", () => {
  it("has 32 elements with unique ids and symbols", () => {
    expect(skills).toHaveLength(32);
    expect(new Set(skills.map((s) => s.id)).size).toBe(32);
    expect(new Set(skills.map((s) => s.symbol)).size).toBe(32);
  });

  it("uses periodic-table style symbols", () => {
    for (const s of skills) expect(s.symbol).toMatch(/^[A-Z][a-z]?$/);
  });

  it("fills every category", () => {
    for (const c of categoryOrder) {
      expect(skills.filter((s) => s.category === c).length).toBeGreaterThanOrEqual(5);
    }
  });

  it("explains how each skill is used", () => {
    for (const s of skills) expect(s.usage.length).toBeGreaterThan(10);
  });
});

describe("projects", () => {
  it("has six projects with sequential indexes and unique widgets", () => {
    expect(projects.map((p) => p.index)).toEqual(["01", "02", "03", "04", "05", "06"]);
    expect(new Set(projects.map((p) => p.widget)).size).toBe(6);
  });

  it("lists 4–6 features, a stack and at least one link", () => {
    for (const p of projects) {
      expect(p.features.length).toBeGreaterThanOrEqual(4);
      expect(p.features.length).toBeLessThanOrEqual(6);
      expect(p.stack.length).toBeGreaterThan(0);
      expect(p.links.github ?? p.links.caseStudy).toBeTruthy();
    }
  });

  it("only links to Baltej's GitHub and local case studies", () => {
    for (const p of projects) {
      if (p.links.github) expect(p.links.github).toMatch(/^https:\/\/github\.com\/baltejgoud\//);
      if (p.links.caseStudy) expect(p.links.caseStudy).toMatch(/^\/work\/[a-z]+\/$/);
    }
  });
});

describe("journey", () => {
  it("runs from education to an open next step", () => {
    expect(journey[0].kind).toBe("education");
    expect(journey.at(-1)?.kind).toBe("next");
  });

  it("gives every milestone a role and an organisation", () => {
    for (const m of journey) {
      expect(m.role).toBeTruthy();
      expect(m.org).toBeTruthy();
    }
  });
});

describe("achievements", () => {
  it("has eight cards, each with a metric", () => {
    expect(achievements).toHaveLength(8);
    for (const a of achievements) expect(a.metric).toBeTruthy();
  });
});

describe("certifications", () => {
  it("has a title and issuer for every entry", () => {
    for (const c of certifications) {
      expect(c.title).toBeTruthy();
      expect(c.issuer).toBeTruthy();
    }
  });
});
