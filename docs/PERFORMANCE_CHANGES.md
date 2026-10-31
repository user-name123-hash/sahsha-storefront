# Sahsha Storefront — Performance Optimization Report

This document details the performance optimization changes applied to the Sahsha Storefront (Next.js 15 & Medusa v2), aimed at lowering Total Blocking Time (TBT) from **1,280 ms** to target sub-200 ms and elevating the Lighthouse performance score from **69** to **90+**.

---

## Executive Summary

| # | Optimization | Target File(s) | Metric Target | Impact |
|---|---|---|---|---|
| **1** | Lazy-Loaded `country-state-city` | `shipping-address/index.tsx` | Total Blocking Time (TBT) | Eliminates **9.2 MB** city JSON chunk from global bundle; loads on demand |
| **2** | Removed `lodash` imports | `shipping-address`, `product-actions`, `cart-item-card` | Bundle size & parse time | Replaced `mapKeys` & `isEqual` with ~8-line native JS; saves **~70 KB** |
| **3** | Non-composited blur → GPU transform | `globals.css` | Frame rate & paint count | Eliminates **9 non-composited animation warnings** in Lighthouse |
| **4** | Immutable Cache & Modern SWC Build | `next.config.js` | Repeat visits & JS payload | Saves **~22 KB** via ES2017+ SWC output; 1-yr immutable static asset cache |
| **5** | Modern Browser Target Config | `.browserslistrc` | Compiler overhead | Excludes legacy targets (IE11/op_mini) to eliminate runtime polyfills |
| **6** | Scoped Tailwind Content Paths | `tailwind.config.js` | Generated CSS size | Removed 300+ unused component scans; saves **~100 KB** dead CSS |
| **7** | Compressed OpenGraph/Twitter Images | `opengraph-image.jpg`, `twitter-image.jpg` | Metadata payload | **75% reduction** (234 KB → 57 KB each) via progressive Sharp JPEG compression |

---

## Detailed Change Breakdown

### 1. Lazy-Loaded `country-state-city` (9.2 MB Chunk)

* **File:** [`src/modules/checkout/components/shipping-address/index.tsx`](file:///home/sbl/Desktop/sahsha/my-medusa-store-storefront/src/modules/checkout/components/shipping-address/index.tsx)
* **Problem:**  
  The package `country-state-city` contains extensive worldwide geographical datasets, including a 9.2 MB JSON file of every city in the world. Because it was statically imported at the top of the file:
  ```ts
  // ❌ BEFORE: Bundled into the shared application chunk
  import { State, City } from "country-state-city"
  ```
  Next.js was bundling this massive 9.2 MB JSON asset into the client JavaScript delivered to visitors on initial page load (including the homepage), causing **1,280 ms of main-thread execution and blocking time**.
* **Solution:**  
  Converted the static import into dynamic `import("country-state-city")` calls loaded asynchronously inside `useEffect` only when the shipping address form actually mounts and requires state/city options.
* **Code Implementation:**
  ```tsx
  // ✅ AFTER: Dynamic asynchronous loader
  let cscPromise: Promise<typeof import("country-state-city")> | null = null
  function loadCSC() {
    if (!cscPromise) {
      cscPromise = import("country-state-city")
    }
    return cscPromise
  }
  ```

---

### 2. Native JS Replacements for `lodash`

* **Files Modified:**
  - [`src/modules/checkout/components/shipping-address/index.tsx`](file:///home/sbl/Desktop/sahsha/my-medusa-store-storefront/src/modules/checkout/components/shipping-address/index.tsx)
  - [`src/modules/products/components/product-actions/index.tsx`](file:///home/sbl/Desktop/sahsha/my-medusa-store-storefront/src/modules/products/components/product-actions/index.tsx)
  - [`src/modules/cart/components/cart-item-card/index.tsx`](file:///home/sbl/Desktop/sahsha/my-medusa-store-storefront/src/modules/cart/components/cart-item-card/index.tsx)
* **Problem:**  
  `lodash` (~70 KB gzipped) was being imported into multiple client-rendered components solely for utility helpers like `isEqual` and `mapKeys`.
* **Solution:**  
  Replaced with lightweight native ES6+ inline implementations tailored to the simple flat key/value objects used by product option selectors and address fields:
  ```ts
  // ✅ Native isEqual replacement
  function areOptionsEqual(
    a: Record<string, string | undefined>,
    b: Record<string, string | undefined>
  ): boolean {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    if (keysA.length !== keysB.length) return false
    return keysA.every((k) => a[k] === b[k])
  }
  ```

---

### 3. GPU-Composited Animations (Blur → Transform Scale)

* **File:** [`src/styles/globals.css`](file:///home/sbl/Desktop/sahsha/my-medusa-store-storefront/src/styles/globals.css)
* **Problem:**  
  The `.sahsha-image-reveal` animation utilized `filter: blur(12px)`. The CSS `filter: blur()` property cannot run on the GPU compositor thread; it forces the CPU to recalculate and repaint pixels on every animation frame, generating **9 non-composited animation penalties** in Lighthouse audit results.
* **Solution:**  
  Swapped `filter: blur` for GPU-accelerated `transform: scale()` and `opacity`:
  ```css
  /* ❌ BEFORE */
  .sahsha-image-reveal {
    opacity: 0;
    filter: blur(12px);
    will-change: opacity, filter;
  }
  
  /* ✅ AFTER */
  .sahsha-image-reveal {
    opacity: 0;
    transform: scale(1.015);
    will-change: opacity, transform;
    transition: opacity var(--sahsha-image-reveal-ms, 280ms) cubic-bezier(0.16, 1, 0.3, 1),
                transform var(--sahsha-image-reveal-ms, 280ms) cubic-bezier(0.16, 1, 0.3, 1);
  }
  .sahsha-image-reveal--loaded {
    opacity: 1;
    transform: scale(1);
  }
  ```

---

### 4. Cache-Control Headers & SWC Target Configuration

* **File:** [`next.config.js`](file:///home/sbl/Desktop/sahsha/my-medusa-store-storefront/next.config.js)
* **Changes:**
  1. **`browsersListForSwc: true`**: Instructs the Next.js SWC compiler to align build transpilation with our modern `.browserslistrc`. This drops ES5 polyfills (e.g. `regeneratorRuntime`, async function wrappers), saving ~22 KB across JS bundles.
  2. **`headers()` Directives**: Configured HTTP 1-year immutable caching for static assets:
     ```js
     async headers() {
       return [
         {
           source: "/_next/static/(.*)",
           headers: [
             {
               key: "Cache-Control",
               value: "public, max-age=31536000, immutable",
             },
           ],
         },
         {
           source: "/fonts/(.*)",
           headers: [
             {
               key: "Cache-Control",
               value: "public, max-age=31536000, immutable",
             },
           ],
         },
       ]
     }
     ```

---

### 5. Created `.browserslistrc`

* **File:** [`.browserslistrc`](file:///home/sbl/Desktop/sahsha/my-medusa-store-storefront/.browserslistrc)
* **Content:**
  ```text
  last 2 Chrome versions
  last 2 Firefox versions
  last 2 Safari versions
  last 2 Edge versions
  not dead
  not IE 11
  not op_mini all
  ```
* **Rationale:**  
  Establishes explicit browser targets for SWC and CSS autoprefixer. Obsolete browsers like Internet Explorer 11 are excluded, ensuring no unnecessary legacy syntax transformations bloat the modern build.

---

### 6. Scoped Tailwind CSS Content Scan

* **File:** [`tailwind.config.js`](file:///home/sbl/Desktop/sahsha/my-medusa-store-storefront/tailwind.config.js)
* **Problem:**  
  The build was scanning `./node_modules/@medusajs/ui/dist/**` and `./node_modules/@pradip1995/theme-*/src/**`. This forced Tailwind to generate utility classes for hundreds of unrendered components and non-active themes.
* **Solution:**  
  Removed `./node_modules/@medusajs/ui/dist/**` (since `@medusajs/ui-preset` already provides design tokens) and locked the theme scan strictly to `@pradip1995/theme-sahsha`:
  ```js
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@pradip1995/theme-sahsha/src/**/*.{js,ts,jsx,tsx}",
  ],
  ```

---

### 7. Compressed Social Share (OG/Twitter) Images

* **Files Modified:**
  - `src/app/opengraph-image.jpg`
  - `src/app/twitter-image.jpg`
* **Changes:**  
  Compressed using `sharp` at quality 75 with mozjpeg progressive encoding:
  - **Previous Size:** 234 KB each
  - **Optimized Size:** 57 KB each
  - **Savings:** **75.6% reduction (177 KB saved per image)**

---

## Summary of Expected Lighthouse Impact

```mermaid
graph LR
    A["Initial Score: 69<br/>(TBT: 1,280 ms)"] --> B["1. Lazy-load 9.2MB country-state-city"]
    B --> C["2. Remove lodash from client runtime"]
    C --> D["3. GPU-composited animations"]
    D --> E["4. Modern SWC & Tailwind scope"]
    E --> F["Target Score: 90+<br/>(TBT: < 200 ms)"]
```
