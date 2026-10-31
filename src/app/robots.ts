import { MetadataRoute } from 'next'
import { getBaseURL } from '@core/util/env'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseURL()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/checkout', '/account'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
