import PromoBarContent from "./promo-bar-content"

type PromoBarProps = {
  text?: string
  code?: string | null
  value?: string | null
  active?: boolean
  lines?: [string | null, string | null, string | null, string | null]
}

export default function PromoBar({
  text = "",
  code = null,
  value = null,
  lines,
}: PromoBarProps) {
  return (
    <div className="promo-bar" role="region" aria-label="Store promotions">
      <PromoBarContent text={text} code={code} value={value} lines={lines} />
    </div>
  )
}
