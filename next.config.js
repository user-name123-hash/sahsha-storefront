const { loadEnvConfig } = require("@next/env")

loadEnvConfig(process.cwd())

const checkEnvVariables = require("./check-env-variables")
const { createKitNextConfig } = require("@pradip1995/create-storefront/lib/kit-next-config")
const { getImageConfig } = require("./image-config")

checkEnvVariables()

const projectRoot = __dirname

/** @type {import('next').NextConfig} */
module.exports = createKitNextConfig(projectRoot, {
  theme: "impulse",
  themeMode: "local",
  extra: {
    reactStrictMode: true,
    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: true },
    images: getImageConfig(),
    experimental: {
      // Keep CSS as external files (not inlined into HTML).
      // Inlining the full ~600KB theme into <head> delayed FCP on mobile;
      // separate stylesheets download in parallel with HTML and cache better.
      // Tradeoff: Lighthouse may still flag stylesheet links as render-blocking.
      serverActions: { bodySizeLimit: "10mb" },
      optimizePackageImports: [
        "lucide-react",
        "lodash",
        "@medusajs/icons",
        "@medusajs/ui",
        "framer-motion",
        "@headlessui/react",
      ],
      // Output modern JS — skips IE11/legacy transpilation, saves ~22 KB.
      browsersListForSwc: true,
    },
    // Immutable cache for hashed static assets \u2014 browser never re-fetches them.
    async headers() {
      return [
        {
          source: "/_next/static/(.*)",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
          ],
        },
        {
          source: "/fonts/(.*)",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
          ],
        },
      ]
    },
  },
})
