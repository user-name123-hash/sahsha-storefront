import localFont from "next/font/local"

/** Self-hosted OFL fonts — avoids next/font/google + Turbopack flake on extensionless gstatic URLs. */
export const montserrat = localFont({
  src: [
    {
      path: "./fonts/montserrat-latin-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/montserrat-latin-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/montserrat-latin-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-montserrat",
  display: "swap",
  preload: true,
})

export const playfair = localFont({
  src: [
    {
      path: "./fonts/playfair-display-latin-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/playfair-display-latin-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-playfair",
  display: "swap",
  preload: false,
})
