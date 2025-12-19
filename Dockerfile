FROM node:20-alpine AS builder

# Install build dependencies for native modules (canvas)
RUN apk add --no-cache python3 make g++ pkgconfig cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

# Install runtime dependencies for canvas and fonts
RUN apk add --no-cache cairo pango libjpeg-turbo giflib librsvg fontconfig ttf-dejavu

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public

EXPOSE 5000

CMD ["node", "dist/index.js"]
