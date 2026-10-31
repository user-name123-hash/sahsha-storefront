import repeat from "@core/util/repeat"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"

const SkeletonRelatedProducts = () => {
  return (
    <ul className="product-card-grid related-products-section__grid related-products-section__grid--skeleton">
      {repeat(4).map((index) => (
        <li key={index} className="product-card-grid__cell">
          <SkeletonProductPreview />
        </li>
      ))}
    </ul>
  )
}

export default SkeletonRelatedProducts
