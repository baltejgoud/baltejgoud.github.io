import { About } from "@/components/about/About";
import { Hero } from "@/components/hero/Hero";
import { Navbar } from "@/components/layout/Navbar";
import { Skills } from "@/components/skills/Skills";
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
      </main>
    </>
  );
}
