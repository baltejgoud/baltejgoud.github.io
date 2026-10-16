import { About } from "@/components/about/About";
import { Certifications } from "@/components/certs/Certifications";
import { Hero } from "@/components/hero/Hero";
import { Journey } from "@/components/journey/Journey";
import { Navbar } from "@/components/layout/Navbar";
import { Skills } from "@/components/skills/Skills";
import { Work } from "@/components/work/Work";
import { sections } from "@/content/sections";
import { sectionIndices } from "@/lib/sections";

export default function Home() {
  const index = sectionIndices(sections);
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <About index={index.about} />
        <Skills index={index.skills} />
        <Work index={index.work} />
        <Certifications index={index.certifications} />
        <Journey index={index.experience} />
      </main>
    </>
  );
}
