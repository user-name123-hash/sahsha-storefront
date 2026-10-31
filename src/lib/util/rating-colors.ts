export const RATING_BAR_COLORS: Record<number, string> = {
  5: "#0f6b60",
  4: "#2ec4a8",
  3: "#62c4dc",
  2: "#fbc02d",
  1: "#ef5350",
}

/** Color for a star level in the breakdown (1–5). */
export function getStarLevelColor(star: number): string {
  const level = Math.min(5, Math.max(1, Math.round(star)))
  return RATING_BAR_COLORS[level]
}

/** Color for aggregate ratings (e.g. 3.5 uses the same color as 3). */
export function getAggregateRatingColor(rating: number): string {
  const level = Math.min(5, Math.max(1, Math.floor(rating)))
  return RATING_BAR_COLORS[level]
}
