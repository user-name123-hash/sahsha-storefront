/** Tiny className joiner — avoids pulling `@medusajs/ui` into product-card chunks. */
export function clx(
  ...args: Array<string | false | null | undefined | Record<string, boolean>>
): string {
  const out: string[] = []

  for (const arg of args) {
    if (!arg) continue
    if (typeof arg === "string") {
      out.push(arg)
      continue
    }
    for (const [key, on] of Object.entries(arg)) {
      if (on) out.push(key)
    }
  }

  return out.join(" ")
}
