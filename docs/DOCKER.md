# 🐳 คู่มือ Docker สำหรับ Farm Tracking System

> คู่มือการใช้งาน Docker Compose — NiSK Dev Team

---

## 📋 สารบัญ

1. [Docker Compose Overview](#docker-compose-overview)
2. [Services ทั้งหมด](#services-ทั้งหมด)
3. [Commands ที่ใช้บ่อย](#commands-ที่ใช้บ่อย)
4. [Logs และ Debugging](#logs-และ-debugging)
5. [Health Checks](#health-checks)
6. [Network Configuration](#network-configuration)

---

## 📦 Docker Compose Overview

### โครงสร้างระบบ

ระบบ Farm Tracking ใช้ Docker Compose เพื่อจัดการ services ต่างๆ ดังนี้:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Docker Compose                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │  Backend     │    │  Web Admin   │    │  LIFF App    │     │
│  │  (Laravel)   │    │  (React)     │    │  (React)     │     │
│  │  Port:8000   │    │  Port:80     │    │  Port:80     │     │
│  │              │    │              │    │              │     │
│  └──────┬───────┘    └──────────────┘    └──────────────┘     │
│         │                                                         │
│  ┌──────▼───────┐    ┌──────────────┐                          │
│  │  MariaDB     │    │    nginx     │                          │
│  │  (Database)  │    │  (Proxy)     │                          │
│  │  Port:3306   │    │  Port:8080   │                          │
│  │              │    │              │                          │
│  └──────────────┘    └──────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Services ที่มี

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| **backend** | Custom (Laravel) | 18000 | Laravel API Backend |
| **web-admin** | Custom (React) | 18080 | Web Admin Interface |
| **liff-app** | Custom (React) | 18081 | LINE LIFF Application |
| **mariadb** | mariadb:10.11 | 3306 (internal) | Database Server |
| **nginx** | nginx:alpine | 8080/8443 | Reverse Proxy |

---

## 🖥️ Services ทั้งหมด

### 1. Backend Service (Laravel API)

```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  container_name: farm-backend
  restart: unless-stopped
  user: "82:82"
  command: php artisan serve --host=0.0.0.0 --port=8000
  environment:
    APP_ENV: ${APP_ENV:-production}
    APP_DEBUG: ${APP_DEBUG:-false}
    APP_KEY: ${APP_KEY}
    APP_URL: ${APP_URL}
    DB_CONNECTION: mysql
    DB_HOST: mariadb
    DB_PORT: 3306
    DB_DATABASE: ${MARIADB_DATABASE}
    DB_USERNAME: ${MARIADB_USER}
    DB_PASSWORD: ${MARIADB_PASSWORD}
    LINE_CLIENT_ID: ${LINE_CLIENT_ID}
    LINE_CLIENT_SECRET: ${LINE_CLIENT_SECRET}
    LINE_REDIRECT_URI: ${LINE_REDIRECT_URI}
  ports:
    - "0.0.0.0:18000:8000"
  volumes:
    - backend_storage:/var/www/storage
    - backend_bootstrap:/var/www/bootstrap/cache
  networks:
    - farm-network
  depends_on:
    mariadb:
      condition: service_healthy
```

**รายละเอียด:**
- ใช้ PHP 8.2 กับ Laravel
- Run บน port 18000 (internal: 8000)
- เชื่อมต่อกับ MariaDB ผ่าน internal network
- ใช้ user 82:82 (www-data) เพื่อความปลอดภัย

**Volumes:**
- `backend_storage` - เก็บไฟล์ upload, logs, cache
- `backend_bootstrap` - Laravel bootstrap cache

---

### 2. Web Admin Service (React SPA)

```yaml
web-admin:
  build:
    context: ./web-admin
    dockerfile: Dockerfile
    args:
      VITE_LINE_CLIENT_ID: ${VITE_LINE_CLIENT_ID:-}
      VITE_LINE_REDIRECT_URI: ${VITE_LINE_REDIRECT_URI:-}
  container_name: farm-web-admin
  restart: unless-stopped
  ports:
    - "0.0.0.0:18080:80"
  volumes:
    - ./web-admin/nginx.spa.conf:/etc/nginx/conf.d/default.conf:ro
  networks:
    - farm-network
  depends_on:
    - backend
```

**รายละเอียด:**
- React SPA สำหรับจัดการระบบ
- Run บน port 18080
- ใช้ nginx เพื่อ serve static files
- สื่อสารกับ backend ผ่าน internal network

**nginx SPA Config:**
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy (ถ้าต้องการ)
    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

### 3. LIFF App Service (React SPA)

```yaml
liff-app:
  build:
    context: ./liff-app
    dockerfile: Dockerfile
    args:
      VITE_LIFF_ID: ${LIFF_ID:-}
      VITE_API_BASE: ${VITE_API_BASE:-https://api.farm-system.example.com}
  container_name: farm-liff-app
  restart: unless-stopped
  ports:
    - "0.0.0.0:18081:80"
  volumes:
    - ./liff-app/nginx.spa.conf:/etc/nginx/conf.d/default.conf:ro
  networks:
    - farm-network
  depends_on:
    - backend
```

**รายละเอียด:**
- LINE LIFF Application สำหรับ mobile
- Run บน port 18081
- ใช้ VITE_LIFF_ID สำหรับ LINE SDK
- สื่อสารกับ backend ผ่าน internal network

---

### 4. MariaDB Service (Database)

```yaml
mariadb:
  image: mariadb:10.11
  container_name: farm-mariadb
  restart: unless-stopped
  environment:
    MARIADB_ROOT_PASSWORD: ${MARIADB_ROOT_PASSWORD}
    MARIADB_DATABASE: ${MARIADB_DATABASE}
    MARIADB_USER: ${MARIADB_USER}
    MARIADB_PASSWORD: ${MARIADB_PASSWORD}
  volumes:
    - mariadb_data:/var/lib/mysql
  networks:
    - farm-network
  healthcheck:
    test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
    interval: 10s
    timeout: 5s
    retries: 5
```

**รายละเอียด:**
- MariaDB 10.11 (LTS)
- เก็บข้อมูลใน volume `mariadb_data`
- มี health check เพื่อให้มั่นใจว่าพร้อมใช้งาน
- ไม่เปิด port ออกมาภายนอก (internal only)

**Environment Variables:**

| Variable | คำอธิบาย |
|----------|---------|
| `MARIADB_ROOT_PASSWORD` | Password ของ root |
| `MARIADB_DATABASE` | ชื่อ database |
| `MARIADB_USER` | Username สำหรับ application |
| `MARIADB_PASSWORD` | Password ของ user |

---

### 5. nginx Service (Reverse Proxy)

```yaml
nginx:
  image: nginx:alpine
  container_name: farm-nginx
  restart: unless-stopped
  profiles:
    - internal-nginx
  ports:
    - "8080:80"
    - "8443:443"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/conf.d:/etc/nginx/conf.d:ro
  networks:
    - farm-network
  depends_on:
    - backend
    - web-admin
    - liff-app
```

**รายละเอียด:**
- nginx alpine สำหรับ reverse proxy
- Run บน port 8080 (HTTP) และ 8443 (HTTPS)
- profile: `internal-nginx` หมายความว่าต้องเปิดใช้งานด้วย `-P internal-nginx`
- รวม traffic จากทุก services

**nginx.conf:**
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    upstream web-admin {
        server web-admin:80;
    }

    upstream liff-app {
        server liff-app:80;
    }

    server {
        listen 80;
        server_name farm-system.example.com;

        # Backend API
        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Web Admin
        location /admin {
            rewrite ^/admin/(.*) /$1 break;
            proxy_pass http://web-admin;
        }

        # LIFF App
        location /liff {
            rewrite ^/liff/(.*) /$1 break;
            proxy_pass http://liff-app;
        }

        # Health Check
        location /health {
            access_log off;
            return 200 "OK";
        }
    }
}
```

---

## 🔧 Commands ที่ใช้บ่อย

### คำสั่งพื้นฐาน

```bash
# Build และ Run services
docker compose up -d
docker compose up -d --build

# Stop services
docker compose down

# Stop และลบ volumes (⚠️ ลบข้อมูล!)
docker compose down -v

# Restart services
docker compose restart

# Pause/Unpause services
docker compose pause
docker compose unpause
```

### คำสั่งสำหรับ Development

```bash
# Run แบบไม่ detach (เห็น logs แบบ real-time)
docker compose up

# Rebuild เฉพาะ service ที่ต้องการ
docker compose up -d --build backend

# Run พร้อม rebuild ถ้าจำเป็น
docker compose up -d --force-recreate backend

# เปิด shell ใน container
docker compose exec backend sh
docker compose exec mariadb bash

# Sync code (hot reload) - สำหรับ development
docker compose up -d
```

### คำสั่งสำหรับ Production

```bash
# Start services ทั้งหมด
docker compose up -d

# เช็คสถานะ
docker compose ps

# ดู logs ทั้งหมด
docker compose logs

# ดู logs ของ service เฉพาะ
docker compose logs backend
docker compose logs web-admin
docker compose logs liff-app
docker compose logs mariadb

# ดู logs แบบ real-time
docker compose logs -f
docker compose logs -f backend

# ดู logs พร้อม timestamps
docker compose logs -t
```

### คำสั่งสำหรับ Maintenance

```bash
# Clear Laravel cache
docker compose exec backend php artisan cache:clear
docker compose exec backend php artisan config:clear
docker compose exec backend php artisan view:clear
docker compose exec backend php artisan route:clear

# Rebuild cache
docker compose exec backend php artisan config:cache
docker compose exec backend php artisan route:cache
docker compose exec backend php artisan view:cache

# Rebuild permissions
docker compose exec backend chown -R www-data:www-data /var/www/storage
docker compose exec backend chmod -R 775 /var/www/storage
docker compose exec backend chmod -R 775 /var/www/bootstrap/cache
```

### คำสั่งสำหรับ Database

```bash
# Run migrations
docker compose exec backend php artisan migrate

# Rollback migrations
docker compose exec backend php artisan migrate:rollback

# Fresh migrate (⚠️ ลบข้อมูล!)
docker compose exec backend php artisan migrate:fresh

# Seed data
docker compose exec backend php artisan db:seed

# Fresh migrate + seed
docker compose exec backend php artisan migrate:fresh --seed

# เข้า mysql CLI
docker compose exec mariadb mysql -u farm_user -p farm_system
```

### คำสั่งสำหรับ Cleanup

```bash
# ลบ images ที่ไม่ได้ใช้
docker image prune -a

# ลบ volumes ที่ไม่ได้ใช้
docker volume prune

# ลบ containers ที่หยุดแล้ว
docker container prune

# ลบทั้งหมดที่ไม่ได้ใช้
docker system prune -a
```

---

## 📋 Logs และ Debugging

### การดู Logs

```bash
# logs ทั้งหมด
docker compose logs

# logs ของ service เฉพาะ
docker compose logs backend
docker compose logs web-admin
docker compose logs liff-app
docker compose logs mariadb
docker compose logs nginx

# logs แบบ real-time (follow)
docker compose logs -f
docker compose logs -f backend

# logs พร้อม timestamps
docker compose logs -t

# logs จำนวนบรรทัดที่กำหนด
docker compose logs --tail=100
docker compose logs --tail=100 backend

# logs ตั้งแต่เวลาที่กำหนด
docker compose logs --since=1h
docker compose logs --since=2024-01-01T00:00:00
```

### การ Debug Problems

#### Problem: Container ไม่ start

```bash
# ดูสถานะ
docker compose ps -a

# ดู logs ล่าสุด
docker compose logs backend

# ดู logs อย่างละเอียด
docker compose logs --details backend

# ตรวจสอบ container
docker inspect farm-backend

# ลอง start ใหม่
docker compose up -d backend
```

#### Problem: เชื่อมต่อ Database ไม่ได้

```bash
# ดูสถานะ mariadb
docker compose ps mariadb

# ดู logs mariadb
docker compose logs mariadb

# ตรวจสอบ health check
docker compose exec mariadb sh -c 'exec mysqladmin ping -h localhost -u root -p'

# เช็คว่า mariadb พร้อมใช้งานหรือยัง
docker compose exec mariadb sh -c 'exec mysql -u root -proot_password -e "SELECT 1"'
```

#### Problem: Permission Issues

```bash
# แก้ไข permissions ของ storage
docker compose exec backend chown -R www-data:www-data /var/www/storage
docker compose exec backend chmod -R 775 /var/www/storage
docker compose exec backend chmod -R 775 /var/www/bootstrap/cache

# ถ้าใช้ Linux อาจต้องเปลี่ยน ownership ของ volume
sudo chown -R 82:82 ./backend/storage
sudo chown -R 82:82 ./backend/bootstrap/cache
```

#### Problem: Port ชนกัน

```bash
# ดูว่า port ใดถูกใช้งาน
sudo lsof -i :18000
sudo lsof -i :18080
sudo lsof -i :18081

# หรือ
netstat -tlnp | grep 18000
```

#### Problem: Docker ใช้ RAM มากเกินไป

```bash
# ดู resource usage
docker stats

# จำกัด memory
# เพิ่มใน docker-compose.yml:
# services:
#   backend:
#     mem_limit: 512m
#     mem_reservation: 256m
```

### การ Debug ด้วย Tools

```bash
# เข้า container
docker compose exec backend sh
docker compose exec mariadb bash

# ตรวจสอบ PHP
docker compose exec backend php -v
docker compose exec backend php -m

# ตรวจสอบ Laravel
docker compose exec backend php artisan about
docker compose exec backend php artisan route:list

# ตรวจสอบ nginx
docker compose exec nginx nginx -t

# ตรวจสอบ MariaDB
docker compose exec mariadb mysql --version
docker compose exec mariadb mariadb-admin ping
```

---

## 💚 Health Checks

### การตรวจสอบ Health Status

```bash
# ดูสถานะทั้งหมด
docker compose ps

# ผลลัพธ์ตัวอย่าง:
# NAME                STATUS
# farm-backend        Up (healthy)
# farm-mariadb        Up (healthy)
# farm-web-admin      Up (healthy)
# farm-liff-app       Up (healthy)
```

### Health Check ของแต่ละ Service

#### Backend Health Check

```bash
# HTTP Health Check
curl -fsS http://localhost:18000/api/health

# ผลลัพธ์ที่คาดหวัง:
# {"status":"ok","timestamp":"2024-01-01T00:00:00Z"}
```

#### Web Admin Health Check

```bash
# HTTP Health Check
curl -fsS http://localhost:18080

# ผลลัพธ์: HTML page (200 OK)
```

#### LIFF App Health Check

```bash
# HTTP Health Check
curl -fsS http://localhost:18081

# ผลลัพธ์: HTML page (200 OK)
```

#### MariaDB Health Check

```bash
# ดู health check status
docker compose ps mariadb

# ตรวจสอบด้วย mysqladmin
docker compose exec mariadb mariadb-admin ping -h localhost -u root -p

# หรือ
docker compose exec mariadb sh -c 'exec mysqladmin ping -h localhost -u root -p$MARIADB_ROOT_PASSWORD'
```

### การตรวจสอบด้วย docker inspect

```bash
# ดู health check status ของ container
docker inspect --format='{{json .State.Health}}' farm-backend

# ผลลัพธ์ตัวอย่าง:
# {
#   "Status": "healthy",
#   "FailingStreak": 0,
#   "Log": [
#     {
#       "Start": "2024-01-01T00:00:00.000000000Z",
#       "End": "2024-01-01T00:00:00.000000000Z",
#       "ExitCode": 0,
#       "Output": ""
#     }
#   ]
# }
```

### การ Restart เมื่อ Health Check Fail

Docker Compose จะ restart container อัตโนมัติเมื่อ health check fail:

```bash
# ดูว่ามี restart count หรือไม่
docker compose ps

# ดู logs เมื่อ container restart
docker compose logs --since=5m
```

---

## 🌐 Network Configuration

### Network Overview

```
Network: farm-network (bridge driver)
├── backend (10.0.0.2)
│   └── Port: 8000
├── web-admin (10.0.0.3)
│   └── Port: 80
├── liff-app (10.0.0.4)
│   └── Port: 80
├── mariadb (10.0.0.5)
│   └── Port: 3306
└── nginx (10.0.0.6)
    └── Port: 80, 443
```

### Network Configuration

```yaml
networks:
  farm-network:
    driver: bridge
```

### การเชื่อมต่อระหว่าง Services

#### Backend → MariaDB

```php
// Laravel .env
DB_CONNECTION=mysql
DB_HOST=mariadb
DB_PORT=3306
DB_DATABASE=farm_system
DB_USERNAME=farm_user
DB_PASSWORD=your_password
```

#### Backend → nginx (ผ่าน internal network)

```nginx
# ใน nginx.conf
upstream backend {
    server backend:8000;
}
```

#### Frontend → Backend API

```javascript
// Vite config ของ React
// VITE_API_BASE ต้องชี้ไปที่ backend URL
VITE_API_BASE=http://localhost:18000
// หรือถ้าใช้ nginx reverse proxy
VITE_API_BASE=http://localhost:8080
```

### การ Expose Ports

```yaml
services:
  backend:
    ports:
      - "0.0.0.0:18000:8000"  # Host:Container
  
  web-admin:
    ports:
      - "0.0.0.0:18080:80"
  
  liff-app:
    ports:
      - "0.0.0.0:18081:80"
  
  nginx:
    ports:
      - "8080:80"     # HTTP
      - "8443:443"    # HTTPS
```

### Port Mapping Summary

| Service | Internal Port | External Port | URL |
|---------|--------------|---------------|-----|
| Backend | 8000 | 18000 | http://localhost:18000 |
| Web Admin | 80 | 18080 | http://localhost:18080 |
| LIFF App | 80 | 18081 | http://localhost:18081 |
| nginx | 80 | 8080 | http://localhost:8080 |
| nginx | 443 | 8443 | https://localhost:8443 |
| MariaDB | 3306 | (internal only) | - |

### การตรวจสอบ Network

```bash
# ดู networks ทั้งหมด
docker network ls

# ดู details ของ network
docker network inspect farm-system_farm-network

# ดูว่า container เชื่อมต่อ network อะไร
docker inspect farm-backend | grep -A 10 Networks

# ping จาก container หนึ่งไปอีก container
docker compose exec backend ping mariadb
docker compose exec web-admin ping backend
```

### DNS Resolution

Container สามารถติดต่อกันด้วยชื่อ service ได้เลย:

```bash
# จาก backend ไป mariadb
docker compose exec backend mysql -h mariadb -u farm_user -p

# จาก web-admin ไป backend
docker compose exec web-admin curl http://backend:8000/api/health
```

---

## 🔒 Security Best Practices

### User Permissions

```yaml
# ใช้ non-root user
services:
  backend:
    user: "82:82"  # www-data
```

### Secrets Management

```bash
# อย่า hardcode secrets ใน docker-compose.yml
# ใช้ .env file แทน

# ตัวอย่าง .env
MARIADB_ROOT_PASSWORD=change_me_in_production
LINE_CLIENT_SECRET=your_secret_here
```

### Network Isolation

```yaml
# ไม่เปิด port ของ database ออกภายนอก
services:
  mariadb:
    # ไม่มี ports: section
    networks:
      - farm-network  # Internal only
```

---

## 📞 ติดต่อสอบถาม

หากพบปัญหาในการใช้งาน Docker กรุณาติดต่อทีมพัฒนา:

- **อีเมล:** dev@nisk.co.th
- **GitHub Issues:** https://github.com/your-org/farm-system/issues

---

_เอกสารนี้จัดทำโดย NiSK Dev Team © 2024_
