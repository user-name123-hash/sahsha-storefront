import { HttpTypes } from "@medusajs/types"
import { getCustomerFacingVariantTitle } from "@lib/util/size-fallback"

type LineItemOptionsProps = {
  variant: HttpTypes.StoreProductVariant | undefined
  metadata?: Record<string, unknown> | null
  title?: string
  "data-testid"?: string
  "data-value"?: HttpTypes.StoreProductVariant
}

const LineItemOptions = ({
  variant,
  metadata,
  title,
  "data-testid": dataTestid,
  "data-value": dataValue,
}: LineItemOptionsProps) => {
  const displayTitle = getCustomerFacingVariantTitle({
    variant,
    metadata,
    title,
  })

  return (
    <span
      data-testid={dataTestid}
      data-value={dataValue}
      className="inline-block txt-medium text-ui-fg-subtle w-full overflow-hidden text-ellipsis"
    >
      {displayTitle ? `Variant: ${displayTitle}` : "Variant"}
    </span>
  )
}

export default LineItemOptions
