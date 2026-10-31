export type ThemeDefaultAssets = {
  logo: string
  logoDark?: string
  heroDesktop: string
  heroMobile: string
}

/** Static fallbacks when dynamic config has no image URL. */
export const DEFAULT_ASSETS: ThemeDefaultAssets = {
  logo: "/theme-defaults/sahsha/logo.svg",
  logoDark: "/theme-defaults/sahsha/logo.svg",
  heroDesktop: "/theme-defaults/sahsha/hero-desktop.svg",
  heroMobile: "/theme-defaults/sahsha/hero-mobile.svg",
}

export function getThemeDefaultAssets(): ThemeDefaultAssets {
  return DEFAULT_ASSETS
}
