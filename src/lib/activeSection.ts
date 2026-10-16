/** First id, in page order, whose section is currently inside the observer band. */
export function resolveActive(
  order: readonly string[],
  intersecting: ReadonlySet<string>,
): string | null {
  return order.find((id) => intersecting.has(id)) ?? null;
}
