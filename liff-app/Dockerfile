# LIFF App Dockerfile - React + Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (best caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Build-time environment for Vite
ARG VITE_LIFF_ID
ARG VITE_API_BASE
ENV VITE_LIFF_ID=$VITE_LIFF_ID
ENV VITE_API_BASE=$VITE_API_BASE

# Build
RUN npm run build

# Production stage - nginx
FROM nginx:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx SPA config
COPY nginx.spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
