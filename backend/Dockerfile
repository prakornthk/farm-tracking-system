# Backend Dockerfile - Laravel API
FROM php:8.2-fpm-alpine AS builder

# Install build-only dependencies (needed for composer & extensions)
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    oniguruma-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy composer manifest first (best caching)
COPY composer.json ./

# Install dependencies (cached until composer files change)
# Note: we skip lock file here and run composer update in final stage
# to match container's PHP version (8.2)
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts \
    --ignore-platform-reqs || true

# Copy application source
COPY . /var/www

# Final install & permissions
RUN mkdir -p /var/www/storage /var/www/bootstrap/cache \
    && composer update --no-dev --optimize-autoloader --no-interaction \
    && chown -R 82:82 /var/www \
    && chmod -R 755 /var/www/storage /var/www/bootstrap/cache

# Expose port
EXPOSE 9000

# Health check: verify PHP-FPM master process is alive
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ps aux | grep -v grep | grep "php-fpm: master" > /dev/null || exit 1

# Switch to non-root user (www-data uid 82)
USER www-data

CMD ["php-fpm"]
