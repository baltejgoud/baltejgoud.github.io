import type { Fact, HeroMediaContent } from "./types";

export const profile = {
  name: "Baltej Goud",
  fullName: "Panagatla Baltej Goud",
  firstName: "Baltej",
  monogram: "BG",
  title: { lead: "Data", accent: "Analyst." },
  tagline: "Data analyst · AI engineer · Co-founder of Sanket",
  email: "baltej.panagatla@gmail.com",
  location: "Hyderabad, India",
  copyrightYear: 2026,
  links: {
    linkedin: "https://www.linkedin.com/in/baltejgoud",
    github: "https://github.com/baltejgoud",
    resume: "/resume.html",
  },
  bio: [
    "I’m a data analyst and AI engineer who makes complex data useful — through clear analysis, machine learning and software that solves real problems. I’ve worked on data analysis at Haritha Industries and machine-learning delivery at Tectoro Consulting.",
    "As co-founder & CEO of Sanket, I connect product direction with demand forecasting and inventory intelligence. Outside of that, I keep building — from a 3D AI workspace to privacy-first health tools.",
  ],
  whatIDo: [
    "Data analysis & business reporting",
    "Forecasting & machine learning",
    "Agentic AI & MCP integrations",
    "Full-stack product engineering",
    "Dashboards & data visualisation",
    "Product strategy at Sanket",
  ],
  facts: [
    { label: "Location", value: "Hyderabad, India" },
    { label: "Education", value: "B.Tech CSE, BVRIT Narsapur" },
    { label: "CGPA", value: "6.1 / 10" },
    { label: "Graduation", value: "2023" },
    { label: "Focus", value: "Data analysis · AI/ML" },
    { label: "Status", value: "Open to data & AI roles", live: true },
  ] satisfies Fact[],
  quote: "Make complex data useful.",
  idCard: {
    heading: "Developer ID",
    roles: ["Data Analyst", "AI Engineer", "Founder"],
    number: "BG-2023-HYD",
    barcodeSeed: "BALTEJGOUD",
  },
  contact: {
    lead: "Let’s build something",
    accent: "useful.",
    line: "Hiring for data or AI roles, or building something that runs on data? I’d love to hear about it.",
  },
};

export const hero: HeroMediaContent = {
  image: {
    src: "/images/portrait-cutout.webp",
    alt: "Baltej Goud smiling, in a white shirt and tie",
  },
};
