/** Narrative copy uses Baltej's supplied dates and the existing portfolio facts. */
export const journeyStories = [
  {
    name: "BVRIT",
    place: "Narsapur",
    color: "#D2553A",
    logo: "bvrit",
    website: "https://bvrit.ac.in/",
    title: "It started with computer science.",
    story:
      "From 2019 to 2023, I studied Computer Science & Engineering at B V Raju Institute of Technology. That foundation in programming, statistics and how systems work became the starting point for everything I build today.",
    takeaway: "B.Tech · Computer Science & Engineering",
    detail: "Class of 2023 · CGPA 6.1 / 10",
  },
  {
    name: "BVRIT · Tutoring",
    place: "Narsapur",
    color: "#7B5CD6",
    logo: "bvrit",
    website: "https://bvrit.ac.in/",
    title: "Learning it. Then teaching it.",
    story:
      "Between January and June 2023, I worked as a Lead Computer Science Tutor at BVRIT. I tutored more than 500 students in data cleaning, visualisation, statistical analysis and core computer-science topics.",
    takeaway: "500+ students tutored",
    detail: "Data analysis · Statistics · Computer science",
  },
  {
    name: "Freelance",
    place: "Independent",
    color: "#267C62",
    logo: null,
    website: null,
    title: "The first chapter on my own.",
    story:
      "After finishing my B.Tech in June 2023, I took on independent development work. Freelancing was the next chapter before joining Haritha Industries in March 2024.",
    takeaway: "Independent development",
    detail: "June 2023 → February 2024",
  },
  {
    name: "Haritha Industries",
    place: "Hyderabad",
    color: "#239FC2",
    logo: "haritha",
    website: "https://harithaindustries.com/",
    title: "Making business data useful.",
    story:
      "I joined Haritha Industries as a full-time Data Analyst in March 2024. My work brings together data cleaning, exploratory analysis and visual reporting to turn operational data into business insights.",
    takeaway: "Full-time · Data Analyst",
    detail: "March 2024 → Present",
  },
  {
    name: "Tectoro",
    place: "Hyderabad",
    color: "#EC7851",
    logo: "tectoro",
    website: "https://www.tectoro.com/",
    title: "Going deeper into machine learning.",
    story:
      "From October to December 2025, I completed a three-month AI/ML engineering internship at Tectoro Consulting. Alongside my full-time role at Haritha, I worked on AI/ML solutions and machine-learning pipelines.",
    takeaway: "Three-month AI/ML internship",
    detail: "Alongside my full-time role at Haritha",
  },
  {
    name: "Sanket",
    place: "Building now",
    color: "#428B91",
    logo: "sanket",
    website: null,
    title: "From building products to building a company.",
    story:
      "As co-founder & CEO of Sanket, I connect product direction, engineering and machine learning. We’re building demand forecasting and inventory intelligence across fashion, electronics, pharma and agro — around the decisions a planning team actually makes.",
    takeaway: "Co-founder & CEO",
    detail: "Four verticals · SKU-level demand forecasting",
    gallery: [
      {
        src: "/assets/work/sanket-dashboard.webp",
        caption: "The planning workspace",
      },
      {
        src: "/assets/work/sanket-forecasts.webp",
        caption: "Forecasts, with uncertainty",
      },
    ],
  },
  {
    name: "What’s next?",
    place: "Let’s find out",
    color: "#BC9255",
    logo: null,
    website: null,
    title: "The next stop could be your team.",
    story:
      "I’m open to data and AI roles where clear analysis meets useful software. If you’re building something that runs on data, I’d love to talk about what we could make together.",
    takeaway: "Open to data & AI roles",
    detail: "Hyderabad, India · Let’s talk",
  },
] as const;
