# AI guide — Medusa storefront kit

This project is a **Next.js storefront** built on published `@pradip1995/*` packages. Use this file to decide **where to change code** and **which package APIs to use**.

## Architecture

```
src/
  app/                    # Next.js routes — thin shells only
  modules/                # App-local UI (checkout steps, icons, modals)
  theme/<brand>/          # Design only — colors, layout, home blocks, slots
  storefront.config.ts    # Theme name, slot paths, home block order
  middleware.ts           # Country-code routing
```

| Layer | Location | Change when |
|-------|----------|-------------|
| Routes | `src/app/` | New page, metadata, URL |
| Page logic | `@pradip1995/storefront-controllers` | Data loading, page composition |
| Commerce logic | `@pradip1995/commerce-core` | Cart, checkout, product hooks, server data |
| Auth | `@pradip1995/commerce-auth` | Login, register, OTP, Google OAuth |
| Registry | `@pradip1995/storefront-registry` | Slot/block registry, `resolveComponent` |
| Design | `src/theme/<brand>/` | Colors, fonts, layout, home sections |
| Brand config | `src/storefront.config.ts` | Block order, enabled slots |

**Rule of thumb:** UI look-and-feel → theme. Shared commerce behavior → packages (then `npm update` + `npm run kit:sync-docs`).

## Path aliases (`tsconfig.json`)

```ts
import { useAddToCart } from "@core/hooks/use-add-to-cart"
import { loadHomeData } from "@controllers/home/load-home-data"
import { resolveComponent } from "@registry/resolve-component"
import { Login } from "@commerce-auth/components/login"
import Nav from "@theme/slots/layout/Nav"
import { storefrontConfig } from "@storefront-config"
import SomeModal from "@modules/checkout/components/payment"
```

Aliases resolve to `node_modules/@pradip1995/*/src/*` except `@theme/*` (local `src/theme/<brand>/`) and `@modules/*` (local `src/modules/`).

## Packages

<!-- AUTO-GENERATED:BEGIN kit-inventory -->

> **Auto-generated** from installed `@pradip1995/*` packages on 2026-06-19. Run `npm run kit:sync-docs` after `npm update` to refresh.

### `@pradip1995/commerce-core`

Medusa data layer, domain rules, React hooks, types, analytics, utilities.

**Hooks** (prefer in UI — do not call `@core/data/*` from theme/components):

| Hook | Use for |
|------|---------|
| `useAddToCart` | Add line item to cart |
| `useProductReviews` | Product reviews fetch/submit |
| `useServerAction` | Wrap server actions with loading/error |
| `useCart` | Cart state, line items, totals |
| `useProductVariant` | Selected variant state |
| `useProductActions` | PDP variant selection + add to cart |
| `useWishlist` | Wishlist add/remove/list |
| `useCheckout` | Payment + place order |
| `useShiprocketDeliveryEstimate` | Delivery ETA |
| `useShiprocketPincodeCheck` | Pincode serviceability |
| `useCartShippingCheckout` | Shipping options + checkout address flow |
| `usePaymentProviders` | Payment providers |

```ts
import { useAddToCart } from "@pradip1995/commerce-core/hooks/use-add-to-cart"
// or via alias:
import { useCart } from "@core/hooks/use-cart"
```

**Types:** `@core/types/account`, `@core/types/cart`, `@core/types/home`, `@core/types/layout`, `@core/types/product-card`

**Config / SDK:** `@pradip1995/commerce-core/config`

**Data** (`@core/data/*`): server-side only. Theme and client components must use hooks.

Key data modules: `cart`, `categories`, `collections`, `contact`, `cookies`, `customer`, `customer-registration`, `dynamic-config`, `fulfillment`, `guest`, `locale-actions`, `locales`, `newsletter`, `notifications`, `onboarding`, `orders`, `payment`, `payment-details`, `products`, `regions`, `returns`, `reviews`, `swaps`, `variants`, `wishlist`.

**Analytics:** `@pradip1995/commerce-core/analytics/*` (GA4, GTM, consent)

**Utils:** `@core/util/*` — browse `node_modules/@pradip1995/commerce-core/package.json` → `exports`.

---

### `@pradip1995/commerce-auth`

Login, register, forgot password, OTP, Google OAuth.

| Export path | Import |
|-------------|--------|
| `components/forgot-password` | `@commerce-auth/components/forgot-password` |
| `components/google-auth-shell` | `@commerce-auth/components/google-auth-shell` |
| `components/google-callback` | `@commerce-auth/components/google-callback` |
| `components/google-credential-button` | `@commerce-auth/components/google-credential-button` |
| `components/google-identity-script` | `@commerce-auth/components/google-identity-script` |
| `components/google-login` | `@commerce-auth/components/google-login` |
| `components/google-oauth-provider` | `@commerce-auth/components/google-oauth-provider` |
| `components/google-one-tap` | `@commerce-auth/components/google-one-tap` |
| `components/guest-order-modal` | `@commerce-auth/components/guest-order-modal` |
| `components/login` | `@commerce-auth/components/login` |
| `components/otp-input` | `@commerce-auth/components/otp-input` |
| `components/otp-verification-modal` | `@commerce-auth/components/otp-verification-modal` |
| `components/register` | `@commerce-auth/components/register` |
| `data/customer` | `@commerce-auth/data/customer` |
| `data/customer-registration` | `@commerce-auth/data/customer-registration` |
| `data/guest` | `@commerce-auth/data/guest` |
| `hooks/use-customer-otp` | `@commerce-auth/hooks/use-customer-otp` |
| `hooks/use-guest-otp` | `@commerce-auth/hooks/use-guest-otp` |
| `templates/login-template` | `@commerce-auth/templates/login-template` |
| `types/account` | `@commerce-auth/types/account` |
| `util/google-auth-client` | `@commerce-auth/util/google-auth-client` |

Theme slots under `slots/account/*` wrap these for brand styling.

---

### `@pradip1995/storefront-controllers`

Page controllers + data loaders. Routes stay thin — import from `@controllers/*`.

| Controller | Loader |
|------------|--------|
| `account/login-page` | `account/load-account-data` |
| `cart/cart-page` | `cart/load-cart-data` |
| `cart/cart-summary-slot` | `cart/load-cart-data` |
| `checkout/checkout-form-slot` | `checkout/load-checkout-data` |
| `checkout/checkout-page` | `checkout/load-checkout-data` |
| `checkout/checkout-summary-slot` | `checkout/load-checkout-data` |
| `home/home-page` | `home/load-home-data` |
| `layout/main-layout` | `layout/load-layout-data` |
| `order/order-details-controller` | `order/load-order-data` |
| `product/product-actions-wrapper` | (inline in controller) |
| `product/product-page` | (inline in controller) |

Controllers resolve theme slots via `@registry/resolve-component` — never `@theme/*` directly.

---

### `@pradip1995/storefront-registry`

- `storefront.config` — default slots and home blocks
- `resolve-component` — maps paths → `@theme/*` imports
- `blocks/home.blocks` — home block metadata

**Registered slots:** CartItem, CartSummary, CheckoutForm, CheckoutSummary, Footer, ForgotPassword, GoogleLogin, Login, LoginTemplate, Nav, OrderDetails, ProductActions, ProductCard, ProductInfo, PromoBar, Register

**Home block types:** hero, shopByAge, shopByCategory, whyChooseUs, newArrivals, lovedByMoms, testimonials, features

**Resolve import map paths:**

```
blocks/home/Features
blocks/home/Hero
blocks/home/LovedByMoms
blocks/home/NewArrivals
blocks/home/ShopByAge
blocks/home/ShopByCategory
blocks/home/Testimonials
blocks/home/WhyChooseUs
slots/account/ForgotPassword
slots/account/GoogleLogin
slots/account/Login
slots/account/LoginTemplate
slots/account/Register
slots/cart/CartItem
slots/cart/CartSummary
slots/checkout/CheckoutForm
slots/checkout/CheckoutSummary
slots/layout/Footer
slots/layout/Nav
slots/layout/PromoBar
slots/order/OrderDetails
slots/product/ProductActions
slots/product/ProductCard
slots/product/ProductInfo
```

Extend via `src/storefront.config.ts`. New paths also need an entry in registry `resolve-component.ts` (package update).

---

### Theme (`src/theme/<brand>/`)

Design-only. No `@core/data` or server actions in theme files.

```
theme/<brand>/
  tokens/theme.css
  blocks/home/
  slots/layout/ | slots/product/ | slots/cart/ | slots/checkout/ | slots/account/ | slots/order/
  primitives/
  layouts/
```

**Allowed:** `@core/hooks/*`, `@core/types/*`
**Forbidden:** `@core/data/*` — use hooks instead

<!-- AUTO-GENERATED:END kit-inventory -->

## Common tasks

| Task | Where |
|------|--------|
| Change colors / fonts | `src/theme/<brand>/tokens/theme.css` |
| Edit hero or home section | `src/theme/<brand>/blocks/home/<Block>/` |
| Reorder home sections | `src/storefront.config.ts` → `blocks.home` |
| Customize nav / footer | `src/theme/<brand>/slots/layout/` |
| PDP layout | `src/theme/<brand>/slots/product/` |
| Checkout UI (brand) | `src/theme/<brand>/slots/checkout/` |
| Checkout logic (shipping, payment) | `@core/hooks/*`, `src/modules/checkout/` |
| Medusa backend URL / keys | `.env.local` |
| New route | `src/app/` + optional controller in package |
| Google OAuth | `.env.local` → `NEXT_PUBLIC_GOOGLE_CLIENT_ID` |
| Image CDN hosts | `image-remote-patterns.js` |

## Environment

```bash
cp .env.example .env.local
# Required: MEDUSA_BACKEND_URL, NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
# Optional: NEXT_PUBLIC_GOOGLE_CLIENT_ID, Firebase keys
```

## Updating packages

```bash
npm update @pradip1995/commerce-core @pradip1995/commerce-auth \
  @pradip1995/storefront-controllers @pradip1995/storefront-registry
npm run kit:sync-docs
```

After updates, check CHANGELOG on [medusa-storefront-kit](https://github.com/SmartByteLabs/medusa-storefront-kit).

<!-- AUTO-GENERATED:BEGIN kit-versions -->

Installed kit packages (refresh after `npm update`):

| Package | package.json range | Installed version |
|---------|-------------------|-------------------|
| @pradip1995/commerce-core | ^3.1.1 | 3.1.1 |
| @pradip1995/commerce-auth | ^3.1.2 | 3.1.2 |
| @pradip1995/storefront-controllers | ^3.1.7 | 3.1.7 |
| @pradip1995/storefront-registry | ^3.0.0 | 3.0.0 |

<!-- AUTO-GENERATED:END kit-versions -->

## Cursor rules

See `.cursor/rules/` for import boundaries and theme constraints applied automatically in this editor.
