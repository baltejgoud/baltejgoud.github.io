import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { heroArt, heroPins } from "@/content/hero";
import { lifePhotos } from "@/content/life";
import { wallNotes } from "@/content/notes";
import { workMedia } from "@/content/workMedia";
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
      expect(
        skills.filter((s) => s.category === c).length,
      ).toBeGreaterThanOrEqual(5);
    }
  });

  it("explains how each skill is used", () => {
    for (const s of skills) expect(s.usage.length).toBeGreaterThan(10);
  });
});

describe("projects", () => {
  it("has six projects with sequential indexes and unique widgets", () => {
    expect(projects.map((p) => p.index)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
    ]);
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
      if (p.links.github)
        expect(p.links.github).toMatch(/^https:\/\/github\.com\/baltejgoud\//);
      if (p.links.caseStudy)
        expect(p.links.caseStudy).toMatch(/^\/work\/[a-z]+\/$/);
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

const publicFile = (src: string) => existsSync(join(process.cwd(), "public", src));

describe("hero", () => {
  it("places every pin inside the painting and links it to a journey stop", () => {
    for (const pin of heroPins) {
      for (const point of [pin.at, pin.atMobile]) {
        if (!point) continue;
        for (const v of point) {
          expect(v).toBeGreaterThan(0);
          expect(v).toBeLessThan(1);
        }
      }
      expect(journey[pin.stop]).toBeDefined();
      expect(publicFile(pin.logo)).toBe(true);
    }
  });

  it("ships every layer and the portrait", () => {
    for (const layer of heroArt.layers) {
      expect(publicFile(layer.src)).toBe(true);
      expect(publicFile(layer.mobileSrc)).toBe(true);
    }
    expect(publicFile(heroArt.cutout.src)).toBe(true);
  });
});

describe("work media", () => {
  it("has a cover and existing screenshots for every project", () => {
    for (const p of projects) {
      const media = workMedia[p.id];
      expect(media).toBeDefined();
      for (const shot of [media.cover, ...media.shots]) {
        expect(publicFile(shot.src)).toBe(true);
        expect(shot.caption.length).toBeGreaterThan(5);
      }
    }
  });
});

describe("notes and photos", () => {
  it("only lists complete notes", () => {
    for (const n of wallNotes) {
      expect(n.name.trim()).toBeTruthy();
      expect(n.message.trim()).toBeTruthy();
    }
  });

  it("pins photos that exist, inside the board", () => {
    for (const photo of lifePhotos) {
      expect(publicFile(photo.src)).toBe(true);
      expect(photo.alt.trim()).toBeTruthy();
      expect(photo.left).toBeGreaterThanOrEqual(0);
      expect(photo.left).toBeLessThan(100);
      expect(photo.top).toBeGreaterThanOrEqual(0);
      expect(photo.top).toBeLessThan(100);
    }
  });
});
