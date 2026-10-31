export function HighlightMatch({
  text,
  query,
}: {
  text: string
  query: string
}) {
  if (!query.trim()) return <>{text}</>

  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const idx = lowerText.indexOf(lowerQuery)

  if (idx === -1) return <>{text}</>

  return (
    <>
      {text.slice(0, idx)}
      <strong className="font-semibold text-heading">{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </>
  )
}
