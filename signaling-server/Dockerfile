FROM node:20-alpine AS builder
WORKDIR /app

# Install dev + prod deps so we can run the TypeScript build
COPY package.json pnpm-lock.yaml* ./
RUN apk add --no-cache bash git openssh && \
    corepack enable && corepack prepare pnpm@latest --activate && pnpm install

# Copy sources and build
COPY . .
RUN pnpm build

FROM node:20-alpine AS runtime
WORKDIR /app

# Install only production deps in the final image
COPY package.json pnpm-lock.yaml* ./
RUN apk add --no-cache bash && \
    corepack enable && corepack prepare pnpm@latest --activate && pnpm install --prod

# Copy built output from the builder stage
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
