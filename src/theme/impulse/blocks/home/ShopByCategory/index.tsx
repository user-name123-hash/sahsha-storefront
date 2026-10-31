import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import {
  getCategoryImage,
  getCategoryProductCount,
} from "@lib/category-collection-images"
import { categoryTileImageProps } from "@lib/category-tile-image-props"

type ShopByCategoryProps = {
  categories: HttpTypes.StoreProductCategory[]
}

const ShopByCategory = ({ categories }: ShopByCategoryProps) => {
  if (!categories || categories.length === 0) {
    return null
  }

  const parentCategories = categories.filter(
    (category) => !category.parent_category_id
  )

  if (parentCategories.length === 0) {
    return null
  }

  const categoryGroups: HttpTypes.StoreProductCategory[][] = []
  for (let i = 0; i < parentCategories.length; i += 5) {
    categoryGroups.push(parentCategories.slice(i, i + 5))
  }

  return (
    <section className="shop-by-category w-full bg-white py-8 sm:py-9 md:py-10 font-[family-name:var(--sf-font-family)]">
      <div
        className="shop-by-category__inner"
        style={{ maxWidth: "var(--container-max)" }}
      >
        <div className="shop-by-category__header">
          <h2 className="font-display text-2xl md:text-3xl text-heading">
            Shop by category
          </h2>
        </div>

        <div className="shop-by-category__groups">
          {categoryGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="shop-by-category__grid">
              {group.map((category, index) => {
                const categoryImage = getCategoryImage(category)
                const productCount = getCategoryProductCount(category)
                const categoryUrl = category.id
                  ? `/store?category=${category.id}`
                  : "#"
                const rowClass =
                  index < 3
                    ? "shop-by-category__card--top"
                    : "shop-by-category__card--bottom"

                return (
                  <LocalizedClientLink
                    key={category.id}
                    href={categoryUrl}
                    data-ga-event="shop_by_category_click"
                    data-ga-label={category.name || "Category"}
                    className={`shop-by-category__card group ${rowClass}`}
                  >
                    <div className="shop-by-category__frame">
                      {categoryImage ? (
                        <Image
                          src={categoryImage}
                          alt={category.name || "Category"}
                          fill
                          className="shop-by-category__image"
                          {...categoryTileImageProps(categoryImage)}
                        />
                      ) : (
                        <div className="shop-by-category__placeholder">
                          <PlaceholderImage size={48} />
                        </div>
                      )}

                      <div className="shop-by-category__overlay" aria-hidden />

                      {productCount > 0 && (
                        <p className="shop-by-category__count">
                          {productCount}{" "}
                          {productCount === 1 ? "Product" : "Products"}
                        </p>
                      )}

                      <div className="shop-by-category__content">
                        <h3 className="shop-by-category__name">{category.name}</h3>
                        <p className="shop-by-category__cta">
                          View the collection
                          <span className="shop-by-category__cta-arrow" aria-hidden>
                            ›
                          </span>
                        </p>
                      </div>
                    </div>
                  </LocalizedClientLink>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ShopByCategory
