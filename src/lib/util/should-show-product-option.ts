import { HttpTypes } from "@medusajs/types"

export function getUniqueOptionValues(
  option: HttpTypes.StoreProductOption
): string[] {
  const values =
    option.values?.map((v) => v.value).filter((v): v is string => Boolean(v)) ??
    []
  return Array.from(new Set(values))
}

export function shouldShowProductOption(
  option: HttpTypes.StoreProductOption
): boolean {
  const uniqueValues = getUniqueOptionValues(option)
  if (uniqueValues.length <= 1) {
    return false
  }

  const title = (option.title || "").toLowerCase()
  if (title.includes("default")) {
    return false
  }

  return true
}
