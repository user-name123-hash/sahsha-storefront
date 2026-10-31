export const WEBSITE_LOADER_SESSION_KEY = "sahsha_website_loader_seen"
/** Soft fade only — not a display duration. */
export const WEBSITE_LOADER_FADE_OUT_MS = 180
/**
 * Safety cap — hide first-visit loader quickly if resources hang.
 */
export const WEBSITE_LOADER_MAX_MS = 1500
/**
 * If a route never settles (cancelled nav, error), hide PageLoader.
 */
export const PAGE_LOADER_MAX_MS = 2500

export const IMAGE_LOADER_REVEAL_MS = 120
export const IMAGE_SKELETON_COLOR = "#F5F5F5"
