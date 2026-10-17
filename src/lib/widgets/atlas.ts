export const ATLAS_TILES = 208;
export const ATLAS_COLS = 16;

/** Draw calls shown while batching: 208 at progress 0, 1 at progress 1. */
export function drawCalls(progress: number): number {
  const p = Math.max(0, Math.min(1, progress));
  return Math.round(ATLAS_TILES - (ATLAS_TILES - 1) * p);
}

/** Grid position of a tile and its offset (in tiles) from the grid centre. */
export function tileOffset(index: number, cols = ATLAS_COLS, total = ATLAS_TILES) {
  const rows = Math.ceil(total / cols);
  const col = index % cols;
  const row = Math.floor(index / cols);
  return { col, row, dx: (cols - 1) / 2 - col, dy: (rows - 1) / 2 - row };
}
