import { profile } from "@/content/profile";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="container-page flex flex-col gap-3 py-8 font-mono text-xs text-stone sm:flex-row sm:items-center sm:justify-between">
        <span>
          © {profile.copyrightYear} {profile.name}
        </span>
        <span>Designed &amp; built with Next.js</span>
        <a href="#top" className="text-ink hover:underline">
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
