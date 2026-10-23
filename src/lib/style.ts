import type { CSSProperties } from "react";

/** Typed helper for inline CSS custom properties: style={vars({ "--delay": "120ms" })} */
export function vars(values: Record<`--${string}`, string | number>): CSSProperties {
  return values as CSSProperties;
}
