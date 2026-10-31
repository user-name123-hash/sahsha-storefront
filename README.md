# Storefront Template

Source for `@pradip1995/create-storefront` and monorepo reference app.

## Structure

```
src/
  app/           # Next.js routes (thin shells)
  modules/       # Legacy UI (icons, checkout, modals)
  theme/valero/  # Design — copy or replace per brand
  storefront.config.ts
```

Logic: `@pradip1995/commerce-core`, `commerce-auth`, `storefront-controllers`, `storefront-registry`

## Dev

```bash
pnpm install
pnpm --filter storefront-template dev
```

## After editing template

```bash
pnpm sync:template   # updates create-storefront CLI templates
```
