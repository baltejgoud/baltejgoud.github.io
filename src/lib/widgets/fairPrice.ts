export const FACE_VALUE = 2500;
export const PRICE_MIN = 1000;
export const PRICE_MAX = 4000;
export const PRICE_STEP = 50;

export type Listing = { status: "listed"; saving: number } | { status: "blocked"; over: number };

/** Listings are allowed at or below face value and blocked above it. */
export function evaluateListing(price: number, face = FACE_VALUE): Listing {
  return price <= face ? { status: "listed", saving: face - price } : { status: "blocked", over: price - face };
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
