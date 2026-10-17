import type { DepthName } from "@/lib/valley/camera";

/** A point in the painting, as fractions of its width and height. */
export type ArtPoint = readonly [x: number, y: number];

/**
 * One painted plane of the hero. Today the whole painting is a single "ground" plane; transparent
 * "sky" and "front" planes generated from docs/signal-valley-art.md slot in here unchanged.
 */
export interface HeroLayer {
  src: string;
  mobileSrc: string;
  depth: DepthName;
}

export interface HeroPin {
  id: string;
  label: string;
  /** The x-axis value of this data point: a real date range from the journey. */
  when: string;
  fact: string;
  logo: string;
  at: ArtPoint;
  /** Null hides the pin on phones, where the portrait painting crops it out. */
  atMobile: ArtPoint | null;
  /** Index into `journey` to open on click. */
  stop: number;
}

const painting = "/assets/portfolio-valley.webp";
const paintingMobile = "/assets/portfolio-valley-mobile.webp";

export const heroArt = {
  width: 1672,
  height: 941,
  mobileWidth: 900,
  mobileHeight: 1350,
  alt: "A painted valley: a sandstone university, a workshop by a turquoise lake and a glass observatory on the hill, joined by a winding stone path",
  layers: [{ src: painting, mobileSrc: paintingMobile, depth: "ground" }] satisfies HeroLayer[],
  /** Baltej standing in the foreground. A full-body cutout can replace this knee-up one. */
  cutout: {
    src: "/images/portrait-cutout.webp",
    width: 557,
    height: 1146,
    alt: "Baltej Goud, smiling, in a white shirt and tie",
  },
};

/** Places in the painting, labelled with real facts from the journey. */
export const heroPins: HeroPin[] = [
  {
    id: "bvrit",
    label: "BVRIT",
    when: "2019 – 23",
    fact: "B.Tech in Computer Science",
    logo: "/assets/logos/bvrit-mark.webp",
    at: [0.11, 0.72],
    atMobile: [0.3, 0.53],
    stop: 0,
  },
  {
    id: "haritha",
    label: "Haritha",
    when: "2024 → now",
    fact: "Data analyst, every day",
    logo: "/assets/logos/haritha-mark.webp",
    at: [0.5, 0.6],
    atMobile: [0.42, 0.665],
    stop: 3,
  },
  {
    id: "tectoro",
    label: "Tectoro",
    when: "Oct – Dec 2025",
    fact: "AI/ML engineering intern",
    logo: "/assets/logos/tectoro-mark.webp",
    at: [0.765, 0.43],
    atMobile: [0.76, 0.57],
    stop: 4,
  },
  {
    id: "sanket",
    label: "Sanket",
    when: "Now",
    fact: "Co-founder & CEO",
    logo: "/assets/logos/sanket-mark.webp",
    at: [0.9, 0.26],
    atMobile: null,
    stop: 5,
  },
];
