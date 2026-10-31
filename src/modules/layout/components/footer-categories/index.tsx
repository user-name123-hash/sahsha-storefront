"use client"

import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type FooterCategoriesProps = {
    categories: HttpTypes.StoreProductCategory[]
}

const FooterCategories = ({ categories }: FooterCategoriesProps) => {
    return (
        <div className="flex flex-col gap-y-3 sm:gap-y-4">
            <h3 className="text-white text-sm sm:text-base font-semibold mb-1 sm:mb-2">
                Shop
            </h3>
            <ul className="flex flex-col gap-y-1.5 sm:gap-y-2">
                {categories.map((category) => (
                    <li key={category.id}>
                        <LocalizedClientLink
                            href={`/store?category=${category.id}`}
                            data-ga-event="footer_category_click"
                            data-ga-label={category.name || "Category"}
                            className="text-white text-xs sm:text-sm hover:text-pink-400 transition-colors"
                        >
                            {category.name}
                        </LocalizedClientLink>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default FooterCategories
