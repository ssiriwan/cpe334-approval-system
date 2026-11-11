# syntax=docker/dockerfile:1

# --- Base image -------------------------------------------------------------
FROM node:20-alpine AS base
WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    PORT=3000

# --- Install workspace dependencies ----------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
RUN npm ci

# --- Build Prisma client, server, and client -------------------------------
FROM deps AS build
COPY . .
RUN npx prisma generate --schema prisma/schema.prisma
RUN npm run build

# --- Runtime ----------------------------------------------------------------
# One container serves the API and the built React client. Prisma CLI and tsx
# stay available so the same image can run migration jobs and the seed script.
FROM base AS runtime
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
COPY prisma ./prisma
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/client/dist ./client/dist

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null || exit 1

USER node
CMD ["node", "server/dist/server.js"]
