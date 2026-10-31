import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "../localized-client-link"

type BreadcrumbProps = {
  product: HttpTypes.StoreProduct
}

export default function Breadcrumb({ product }: BreadcrumbProps) {
  const primaryCategory = product.categories?.[0]

  return (
    <nav className="product-page__breadcrumb text-xs sm:text-sm text-gray-800 overflow-x-auto font-medium">
      <div className="flex items-center whitespace-nowrap">
        <LocalizedClientLink href="/" className="hover:text-gray-900 transition-colors">
          Home
        </LocalizedClientLink>
        <span className="mx-2">/</span>
        <LocalizedClientLink href="/store" className="hover:text-gray-900 transition-colors">
          Shop
        </LocalizedClientLink>
        {primaryCategory && (
          <>
            <span className="mx-2">/</span>
            <LocalizedClientLink
              href={`/store?category=${primaryCategory.id}`}
              className="hover:text-gray-900 transition-colors"
            >
              {primaryCategory.name}
            </LocalizedClientLink>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-gray-900 truncate max-w-[150px] sm:max-w-[300px] md:max-w-[400px] inline-block align-bottom" title={product.title ?? ""}>
          {product.title}
        </span>
      </div>
    </nav>
  )
}




