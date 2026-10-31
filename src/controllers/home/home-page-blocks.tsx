import { resolveComponent } from "@registry/resolve-component"
import { storefrontConfig } from "@storefront-config"
import type { HomePageData } from "@core/types/home"
import type { HomeBlockType } from "@storefront-config"

function getBlockProps(
  blockType: HomeBlockType,
  data: HomePageData
): Record<string, unknown> {
  switch (blockType) {
    case "hero":
      return data.hero
    case "shopByAge":
      return data.shopByAge
    case "shopByCategory":
      return data.shopByCategory
    case "whyChooseUs":
      return data.whyChooseUs
    case "newArrivals":
      return data.newArrivals
    case "lovedByMoms":
      return data.lovedByMoms
    case "testimonials":
      return data.testimonials
    case "features":
      return data.features
    default:
      return {}
  }
}

type HomePageBlocksProps = {
  data: HomePageData
  /** Blocks already streamed elsewhere on the home page. */
  excludeBlockTypes?: HomeBlockType[]
}

export async function HomePageBlocks({
  data,
  excludeBlockTypes = [],
}: HomePageBlocksProps) {
  const skip = new Set<HomeBlockType>(["hero", ...excludeBlockTypes])
  const blocks = storefrontConfig.blocks.home.filter(
    (block) => !skip.has(block.blockType)
  )

  const resolvedBlocks = await Promise.all(
    blocks.map(async (block) => {
      const mod = await resolveComponent(block.component)
      return {
        block,
        Component: mod.default,
      }
    })
  )

  return (
    <>
      {resolvedBlocks.map(({ block, Component }) => (
        <Component key={block.blockType} {...getBlockProps(block.blockType, data)} />
      ))}
    </>
  )
}
