import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import {
  getCollectionImage,
  getCollectionProductCount,
} from "@lib/category-collection-images"
import { categoryTileImageProps } from "@lib/category-tile-image-props"

type CollectionsPageProps = {
  collections: HttpTypes.StoreCollection[]
}

export default function CollectionsPage({ collections }: CollectionsPageProps) {
  return (
    <div className="collections-index min-h-screen bg-page-bg">
      <div
        className="collections-index__inner mx-auto"
        style={{ maxWidth: "var(--container-max)" }}
      >
        <nav className="collections-index__breadcrumb" aria-label="Breadcrumb">
          <LocalizedClientLink href="/">Home</LocalizedClientLink>
          <span aria-hidden>/</span>
          <span>Collections</span>
        </nav>

        <h1 className="collections-index__title">Collections</h1>

        <ul className="collections-index__grid">
          {collections.map((collection) => {
            const imageUrl = getCollectionImage(collection)
            const productCount = getCollectionProductCount(collection)
            const title = collection.title || "Collection"

            return (
              <li key={collection.id} className="collections-index__item">
                <LocalizedClientLink
                  href={`/store?collection=${collection.id}`}
                  className="collections-index__link"
                >
                  <div className="collections-index__media">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="collections-index__image"
                        {...categoryTileImageProps(imageUrl, {
                          sizes: "(max-width: 640px) 50vw, 25vw",
                        })}
                      />
                    ) : (
                      <div className="collections-index__placeholder">
                        <PlaceholderImage size={40} />
                      </div>
                    )}
                  </div>

                  <p className="collections-index__name">
                    {title}
                    {productCount > 0 && (
                      <sup className="collections-index__count">{productCount}</sup>
                    )}
                  </p>
                </LocalizedClientLink>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
