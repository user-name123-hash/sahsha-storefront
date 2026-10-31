# syntax=docker/dockerfile:1

# Use slim (glibc) — Alpine musl sharp corrupts AVIF product images from S3 (.png URLs).
FROM public.ecr.aws/docker/library/node:24-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips42 \
    libheif1 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY scripts ./scripts
RUN npm ci --prefer-offline --no-audit --legacy-peer-deps \
  && npm rebuild sharp

COPY . .
RUN --mount=type=secret,id=frontend_defaults \
    --mount=type=secret,id=app_env \
    sh -c 'cat /run/secrets/frontend_defaults /run/secrets/app_env > .env.production' \
    && npm run build \
    && npm prune --omit=dev

FROM public.ecr.aws/docker/library/node:24-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips42 \
    libheif1 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/check-env-variables.js ./check-env-variables.js
COPY --from=builder /app/image-remote-patterns.js ./image-remote-patterns.js
COPY --from=builder /app/image-config.js ./image-config.js
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 8000

CMD ["npm", "run", "start"]
