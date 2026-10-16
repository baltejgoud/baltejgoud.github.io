import { barcode } from "@/lib/barcode";

interface BarcodeProps {
  seed: string;
  width?: number;
  height?: number;
  className?: string;
}

export function Barcode({ seed, width = 120, height = 32, className }: BarcodeProps) {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden className={className}>
      {barcode(seed, width).map((bar) => (
        <rect key={bar.x} x={bar.x} y={0} width={bar.w} height={height} fill="currentColor" />
      ))}
    </svg>
  );
}
