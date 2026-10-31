type ProductMetadataField = {
  key: string
  label: string
  /** Older metadata keys that still hold values after the dropdown → text migration */
  legacyKeys?: string[]
}

/** Fallback narrative titles when style matches a known legacy key */
const STYLE_NARRATIVE_LABELS: Record<
  string,
  { top: string; bottom: string | null }
> = {
  coords: { top: "Top design", bottom: "Bottom design" },
  straight_kurti_suit_pant: { top: "Kurti design", bottom: "Pant design" },
  straight_kurti_suit_plazzo: { top: "Kurti design", bottom: "Plazzo design" },
  a_line_cut: { top: "Kurti design", bottom: "Bottom design" },
  anarkali_suit_with_duppatta: {
    top: "Anarkali design",
    bottom: "Dupatta & bottom design",
  },
  indo_western: { top: "Indo Western design", bottom: null },
  gown: { top: "Gown design", bottom: null },
  drape_sarees: { top: "Saree design", bottom: null },
  pakistani_suits: { top: "Suit design", bottom: "Bottom design" },
}

/**
 * Admin checkbox keys (details_fields / spotlight_fields) → current text fields.
 * Legacy keys are remapped so old products still resolve after the select → text change.
 */
const SPEC_KEY_ALIASES: Record<string, string> = {
  sleeve_length: "sleeves",
  top_type: "top_style",
  top_shape: "top_style",
  bottom_type: "bottom_style",
  top_design_styling: "top_designing_style",
  weave_type: "weave_pattern",
  top_pattern: "weave_pattern",
  bottom_pattern: "bottom_style",
  bottom_closure: "waistband",
}

export const PRODUCT_METADATA_FIELDS: ProductMetadataField[] = [
  { key: "style", label: "Style" },
  { key: "sleeves", label: "Sleeves", legacyKeys: ["sleeve_length"] },
  { key: "fabric", label: "Fabric" },
  { key: "color", label: "Color" },
  { key: "neck", label: "Neck" },
  { key: "occasion", label: "Occasion" },
  { key: "no_of_items", label: "No. of Items" },
  {
    key: "top_style",
    label: "Top Style",
    legacyKeys: ["top_type", "top_shape"],
  },
  { key: "top_length", label: "Top Length" },
  {
    key: "bottom_style",
    label: "Bottom Style",
    legacyKeys: ["bottom_type", "bottom_pattern"],
  },
  { key: "bottom_length", label: "Bottom Length" },
  { key: "blouse_style", label: "Blouse Style" },
  { key: "blouse_length", label: "Blouse Length" },
  { key: "top_hemline", label: "Top Hemline" },
  { key: "work_type", label: "Work Type" },
  { key: "ornamentation", label: "Ornamentation" },
  {
    key: "weave_pattern",
    label: "Weave Pattern",
    legacyKeys: ["weave_type", "top_pattern"],
  },
  { key: "pattern_coverage", label: "Pattern Coverage" },
  { key: "waistband", label: "Waistband", legacyKeys: ["bottom_closure"] },
  {
    key: "top_designing_style",
    label: "Top Designing Style",
    legacyKeys: ["top_design_styling"],
  },
]

export type ProductMetadataEntry = {
  key: string
  label: string
  value: string
}

/** Show admin-typed text as-is. Only lightly humanize leftover snake_case enum values. */
export function formatMetadataValue(
  raw: unknown,
  _field?: ProductMetadataField
): string | null {
  if (raw === null || raw === undefined || raw === "") {
    return null
  }

  const str = String(raw).trim()
  if (!str) {
    return null
  }

  // Legacy dropdown values like "round_neck" → "Round Neck"
  if (/^[a-z0-9]+(?:_[a-z0-9]+)+$/i.test(str) && !str.includes(" ")) {
    return str
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  return str
}

export function getMetadataFieldDisplayValue(
  metadata: Record<string, unknown> | null | undefined,
  key: string
): string | null {
  const canonicalKey = resolveCanonicalSpecKey(key)
  const field = PRODUCT_METADATA_FIELDS.find((item) => item.key === canonicalKey)
  if (!field) {
    return null
  }

  return formatMetadataValue(readMetadataRawValue(metadata, field), field)
}

function resolveCanonicalSpecKey(key: string): string {
  return SPEC_KEY_ALIASES[key] || key
}

function readMetadataRawValue(
  metadata: Record<string, unknown> | null | undefined,
  field: ProductMetadataField
): unknown {
  if (!metadata) return undefined

  const direct = metadata[field.key]
  if (direct !== null && direct !== undefined && String(direct).trim() !== "") {
    return direct
  }

  for (const legacyKey of field.legacyKeys || []) {
    const legacy = metadata[legacyKey]
    if (legacy !== null && legacy !== undefined && String(legacy).trim() !== "") {
      return legacy
    }
  }

  return direct
}

export const PRODUCT_DETAILS_FIELD_OPTIONS: { key: string; label: string }[] =
  PRODUCT_METADATA_FIELDS.map((field) => ({
    key: field.key,
    label: field.label,
  }))

export type ProductDetailsNarrative = {
  key: string
  title: string
  items: string[]
}

function getNarrativeTitles(metadata: Record<string, unknown>) {
  const styleKey = String(metadata.style || "").trim()
  const labels =
    STYLE_NARRATIVE_LABELS[styleKey] ||
    STYLE_NARRATIVE_LABELS.coords

  return {
    top: labels.top,
    bottom: labels.bottom,
  }
}

function formatKeyAsLabel(key: string): string {
  return key
    .replace(/^custom_spec_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function parseMetadataFieldKeys(raw: unknown): string[] | null {
  if (raw == null || raw === "") return null

  let keys: string[] = []

  if (Array.isArray(raw)) {
    keys = raw.map((item) => String(item).trim()).filter(Boolean)
  } else if (typeof raw === "string") {
    const trimmed = raw.trim()
    if (!trimmed) return null

    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (Array.isArray(parsed)) {
        keys = parsed.map((item) => String(item).trim()).filter(Boolean)
      } else {
        keys = trimmed.split(",").map((item) => item.trim()).filter(Boolean)
      }
    } catch {
      keys = trimmed.split(",").map((item) => item.trim()).filter(Boolean)
    }
  } else {
    return null
  }

  if (keys.length === 0) return null

  // Remap legacy checkbox keys → current keys, keep order, drop duplicates
  const seen = new Set<string>()
  const canonical: string[] = []
  for (const key of keys) {
    const next = resolveCanonicalSpecKey(key)
    if (seen.has(next)) continue
    seen.add(next)
    canonical.push(next)
  }

  return canonical.length > 0 ? canonical : null
}

export function parseMetadataBulletItems(raw: unknown): string[] {
  if (raw === null || raw === undefined || raw === "") {
    return []
  }

  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean)
  }

  const str = String(raw).trim()
  if (!str) {
    return []
  }

  if (str.includes("\n")) {
    return str.split("\n").map((item) => item.trim()).filter(Boolean)
  }

  if (str.includes(",")) {
    return str.split(",").map((item) => item.trim()).filter(Boolean)
  }

  return [str]
}

function getDetailsFieldLabel(key: string): string {
  return (
    PRODUCT_DETAILS_FIELD_OPTIONS.find((item) => item.key === key)?.label ||
    PRODUCT_METADATA_FIELDS.find((item) => item.key === key)?.label ||
    formatKeyAsLabel(key)
  )
}

function buildMetadataEntry(
  key: string,
  metadata: Record<string, unknown>
): ProductMetadataEntry | null {
  const canonicalKey = resolveCanonicalSpecKey(key)
  const field = PRODUCT_METADATA_FIELDS.find((item) => item.key === canonicalKey)
  if (!field) {
    return null
  }

  const value = formatMetadataValue(readMetadataRawValue(metadata, field), field)
  if (!value) {
    return null
  }

  return {
    key: field.key,
    label: getDetailsFieldLabel(field.key),
    value,
  }
}

export function getProductMetadataEntries(
  metadata: Record<string, unknown> | null | undefined
): ProductMetadataEntry[] {
  if (!metadata) {
    return []
  }

  const adminSelectedKeys = parseMetadataFieldKeys(metadata.details_fields)
  const entries: ProductMetadataEntry[] = []

  const keysToShow = adminSelectedKeys ?? PRODUCT_METADATA_FIELDS.map((field) => field.key)

  for (const key of keysToShow) {
    const entry = buildMetadataEntry(key, metadata)
    if (entry) {
      entries.push(entry)
    }
  }

  return entries
}

export function getProductDetailsNarratives(
  metadata: Record<string, unknown> | null | undefined
): ProductDetailsNarrative[] {
  if (!metadata) {
    return []
  }

  const titles = getNarrativeTitles(metadata)
  const sections: ProductDetailsNarrative[] = []

  const topItems = parseMetadataBulletItems(metadata.top_design)
  if (topItems.length > 0) {
    sections.push({
      key: "top_design",
      title: titles.top,
      items: topItems,
    })
  }

  const bottomItems = parseMetadataBulletItems(metadata.bottom_design)
  if (bottomItems.length > 0 && titles.bottom) {
    sections.push({
      key: "bottom_design",
      title: titles.bottom,
      items: bottomItems,
    })
  }

  const sizeFitItems = parseMetadataBulletItems(metadata.size_fit)
  if (sizeFitItems.length > 0) {
    sections.push({
      key: "size_fit",
      title: "Size & Fit",
      items: sizeFitItems,
    })
  }

  const materialCareItems = parseMetadataBulletItems(metadata.material_care)
  if (materialCareItems.length > 0) {
    sections.push({
      key: "material_care",
      title: "Material & Care",
      items: materialCareItems,
    })
  }

  return sections
}

export function hasProductDetailsContent(product: {
  title?: string | null
  metadata?: Record<string, unknown> | null
}): boolean {
  const metadata = product.metadata
  return (
    getProductMetadataEntries(metadata).length > 0 ||
    getProductDetailsNarratives(metadata).length > 0 ||
    Boolean(product.title?.trim())
  )
}

const DEFAULT_STYLE_SPOTLIGHT_FIELDS = [
  { key: "style", label: "Style" },
  { key: "weave_pattern", label: "Weave Pattern" },
  { key: "neck", label: "Neck" },
  { key: "sleeves", label: "Sleeves" },
]

export const STYLE_SPOTLIGHT_FIELD_OPTIONS: { key: string; label: string }[] = [
  ...PRODUCT_DETAILS_FIELD_OPTIONS.filter((item) => item.key !== "color"),
  { key: "color", label: "Color" },
]

export type StyleSpotlightEntry = {
  label: string
  value: string
}

function getSpotlightFieldLabel(key: string): string {
  return (
    STYLE_SPOTLIGHT_FIELD_OPTIONS.find((item) => item.key === key)?.label ||
    getDetailsFieldLabel(key)
  )
}

function parseSpotlightFieldKeys(raw: unknown): string[] | null {
  return parseMetadataFieldKeys(raw)
}

export function getStyleSpotlightEntries(
  metadata: Record<string, unknown> | null | undefined,
  colorLabel?: string | null
): StyleSpotlightEntry[] {
  const adminSelectedKeys = parseSpotlightFieldKeys(metadata?.spotlight_fields)
  const selectedKeys =
    adminSelectedKeys ??
    [...DEFAULT_STYLE_SPOTLIGHT_FIELDS.map((field) => field.key), "color"]

  const entries: StyleSpotlightEntry[] = []

  for (const key of selectedKeys) {
    const canonicalKey = resolveCanonicalSpecKey(key)

    if (canonicalKey === "color") {
      const trimmedColor = colorLabel?.trim()
      if (trimmedColor) {
        entries.push({
          label: getSpotlightFieldLabel("color"),
          value: trimmedColor,
        })
      }
      continue
    }

    const field = PRODUCT_METADATA_FIELDS.find((item) => item.key === canonicalKey)
    if (!field) continue

    const value = formatMetadataValue(readMetadataRawValue(metadata, field), field)
    if (value) {
      entries.push({ label: getSpotlightFieldLabel(field.key), value })
    }
  }

  return entries
}
