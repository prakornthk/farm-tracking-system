# Web Admin Dockerfile - React + Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (best caching)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage - nginx
FROM nginx:alpine

# Install curl for healthcheck (removed after)
RUN apk add --no-cache curl

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx SPA config
COPY nginx.spa.conf /etc/nginx/conf.d/default.conf

# Run as non-root user
# nginx alpine uses 'nginx' user (uid 82)
USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
