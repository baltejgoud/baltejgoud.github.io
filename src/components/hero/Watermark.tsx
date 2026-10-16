import { vars } from "@/lib/style";

/** First name spread edge to edge as giant low-opacity letters that rise in on load. */
export function Watermark({ text }: { text: string }) {
  return (
    <div
      aria-hidden
      className="flex select-none justify-between overflow-hidden px-[1vw] text-[23vw] font-extrabold leading-[0.85] tracking-[-0.04em] text-watermark"
    >
      {text
        .toUpperCase()
        .split("")
        .map((letter, i) => (
          <span key={`${letter}-${i}`} className="hero-rise inline-block" style={vars({ "--delay": `${i * 40}ms` })}>
            {letter}
          </span>
        ))}
    </div>
  );
}
