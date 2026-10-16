import type { Milestone } from "./types";

/** Chronological, top to bottom. Jobs carry no dates because none are on record. */
export const journey: Milestone[] = [
  {
    kind: "education",
    dates: "2019 – 2023",
    role: "B.Tech, Computer Science & Engineering",
    org: "B V Raju Institute of Technology, Narsapur",
    bullets: ["Graduated in 2023", "CGPA 6.1 / 10"],
    tags: ["CSE", "B.Tech"],
    watermark: "2019",
  },
  {
    kind: "experience",
    role: "Lead Computer Science Tutor",
    org: "B V Raju Institute of Technology",
    bullets: [
      "Tutored 500+ students",
      "Data cleaning, visualisation, statistical analysis and core computer-science topics",
    ],
    tags: ["Teaching", "Statistics", "Data analysis"],
    watermark: "2023",
  },
  {
    kind: "experience",
    role: "AI/ML Engineer",
    org: "Tectoro Consulting Private Limited",
    bullets: [
      "Developed and deployed AI/ML solutions",
      "Real-world machine-learning pipelines and intelligent application development",
    ],
    tags: ["Machine learning", "Python", "Pipelines"],
  },
  {
    kind: "experience",
    role: "Data Analyst",
    org: "Haritha Industries",
    bullets: [
      "Data cleaning, exploratory analysis and visual reporting",
      "Business insights from operational data",
    ],
    tags: ["Data cleaning", "EDA", "Reporting"],
  },
  {
    kind: "experience",
    dates: "Now",
    role: "Co-founder & CEO",
    org: "Sanket",
    bullets: [
      "Building a predictive intelligence business that connects operational data, machine learning and product design",
      "Demand forecasting and inventory intelligence across four verticals",
    ],
    tags: ["Forecasting", "Product", "Leadership"],
    watermark: "Now",
  },
  {
    kind: "next",
    role: "Your team?",
    org: "Open to data & AI roles",
    bullets: [],
    tags: [],
    watermark: "Next?",
  },
];
