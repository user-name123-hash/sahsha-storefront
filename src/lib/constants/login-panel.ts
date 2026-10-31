export type LoginPageFeatureCard = {
  imageSrc?: string
  title: string
  text: string
}

export type LoginPagePanelConfig = {
  image: string
  logo: string | null
  title: string
  description: string
  featuresLabel: string
  featureCards: readonly LoginPageFeatureCard[]
}

/** Fallback when admin has not uploaded a login panel image */
export const LOGIN_PANEL_PLACEHOLDER_IMAGE = "/login-hero.png"

export const DEFAULT_LOGIN_PAGE_PANEL: LoginPagePanelConfig = {
  image: LOGIN_PANEL_PLACEHOLDER_IMAGE,
  logo: null,
  title: "Welcome Back",
  description:
    "Sign in to track orders, manage your account, and enjoy a curated Sahsha experience.",
  featuresLabel: "Why Sahsha?",
  featureCards: [
    {
      title: "Customer-first",
      text: "Putting you in the center",
    },
    {
      title: "Transparent",
      text: "Honest from the inside out",
    },
    {
      title: "Innovative",
      text: "Getting the absolute best for you",
    },
  ],
}
