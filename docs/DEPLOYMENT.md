# 🚀 คู่มือการ Deploy ระบบ Farm Tracking

> คู่มือสำหรับผู้ดูแลระบบ — NiSK Dev Team

---

## 📋 สารบัญ

1. [Deploy บน Server ด้วย Docker](#deploy-บน-server-ด้วย-docker)
2. [Deploy บน Ubuntu ด้วย nginx](#deploy-บน-ubuntu-ด้วย-nginx)
3. [Environment Configuration สำหรับ Production](#environment-configuration-สำหรับ-production)
4. [การตั้งค่า SSL/HTTPS](#การตั้งค่า-sslhttps)
5. [Docker Compose Commands สำหรับ Production](#docker-compose-commands-สำหรับ-production)
6. [Backup & Restore Database](#backup--restore-database)

---

## 🐳 Deploy บน Server ด้วย Docker

> **วิธีที่แนะนำ** — ง่าย รวดเร็ว และสะดวกในการจัดการ

### ข้อกำหนดเบื้องต้นของ Server

| ซอฟต์แวร์ | เวอร์ชันขั้นต่ำ |
|----------|----------------|
| Ubuntu | 20.04 หรือ 22.04 |
| Docker | 20.10+ |
| Docker Compose | 2.0+ |
| RAM | 4 GB+ |
| Disk | 20 GB+ |
| CPU | 2 cores+ |

### ขั้นตอนที่ 1: เตรียม Server

```bash
# อัปเดตระบบ
sudo apt update && sudo apt upgrade -y

# ติดตั้ง Docker
curl -fsSL https://get.docker.com | sh

# เพิ่ม user เข้ากลุ่ม docker
sudo usermod -aG docker $USER

# ติดตั้ง Docker Compose
sudo apt install docker-compose-plugin

# ตรวจสอบเวอร์ชัน
docker --version
docker compose version
```

### ขั้นตอนที่ 2: Clone โปรเจกต์

```bash
# สร้างโฟลเดอร์สำหรับโปรเจกต์
sudo mkdir -p /var/www/farm-system
cd /var/www/farm-system

# Clone โปรเจกต์
sudo git clone https://github.com/your-org/farm-system.git .
sudo chown -R $USER:$USER /var/www/farm-system
```

### ขั้นตอนที่ 3: ตั้งค่า Environment สำหรับ Production

```bash
cd /var/www/farm-system
cp .env.example .env
```

แก้ไขไฟล์ `.env` โดยกำหนดค่าต่างๆ ดังนี้:

```env
# ===========================================
# Application Settings (Production)
# ===========================================
APP_NAME="Farm Tracking System"
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:YOUR_GENERATED_KEY_HERE
APP_URL=https://farm-system.yourdomain.com

# ===========================================
# Database Configuration
# ===========================================
DB_CONNECTION=mysql
DB_HOST=mariadb
DB_PORT=3306
DB_DATABASE=farm_system
DB_USERNAME=farm_user
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE

# ===========================================
# Docker Database Settings
# ===========================================
MARIADB_ROOT_PASSWORD=YOUR_STRONG_ROOT_PASSWORD
MARIADB_DATABASE=farm_system
MARIADB_USER=farm_user
MARIADB_PASSWORD=YOUR_STRONG_PASSWORD_HERE

# ===========================================
# Session & Cache (ใช้ Redis ใน Production)
# ===========================================
SESSION_DRIVER=file
CACHE_DRIVER=file
QUEUE_CONNECTION=sync

# ===========================================
# LINE Login Settings
# ===========================================
LINE_CLIENT_ID=YOUR_LINE_CLIENT_ID
LINE_CLIENT_SECRET=YOUR_LINE_CLIENT_SECRET
LINE_REDIRECT_URI=https://farm-system.yourdomain.com/api/auth/line/callback

# ===========================================
# LIFF App Settings
# ===========================================
LIFF_ID=YOUR_LIFF_ID

# ===========================================
# Frontend Environment
# ===========================================
VITE_LINE_CLIENT_ID=YOUR_LINE_CLIENT_ID
VITE_LINE_REDIRECT_URI=https://farm-system.yourdomain.com/api/auth/line/callback
VITE_API_BASE=https://farm-system.yourdomain.com
```

### ขั้นตอนที่ 4: Generate APP_KEY

```bash
# สร้าง APP_KEY ใหม่
docker compose run --rm backend php artisan key:generate
```

### ขั้นตอนที่ 5: Build และ Run Containers

```bash
# Build image ทั้งหมด
docker compose build --no-cache

# Run containers
docker compose up -d

# ดูสถานะ
docker compose ps
```

### ขั้นตอนที่ 6: Run Migrations

```bash
# Run migrations
docker compose exec backend php artisan migrate

# (Optional) เพิ่มข้อมูล demo
docker compose exec backend php artisan db:seed
```

### ขั้นตอนที่ 7: ตั้งค่า Firewall

```bash
# เปิดพอร์ตที่จำเป็น
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS

# เปิดใช้งาน firewall
sudo ufw enable
```

---

## 🌐 Deploy บน Ubuntu ด้วย nginx

> **สำหรับ Server ที่ไม่ใช้ Docker** หรือต้องการติดตั้งแบบ Manual

### ส่วนที่ 1: ติดตั้ง nginx และ PHP-FPM

```bash
# ติดตั้ง nginx และ PHP
sudo apt install nginx php8.2-fpm php8.2-cli php8.2-mysql php8.2-xml php8.2-mbstring php8.2-curl php8.2-zip

# ตรวจสอบสถานะ
sudo systemctl status nginx
sudo systemctl status php8.2-fpm
```

### ส่วนที่ 2: ตั้งค่า nginx Virtual Host

```bash
sudo nano /etc/nginx/sites-available/farm-system
```

เพิ่ม configuration ดังนี้:

```nginx
server {
    listen 80;
    server_name farm-system.yourdomain.com;

    root /var/www/farm-system/backend/public;
    index index.php index.html;

    # สำหรับ Laravel
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Frontend (Web Admin)
    location /admin {
        alias /var/www/farm-system/web-admin/dist;
        try_files $uri $uri/ /admin/index.html;
    }

    # Frontend (LIFF App)
    location /liff {
        alias /var/www/farm-system/liff-app/dist;
        try_files $uri $uri/ /liff/index.html;
    }

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache Static Files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# เปิดใช้งาน site
sudo ln -s /etc/nginx/sites-available/farm-system /etc/nginx/sites-enabled/

# ทดสอบ configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### ส่วนที่ 3: ตั้งค่า Permissions

```bash
# กำหนด ownership
sudo chown -R www-data:www-data /var/www/farm-system

# กำหนด permissions
cd /var/www/farm-system/backend
sudo chmod -R 775 storage bootstrap/cache
sudo chmod -R 775 ../web-admin/dist
sudo chmod -R 775 ../liff-app/dist
```

---

## 🔒 Environment Configuration สำหรับ Production

### Checklist การตั้งค่า Production

- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `APP_KEY` ตั้งค่าแล้ว
- [ ] `APP_URL` ใช้ HTTPS
- [ ] `DB_PASSWORD` ตั้งค่าใหม่ (ไม่ใช่ default)
- [ ] `LINE_CLIENT_SECRET` ตั้งค่าแล้ว
- [ ] Firewall เปิดเฉพาะพอร์ตที่จำเป็น
- [ ] SSL Certificate ติดตั้งแล้ว

### Variables ที่ต้องเปลี่ยนเป็น Production

| Variable | ค่า Development | ค่า Production |
|----------|----------------|----------------|
| `APP_ENV` | `local` | `production` |
| `APP_DEBUG` | `true` | `false` |
| `APP_URL` | `http://localhost:18000` | `https://farm-system.com` |
| `DB_HOST` | `127.0.0.1` | `mariadb` |

### การสร้าง APP_KEY ใหม่

```bash
# สำหรับ Docker
docker compose run --rm backend php artisan key:generate

# สำหรับ Manual
cd backend
php artisan key:generate
```

---

## 🔐 การตั้งค่า SSL/HTTPS

### วิธีที่ 1: ใช้ Let's Encrypt (แนะนำ)

```bash
# ติดตั้ง Certbot
sudo apt install certbot python3-certbot-nginx

# ขอ certificate
sudo certbot --nginx -d farm-system.yourdomain.com

# ทดสอบ auto-renewal
sudo certbot renew --dry-run
```

### วิธีที่ 2: ใช้ Cloudflare (ฟรี)

1. สมัครบัญชี Cloudflare
2. เปลี่ยน Nameservers ของ domain
3. เปิดใช้งาน "Flexible SSL" หรือ "Full SSL"
4. เพิ่ม DNS record ชี้ไปยัง Server IP

### วิธีที่ 3: Self-signed Certificate (สำหรับทดสอบ)

```bash
# สร้าง self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt

# สร้าง Diffie-Hellman parameters
sudo openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048
```

### nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name farm-system.yourdomain.com;

    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
    ssl_dhparam /etc/ssl/certs/dhparam.pem;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # ... rest of configuration
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name farm-system.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 📦 Docker Compose Commands สำหรับ Production

### คำสั่งพื้นฐาน

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Stop และลบ volumes (⚠️ ลบข้อมูล!)
docker compose down -v

# Restart services
docker compose restart

# Rebuild และ start
docker compose up -d --build
```

### คำสั่งสำหรับดูสถานะและ Logs

```bash
# ดูสถานะ containers
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

# ดู logs พร้อม timestamps
docker compose logs -t
```

### คำสั่งสำหรับ Maintenance

```bash
# Clear cache
docker compose exec backend php artisan cache:clear
docker compose exec backend php artisan config:clear
docker compose exec backend php artisan view:clear

# Rebuild cache
docker compose exec backend php artisan config:cache
docker compose exec backend php artisan route:cache

# Clear logs
docker compose exec backend php artisan log:clear
```

### คำสั่งสำหรับ Database

```bash
# Run migrations
docker compose exec backend php artisan migrate

# Rollback
docker compose exec backend php artisan migrate:rollback

# Fresh migrate (⚠️ ลบข้อมูล!)
docker compose exec backend php artisan migrate:fresh

# Seed data
docker compose exec backend php artisan db:seed
```

### คำสั่งสำหรับ Backup

```bash
# Backup database
docker compose exec mariadb sh -c 'exec mysqldump -u$fARM_USER -p$fARM_PASSWORD $FARM_DATABASE' > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker compose exec -T mariadb sh -c 'exec mysql -u$FARM_USER -p$FARM_PASSWORD $FARM_DATABASE' < backup_file.sql
```

### การ Update เวอร์ชันใหม่

```bash
# 1. Pull โค้ดใหม่
cd /var/www/farm-system
git pull origin main

# 2. Pull Docker images ใหม่
docker compose pull

# 3. Rebuild และ restart
docker compose up -d --build

# 4. Run migrations ถ้ามี
docker compose exec backend php artisan migrate

# 5. Clear cache
docker compose exec backend php artisan cache:clear
docker compose exec backend php artisan config:clear
```

### Health Check Commands

```bash
# เช็ค health ของ container ทั้งหมด
docker compose ps

# เช็คว่า backend ทำงานได้
curl http://localhost:18000/api/health

# เช็คว่า web admin ทำงานได้
curl http://localhost:18080

# เช็คว่า mariadb ทำงานได้
docker compose exec mariadb mariadb-admin ping -h localhost -u root -p
```

---

## 💾 Backup & Restore Database

### การสำรองข้อมูล (Backup)

#### วิธีที่ 1: ใช้ Docker Exec

```bash
# Backup ทั้ง database
docker compose exec mariadb sh -c 'exec mysqldump -u$fARM_USER -p$fARM_PASSWORD $FARM_DATABASE' > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup พร้อม compress
docker compose exec mariadb sh -c 'exec mysqldump -u$fARM_USER -p$fARM_PASSWORD $FARM_DATABASE' | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

#### วิธีที่ 2: ใช้ Script อัตโนมัติ

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/farm-system"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# สร้างโฟลเดอร์ backup
mkdir -p $BACKUP_DIR

# Backup database
docker compose exec -T mariadb sh -c "exec mysqldump -u\$FARM_USER -p\$FARM_PASSWORD \$FARM_DATABASE" > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# ลบ backup เก่ากว่า 7 วัน
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

```bash
# กำหนดสิทธิ์ให้รันได้
chmod +x backup.sh

# เพิ่ม cron job สำหรับ backup ทุกวัน
crontab -e

# เพิ่มบรรทัดนี้ (backup ทุกวันเวลา 02:00)
0 2 * * * /var/www/farm-system/backup.sh >> /var/log/farm-backup.log 2>&1
```

#### วิธีที่ 3: Backup ด้วย mysqldump (Manual)

```bash
mysqldump -h 127.0.0.1 -u farm_user -p farm_system > backup.sql
```

### การกู้คืนข้อมูล (Restore)

#### วิธีที่ 1: ใช้ Docker Exec

```bash
# Restore จากไฟล์ backup
cat backup_20240101_120000.sql | docker compose exec -T mariadb sh -c 'exec mysql -u$fARM_USER -p$fARM_PASSWORD $FARM_DATABASE'

# Restore จากไฟล์ compressed
gunzip -c backup_20240101_120000.sql.gz | docker compose exec -T mariadb sh -c 'exec mysql -u$fARM_USER -p$fARM_PASSWORD $FARM_DATABASE'
```

#### วิธีที่ 2: Restore แบบ Manual

```bash
mysql -h 127.0.0.1 -u farm_user -p farm_system < backup.sql
```

### การกู้คืนข้อมูลทั้งระบบ (Full Restore)

> ⚠️ **คำเตือน:** การกู้คืนแบบนี้จะลบข้อมูลปัจจุบันทั้งหมด

```bash
# 1. หยุด services
docker compose down

# 2. ลบ volumes เดิม
docker compose down -v

# 3. สร้าง volumes ใหม่
docker compose up -d

# 4. รอให้ database พร้อม
sleep 30

# 5. Restore database
cat backup_20240101_120000.sql | docker compose exec -T mariadb sh -c 'exec mysql -u$fARM_USER -p$fARM_PASSWORD $FARM_DATABASE'

# 6. Restart services
docker compose restart
```

### การตรวจสอบความสมบูรณ์ของ Backup

```bash
# ตรวจสอบว่าไฟล์ backup ไม่เสียหาย
gunzip -t backup_20240101_120000.sql.gz

# ดูขนาดไฟล์ backup
ls -lh backup_20240101_120000.sql.gz

# ตรวจสอบจำนวน tables
gunzip -c backup_20240101_120000.sql.gz | grep "CREATE TABLE" | wc -l

# ตรวจสอบจำนวน records
gunzip -c backup_20240101_120000.sql.gz | grep "INSERT INTO" | wc -l
```

---

## 📊 Monitoring & Logging

### การตรวจสอบ Resource Usage

```bash
# ดู resource usage ของ containers
docker stats

# ดูเฉพาะ container ที่ต้องการ
docker stats farm-backend farm-mariadb
```

### Log Rotation สำหรับ Docker

สร้างไฟล์ `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
# Restart Docker
sudo systemctl restart docker
```

---

## 🆘 Emergency Recovery

### ถ้า Server ล่ม

```bash
# 1. SSH เข้า server ใหม่
ssh user@new-server

# 2. ติดตั้ง Docker
curl -fsSL https://get.docker.com | sh

# 3. Clone โปรเจกต์
git clone https://github.com/your-org/farm-system.git
cd farm-system

# 4. Copy ไฟล์ .env จาก backup
scp user@old-server:/var/www/farm-system/.env .env

# 5. Restore database backup
gunzip -c backup_latest.sql.gz | docker compose exec -T mariadb sh -c 'exec mysql -u$fARM_USER -p$fARM_PASSWORD $FARM_DATABASE'

# 6. Start services
docker compose up -d
```

### ถ้า Database มีปัญหา

```bash
# ดู logs ของ mariadb
docker compose logs mariadb

# ซ่อม database
docker compose exec mariadb sh -c 'mysqlcheck -u$fARM_USER -p$fARM_PASSWORD --repair $FARM_DATABASE'

# Optimize database
docker compose exec mariadb sh -c 'mysqlcheck -u$fARM_USER -p$fARM_PASSWORD --optimize $FARM_DATABASE'
```

---

## 📞 ติดต่อสอบถาม

หากพบปัญหาในการ Deploy กรุณาติดต่อทีมพัฒนา:

- **อีเมล:** dev@nisk.co.th
- **GitHub Issues:** https://github.com/your-org/farm-system/issues
- **Slack:** #farm-system-support

---

_เอกสารนี้จัดทำโดย NiSK Dev Team © 2024_
