ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json prisma.config.ts tsconfig.json ./
COPY prisma ./prisma
RUN npm ci

FROM deps AS builder
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public" \
    ENCRYPTION_KEY="0000000000000000000000000000000000000000000000000000000000000000" \
    AUTH_SECRET="build-only-placeholder"
COPY . .
RUN npm run build

FROM deps AS migrator
ENV NODE_ENV=production
CMD ["npm", "run", "db:deploy"]

FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
