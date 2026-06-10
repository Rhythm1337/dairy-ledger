# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────
# Multi-stage build for a minimal production Next.js image.
# Final image runs the standalone server as a non-root user.
# ─────────────────────────────────────────────────────────────

FROM node:20-alpine AS base
# libc6-compat: some native deps expect glibc symbols on Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 1. Install dependencies (cached unless package files change)
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Build the app
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. Minimal runtime image
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Run as an unprivileged user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy only what the standalone server needs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Basic container healthcheck against the running server
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
