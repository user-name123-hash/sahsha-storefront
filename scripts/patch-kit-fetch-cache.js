/**
 * Re-applies Next.js Data Cache settings to @pradip1995/commerce-core.
 * Kit packages shipped with temporary cache: "no-store" / revalidate: 0 for debugging.
 * Run via postinstall so npm updates keep catalog navigation fast.
 */
const fs = require("fs")
const path = require("path")

const root = path.join(
  __dirname,
  "..",
  "node_modules",
  "@pradip1995",
  "commerce-core",
  "src",
  "data"
)

function patchFile(rel, transforms) {
  const file = path.join(root, rel)
  if (!fs.existsSync(file)) {
    console.warn(`[patch-kit-fetch-cache] skip missing ${rel}`)
    return
  }
  let text = fs.readFileSync(file, "utf8")
  let changed = false
  for (const [from, to] of transforms) {
    if (text.includes(from) && !text.includes(to === from ? "\0" : to.slice(0, 40))) {
      /* apply when source pattern still present */
    }
    if (text.includes(from)) {
      text = text.split(from).join(to)
      changed = true
    }
  }
  if (changed) {
    fs.writeFileSync(file, text)
    console.log(`[patch-kit-fetch-cache] patched ${rel}`)
  }
}

patchFile("products.ts", [
  [
    `revalidate: 0, // Disable Next.js cache for now to show logs`,
    `revalidate: 60, // Catalog cache — invalidate via products cache tags`,
  ],
  [
    `cache: "no-store", // Ensure it hits backend every time for testing`,
    `cache: "force-cache",`,
  ],
  [
    `    const response = await fetch(\`\${backendUrl}/store/product-helper/filters\`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": publishableKey,
      },
      cache: "no-store",
    })`,
    `    const response = await fetch(\`\${backendUrl}/store/product-helper/filters\`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": publishableKey,
      },
      next: { revalidate: 300, tags: ["product-filters"] },
    })`,
  ],
])

patchFile("categories.ts", [
  [`revalidate: 0,`, `revalidate: 300,`],
  [`cache: "no-store",`, `cache: "force-cache",`],
])

patchFile("collections.ts", [
  [`revalidate: 0,`, `revalidate: 300,`],
  [`cache: "no-store",`, `cache: "force-cache",`],
])

patchFile("reviews.ts", [
  [
    `    const response = await fetch(\`\${backendUrl}/store/ratings\`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": publishableKey,
      },
      cache: "no-store",
    })`,
    `    const response = await fetch(\`\${backendUrl}/store/ratings\`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": publishableKey,
      },
      next: { revalidate: 120, tags: ["ratings"] },
    })`,
  ],
])

patchFile("dynamic-config.ts", [
  // Prefer public publishable-key fetch (no cookies) so homepage/metadata
  // stay off the dynamic cookie path and share a longer Data Cache TTL.
  [
    `    const authHeaders = await getAuthHeaders()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-publishable-api-key": publishableKey,
    }

    if (authHeaders && "authorization" in authHeaders) {
      headers["authorization"] = authHeaders.authorization
    }

    const fetchStart = Date.now()
    const response = await fetch(\`\${baseUrl}/store/dynamic-config\`, {
      method: "GET",
      headers,
      next: { revalidate: 60, tags: ["dynamic-config"] },
    })`,
    `    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-publishable-api-key": publishableKey,
    }

    const fetchStart = Date.now()
    const response = await fetch(\`\${baseUrl}/store/dynamic-config\`, {
      method: "GET",
      headers,
      next: { revalidate: 300, tags: ["dynamic-config"] },
    })`,
  ],
  [
    `    const response = await fetch(\`\${baseUrl}/store/dynamic-config\`, {
      method: "GET",
      headers,
      cache: "no-store",
    })`,
    `    const response = await fetch(\`\${baseUrl}/store/dynamic-config\`, {
      method: "GET",
      headers,
      next: { revalidate: 300, tags: ["dynamic-config"] },
    })`,
  ],
  [
    `next: { revalidate: 60, tags: ["dynamic-config"] },`,
    `next: { revalidate: 300, tags: ["dynamic-config"] },`,
  ],
  [
    `import { getAuthHeaders } from "./cookies"\n`,
    ``,
  ],
])
