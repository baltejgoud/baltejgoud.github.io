import Image from "next/image";
import { HeroVideo } from "./HeroVideo";
import type { HeroMediaContent } from "@/content/types";
import { vars } from "@/lib/style";

const fade = "[mask-image:linear-gradient(to_bottom,black_78%,transparent)]";

/** The cutout portrait, or a talking-avatar video with a sound toggle when one is configured. */
export function HeroMedia({ image, video }: HeroMediaContent) {
  if (video) return <HeroVideo video={video} alt={image.alt} className={fade} />;
  return (
    <div className={`hero-fade relative h-full w-full ${fade}`} style={vars({ "--delay": "150ms" })}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        loading="eager"
        fetchPriority="high"
        sizes="(min-width: 768px) 45vw, 90vw"
        className="object-contain object-bottom"
      />
    </div>
  );
}
