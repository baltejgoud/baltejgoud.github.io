import { describe, expect, it } from "vitest";
import { pad2, sectionIndices } from "@/lib/sections";

const base = [
  { id: "about", visible: true },
  { id: "skills", visible: true },
  { id: "work", visible: true },
  { id: "certifications", visible: false },
  { id: "experience", visible: true },
  { id: "achievements", visible: true },
];

describe("sectionIndices", () => {
  it("numbers visible sections only, with two digits", () => {
    expect(sectionIndices(base)).toEqual({
      about: "01",
      skills: "02",
      work: "03",
      experience: "04",
      achievements: "05",
    });
  });

  it("gives certifications 04 and shifts later sections when it is visible", () => {
    const withCerts = base.map((s) => (s.id === "certifications" ? { ...s, visible: true } : s));
    expect(sectionIndices(withCerts)).toEqual({
      about: "01",
      skills: "02",
      work: "03",
      certifications: "04",
      experience: "05",
      achievements: "06",
    });
  });
});

describe("pad2", () => {
  it("pads single digits", () => {
    expect(pad2(3)).toBe("03");
    expect(pad2(12)).toBe("12");
  });
});
