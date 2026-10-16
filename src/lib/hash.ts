import { hashString } from "./random";

/** Whether Web Crypto's SHA-256 is available (secure contexts and Node). */
export function hasWebCrypto(): boolean {
  return typeof globalThis.crypto?.subtle?.digest === "function";
}

/** Labelled, non-cryptographic fallback: FNV-1a as 8 hex characters. */
export function fnvHex(input: string): string {
  return hashString(input).toString(16).padStart(8, "0");
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** SHA-256 when available, otherwise the FNV fallback. */
export async function hashText(input: string): Promise<string> {
  return hasWebCrypto() ? sha256Hex(input) : fnvHex(input);
}
