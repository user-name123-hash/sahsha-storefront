/**
 * Storefront override of @core/data/wishlist — only getWishlistProductIds
 * is hardened; everything else re-exports from commerce-core.
 * (No file-level "use server" — re-exports are not allowed in those files.)
 */

export {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from "../../../node_modules/@pradip1995/commerce-core/src/data/wishlist"

export { getWishlistProductIds } from "./wishlist-product-ids"
