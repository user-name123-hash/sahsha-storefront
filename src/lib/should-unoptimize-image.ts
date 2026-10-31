/** Skip Next.js optimizer for formats it shouldn't re-encode (SVG/GIF/data URLs). */
export function shouldUnoptimizeImage(src: string | null | undefined): boolean {
  if (!src) return false

  const path = src.split("?")[0]?.toLowerCase() ?? ""
  return (
    path.endsWith(".svg") ||
    path.endsWith(".gif") ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  )
}
