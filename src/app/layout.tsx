import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  DM_Sans,
  Instrument_Serif,
  JetBrains_Mono,
} from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { RevealObserver } from "@/components/layout/RevealObserver";
import { profile } from "@/content/profile";

const sans = DM_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});
const serif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});
const display = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});
const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const SITE = "https://baltejgoud.github.io";
const title = "Baltej Goud — Data Analyst & AI Engineer";
const description =
  "Baltej Goud is a data analyst, AI engineer and co-founder & CEO of Sanket. Selected work, skills, experience and résumé.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title,
  description,
  alternates: { canonical: "/" },
  icons: { icon: "/assets/favicon.svg" },
  openGraph: {
    type: "website",
    url: "/",
    title,
    description,
    images: [
      {
        url: "/assets/social-cover.jpg",
        width: 1200,
        height: 630,
        alt: "Baltej Goud — data analyst, AI engineer and co-founder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/assets/social-cover.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#fff9ed",
  colorScheme: "light dark",
};

/** Runs before first paint: enables motion styles, honours reduced motion, and reveals everything if the app never boots. */
const gate = `(function(d,w){var c=d.documentElement.classList;c.add("js");if(w.matchMedia("(prefers-reduced-motion: reduce)").matches)c.add("reduced");w.setTimeout(function(){if(!c.contains("app-ready"))c.add("reveal-all")},3000)})(document,window);`;

const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  alternateName: profile.fullName,
  jobTitle: ["Data Analyst", "AI Engineer", "Co-founder & CEO of Sanket"],
  url: `${SITE}/`,
  image: `${SITE}/profile.jpg`,
  email: `mailto:${profile.email}`,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Hyderabad",
    addressCountry: "IN",
  },
  worksFor: { "@type": "Organization", name: "Sanket" },
  sameAs: [profile.links.linkedin, profile.links.github],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${display.variable} ${serif.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: gate }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }}
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-cream"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
        <RevealObserver />
      </body>
    </html>
  );
}
