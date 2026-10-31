import { HttpTypes } from "@medusajs/types"
import { META_TRACKING_PARAMS } from "@lib/util/meta-tracking-params"
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL?.replace(/\/+$/, "")
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"

/** Redirect once to the same URL without Meta click IDs (Instagram / Facebook). */
function redirectWithoutMetaTrackingParams(
  request: NextRequest
): NextResponse | null {
  const url = request.nextUrl.clone()
  let changed = false

  for (const key of META_TRACKING_PARAMS) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key)
      changed = true
    }
  }

  if (!changed) {
    return null
  }

  return NextResponse.redirect(url)
}

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) {
    throw new Error(
      "Middleware.ts: Error fetching regions. Did you set up regions in your Medusa Admin and define a MEDUSA_BACKEND_URL environment variable?"
    )
  }

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    const { regions } = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY!,
      },
      next: {
        revalidate: 3600,
        tags: [`regions-${cacheId}`],
      },
      cache: "force-cache",
    }).then(async (response) => {
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message)
      }

      return json
    })

    if (!regions?.length) {
      throw new Error(
        "No regions found. Please set up regions in your Medusa Admin."
      )
    }

    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMapCache.regionMap.set(c.iso_2 ?? "", region)
      })
    })

    regionMapCache.regionMapUpdated = Date.now()
  }

  return regionMapCache.regionMap
}

async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  try {
    let countryCode

    const vercelCountryCode = request.headers
      .get("x-vercel-ip-country")
      ?.toLowerCase()

    const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

    if (urlCountryCode && regionMap.has(urlCountryCode)) {
      countryCode = urlCountryCode
    } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
      countryCode = vercelCountryCode
    } else if (regionMap.has(DEFAULT_REGION)) {
      countryCode = DEFAULT_REGION
    } else if (regionMap.keys().next().value) {
      countryCode = regionMap.keys().next().value
    }

    return countryCode
  } catch {
    return undefined
  }
}

async function handleRegions(request: NextRequest) {
  let redirectUrl = request.nextUrl.href
  let response = NextResponse.redirect(redirectUrl, 307)

  const cacheIdCookie = request.cookies.get("_medusa_cache_id")
  const cacheId = cacheIdCookie?.value || crypto.randomUUID()

  const regionMap = await getRegionMap(cacheId)
  const countryCode = regionMap && (await getCountryCode(request, regionMap))
  const pathname = request.nextUrl.pathname

  const pathParts = pathname.split("/").filter(Boolean)
  if (pathParts.length >= 2 && pathParts[1] === "auth") {
    if (/^[a-z]{2,3}$/i.test(pathParts[0])) {
      const newPath = "/" + pathParts.slice(1).join("/")
      const newUrl = new URL(request.nextUrl)
      newUrl.pathname = newPath
      for (const key of META_TRACKING_PARAMS) {
        newUrl.searchParams.delete(key)
      }
      return NextResponse.redirect(newUrl, 307)
    }
  }

  if (pathname.startsWith("/auth/")) {
    return NextResponse.next()
  }

  const pathCountrySegment = request.nextUrl.pathname.split("/")[1]?.toLowerCase()
  const urlHasCountryCode =
    countryCode && pathCountrySegment === countryCode.toLowerCase()

  if (urlHasCountryCode && cacheIdCookie) {
    return NextResponse.next()
  }

  if (urlHasCountryCode && !cacheIdCookie) {
    const nextResponse = NextResponse.next()
    nextResponse.cookies.set("_medusa_cache_id", cacheId, {
      maxAge: 60 * 60 * 24,
    })
    return nextResponse
  }

  if (request.nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  const redirectPath =
    request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname

  // Always drop Meta click IDs when rewriting to a country URL (nginx may
  // forward /?igsh=… → /in?igsh=… before Next middleware strips them).
  const cleanSearch = new URLSearchParams(request.nextUrl.searchParams)
  for (const key of META_TRACKING_PARAMS) {
    cleanSearch.delete(key)
  }
  const queryString = cleanSearch.toString()
  const querySuffix = queryString ? `?${queryString}` : ""

  if (!urlHasCountryCode && countryCode) {
    redirectUrl = `${request.nextUrl.origin}/${countryCode}${redirectPath}${querySuffix}`
    response = NextResponse.redirect(`${redirectUrl}`, 307)
  } else if (!urlHasCountryCode && !countryCode) {
    return new NextResponse(
      "No valid regions configured. Please set up regions with countries in your Medusa Admin.",
      { status: 500 }
    )
  }

  return response
}

export async function middleware(request: NextRequest) {
  const cleaned = redirectWithoutMetaTrackingParams(request)
  if (cleaned) {
    return cleaned
  }

  const response = await handleRegions(request)
  const pathname = request.nextUrl.pathname

  // Skip sync for static assets, API routes, and OAuth callback pages
  if (
    pathname.includes(".") ||
    pathname.startsWith("/api") ||
    pathname.includes("/auth/customer/google/callback")
  ) {
    return response
  }

  const authToken = request.cookies.get("_medusa_jwt")?.value
  const cartId = request.cookies.get("_medusa_cart_id")?.value
  const syncLock = request.cookies.get("_medusa_cart_synced")?.value
  const isPageRequest = request.headers.get("accept")?.includes("text/html")
  const buyNowCartId = request.cookies.get("buy_now_cart_id")?.value
  let activeCartIdFromSync: string | null = null
  let isTokenExpired = false
  const isBuyNowPath = pathname.includes("/checkout")

  if (authToken && !syncLock && isPageRequest && !pathname.includes(".")) {
    try {
      const syncRes = await fetch(`${BACKEND_URL}/store/carts/merge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": PUBLISHABLE_API_KEY!,
          Authorization: `Bearer ${authToken}`,
        },
        ...(cartId ? { body: JSON.stringify({ cart_id: cartId }) } : {}),
        cache: "no-store",
      })

      if (syncRes.ok) {
        const data = await syncRes.json()
        activeCartIdFromSync = data.cart?.id || data.id || data.cart_id
      } else if (syncRes.status === 401 || syncRes.status === 403) {
        isTokenExpired = true
      }
    } catch (error) {
      console.error("Middleware Cart Sync Error:", error)
    }
  }

  let finalResponse = response

  if (response.status !== 307 && response.status !== 308 && response.status !== 302) {
    const updatedHeaders = new Headers(request.headers)
    if (activeCartIdFromSync && !(buyNowCartId && isBuyNowPath)) {
      updatedHeaders.set("x-cart-id", activeCartIdFromSync)
    }
    updatedHeaders.set("x-pathname", pathname)
    finalResponse = NextResponse.next({
      request: { headers: updatedHeaders },
    })
  }

  if (isPageRequest && buyNowCartId && !pathname.includes("/checkout")) {
    finalResponse.cookies.set("buy_now_cart_id", "", { maxAge: -1, path: "/" })
  }

  if (activeCartIdFromSync) {
    finalResponse.cookies.set("_medusa_cart_id", activeCartIdFromSync, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    })
  } else if (authToken && !syncLock && isPageRequest && !pathname.includes(".")) {
    finalResponse.cookies.set("_medusa_cart_id", "", { maxAge: -1, path: "/" })
  }

  if (activeCartIdFromSync || (authToken && !syncLock && isPageRequest)) {
    // 30 min lock — avoid re-running POST /store/carts/merge on every navigation
    finalResponse.cookies.set("_medusa_cart_synced", "true", {
      maxAge: 60 * 30,
      path: "/",
    })
  }

  if (isTokenExpired) {
    finalResponse.cookies.set("_medusa_jwt", "", { maxAge: -1, path: "/" })
  }

  // Anonymous HTML — allow CDN/nginx edge cache so distant probes see sub-800ms TTFB.
  // Skip when JWT/cart cookies personalize the response.
  const isRedirect =
    finalResponse.status === 307 ||
    finalResponse.status === 308 ||
    finalResponse.status === 302
  if (
    isPageRequest &&
    !isRedirect &&
    !authToken &&
    !cartId &&
    !buyNowCartId
  ) {
    // Next may overwrite Cache-Control on dynamic RSC responses; CDN-specific
    // headers still let Cloudflare/nginx edge-cache anonymous HTML.
    const edgeCache = "public, s-maxage=60, stale-while-revalidate=300"
    finalResponse.headers.set("Cache-Control", edgeCache)
    finalResponse.headers.set("CDN-Cache-Control", edgeCache)
    finalResponse.headers.set("Cloudflare-CDN-Cache-Control", edgeCache)
  }

  return finalResponse
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|firebase-messaging-sw.js|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
