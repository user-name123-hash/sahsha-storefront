import { cache } from "react"
import { retrieveCart } from "@core/data/cart"
import { CHROME_CART_RETRIEVE_FIELDS } from "@lib/cart-retrieve-fields"
import { HttpTypes } from "@medusajs/types"

/** Single cart retrieve per request for layout, nav bag, and mobile bottom nav. */
export const retrieveCartForChrome = cache(
  async (): Promise<HttpTypes.StoreCart | null> => {
    return retrieveCart(undefined, CHROME_CART_RETRIEVE_FIELDS).catch(
      () => null
    )
  }
)
