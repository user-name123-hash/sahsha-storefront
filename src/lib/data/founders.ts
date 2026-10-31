import { getPublicHomepageConfig } from "@lib/data/public-dynamic-config"
import { resolveMediaUrl } from "@lib/resolve-media-url"

export type Founder = {
  name: string
  role: string
  bio: string
}

/** One shared photo for the About founders section. */
const DEFAULT_FOUNDER_PHOTO = "/about/sahil-narayani.png"

const DEFAULT_FOUNDERS: Founder[] = [
  {
    name: "Manisha Narayani",
    role: "Co-Founder & Creative Head",
    bio: "Manisha brings with her the craft, the eye, and the expertise. An affiliate of NIFT Gandhinagar, she has spent years working alongside designers and running her own boutique, experiencing firsthand the evolution of the Indian garment industry. Every collection at SAHSHA carries her hands-on sensibility — designs that are rooted in Indian aesthetics but built for the modern woman's life.",
  },
  {
    name: "Sahil Narayani",
    role: "Co-Founder & Business Head",
    bio: "Sahil brings structure, strategy, and soul to the operations side of SAHSHA. Coming from a family business background with strong management and technical capabilities, he ensures that every customer's experience — from the moment she lands on the website to the moment her order arrives at her door — is seamless, reliable, and worth her time.",
  },
]

function nonEmpty(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * About page founders — public config path (same as logo/SEO).
 * - `founder-photo` → one shared image
 * - `founders-array` → separate name / role / bio entries (no per-person image)
 * @core getDynamicConfig fails on prod CDN HTML.
 */
export async function getFoundersFromConfig(): Promise<{
  photo: string
  founders: Founder[]
}> {
  try {
    const homepage = await getPublicHomepageConfig()

    const photo =
      resolveMediaUrl(nonEmpty(homepage?.["founder-photo"])) ||
      DEFAULT_FOUNDER_PHOTO

    const rawArray = homepage?.["founders-array"]
    if (!Array.isArray(rawArray) || rawArray.length === 0) {
      return { photo, founders: DEFAULT_FOUNDERS }
    }

    const founders = rawArray
      .map((entry: Record<string, unknown>) => {
        const founder = (entry?.["founder"] ?? entry) as Record<string, string>
        const name = nonEmpty(founder?.["founder-name"])
        const role = nonEmpty(founder?.["founder-role"])
        const bio = nonEmpty(founder?.["founder-bio"])
        if (!name || !role || !bio) return null
        return { name, role, bio } satisfies Founder
      })
      .filter((item): item is Founder => Boolean(item))

    return {
      photo,
      founders: founders.length > 0 ? founders : DEFAULT_FOUNDERS,
    }
  } catch {
    return { photo: DEFAULT_FOUNDER_PHOTO, founders: DEFAULT_FOUNDERS }
  }
}
