import {
  getPublicLogo,
  getPublicNavLogos,
} from "@lib/data/public-dynamic-config"
import { getThemeDefaultAssets } from "@lib/theme-default-assets"

/**
 * Nav logos from Medusa Admin dynamic-config (public fetch path).
 * Theme defaults are last-resort only when admin has uploaded nothing.
 */
export async function getNavLogosFromConfig(): Promise<{
  lightLogo: string
  darkLogo: string
}> {
  const theme = getThemeDefaultAssets()
  const { lightLogo, darkLogo } = await getPublicNavLogos()

  return {
    lightLogo: lightLogo || theme.logo,
    darkLogo: darkLogo || theme.logoDark || theme.logo,
  }
}

/** Company (white) logo for footer and other chrome. */
export async function getLogoFromAdminConfig(): Promise<string | null> {
  return getPublicLogo()
}
