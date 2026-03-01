# syntax=docker/dockerfile:1

# --- Stage 1: Install dependencies ---
FROM node:20-alpine AS deps
RUN apk add --no-cache python3 make g++ gcc
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN if [ -f pnpm-lock.yaml ]; then \
      npm install -g pnpm && pnpm install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then \
      npm ci; \
    else \
      npm install; \
    fi

# --- Stage 2: Build the application ---
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++ gcc
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Stage 3: Production runner ---
FROM node:20-alpine AS runner
RUN apk add --no-cache python3 make g++ gcc
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Rebuild native modules for the runner image
COPY --from=deps /app/node_modules ./node_modules
RUN cd node_modules/better-sqlite3 && npx --yes prebuild-install || npm run build-release

EXPOSE 3000

CMD ["node", "server.js"]
