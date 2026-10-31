import { MetadataRoute } from 'next'
import { listProducts } from '@core/data/products'
import { listCategories } from '@core/data/categories'
import { listCollections } from '@core/data/collections'
import { getBaseURL } from '@core/util/env'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseURL()

  // Static routes
  const routes = [
    '',
    '/store',
    '/cart',
    '/account',
    '/help',
    '/contact',
    '/privacy-policy',
    '/terms-of-use',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  try {
    // Dynamic routes - Categories
    const categories = await listCategories()
    const categoryRoutes = categories.map((c) => ({
      url: `${baseUrl}/categories/${c.handle}`,
      lastModified: new Date(c.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // Dynamic routes - Collections 
    const { collections } = await listCollections()
    const collectionRoutes = collections.map((c) => ({
      url: `${baseUrl}/collections/${c.handle}`,
      lastModified: new Date(c.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // Dynamic routes - Products
    // Fetching up to 100 products for sitemap
    const { response: { products } } = await listProducts({
      countryCode: 'in', // Default country code
      queryParams: { limit: 100 }
    })
    
    const productRoutes = products.map((p) => ({
      url: `${baseUrl}/products/${p.handle}`,
      lastModified: new Date(p.updated_at || new Date()),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }))

    return [...routes, ...categoryRoutes, ...collectionRoutes, ...productRoutes]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return routes
  }
}
