# Backend Dockerfile - Laravel API
FROM php:8.2-fpm-alpine AS builder

# Install build-only dependencies (needed for composer & extensions)
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libmariadb-dev \
    libzip-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip \
    && pecl install redis \
    && docker-php-ext-enable redis

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy composer files first (best caching)
COPY composer.json composer.lock ./

# Install dependencies (cached until composer files change)
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Copy application source
COPY . /var/www

# Final install & permissions
RUN composer install --no-dev --optimize-autoloader --no-interaction \
    && chown -R 82:82 /var/www \
    && mkdir -p /var/www/storage /var/www/bootstrap/cache \
    && chmod -R 755 /var/www/storage /var/www/bootstrap/cache

# Expose port
EXPOSE 9000

# Health check: verify PHP-FPM master process is alive
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ps aux | grep -v grep | grep "php-fpm: master" > /dev/null || exit 1

# Switch to non-root user (www-data uid 82)
USER www-data

CMD ["php-fpm"]
