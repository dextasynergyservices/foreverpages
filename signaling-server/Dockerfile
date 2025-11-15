FROM node:20-alpine
WORKDIR /app

# Install only production dependencies
COPY package.json pnpm-lock.yaml* ./
RUN apk add --no-cache bash git openssh && \
    corepack enable && corepack prepare pnpm@latest --activate && pnpm install --prod

COPY . .
RUN pnpm build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
