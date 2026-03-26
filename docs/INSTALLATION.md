# 📦 คู่มือการติดตั้งระบบ Farm Tracking

> ระบบติดตามและจัดการฟาร์มอัจฉริยะ — NiSK Dev Team

---

## 📋 สารบัญ

1. [ความต้องการของระบบ](#ความต้องการของระบบ)
2. [วิธีติดตั้งด้วย Docker](#วิธีติดตั้งด้วย-docker) ⭐ (แนะนำ)
3. [วิธีติดตั้งแบบ Manual](#วิธีติดตั้งแบบ-manual)
4. [การตั้งค่า .env](#การตั้งค่า-env)
5. [การติดตั้ง Dependencies](#การติดตั้ง-dependencies)
6. [การ Run Migrations](#การ-run-migrations)
7. [การ Run Seeders (ข้อมูล Demo)](#การ-run-seeders-ข้อมูล-demo)
8. [การ Build Frontend](#การ-build-frontend)

---

## 🖥️ ความต้องการของระบบ

### สำหรับ Docker (แนะนำ)

| ซอฟต์แวร์ | เวอร์ชันขั้นต่ำ |
|----------|----------------|
| Docker | 20.10+ |
| Docker Compose | 2.0+ |
| Git | 2.20+ |

### สำหรับ Manual Installation

#### Backend (Laravel)

| ซอฟต์แวร์ | เวอร์ชันขั้นต่ำ |
|----------|----------------|
| PHP | 8.2+ |
| Composer | 2.0+ |
| MariaDB หรือ MySQL | 8.0+ / 5.7+ |
| PHP Extensions | pdo, pdo_mysql, mbstring, xml, json, curl, zip |

#### Frontend (Web Admin & LIFF App)

| ซอฟต์แวร์ | เวอร์ชันขั้นต่ำ |
|----------|----------------|
| Node.js | 18.0+ |
| npm หรือ yarn | 9.0+ / 1.22+ |

#### ระบบปฏิบัติการที่รองรับ

- ✅ Ubuntu 20.04 / 22.04
- ✅ Debian 11+
- ✅ macOS (Intel & Apple Silicon)
- ✅ Windows (ผ่าน WSL2)

---

## 🐳 วิธีติดตั้งด้วย Docker ⭐

> **วิธีนี้แนะนำสำหรับทุกคน** — ติดตั้งง่าย รวดเร็ว และสะดวกในการจัดการ

### ขั้นตอนที่ 1: Clone โปรเจกต์

```bash
git clone https://github.com/your-org/farm-system.git
cd farm-system
```

### ขั้นตอนที่ 2: สร้างไฟล์ .env

```bash
cp .env.example .env
```

### ขั้นตอนที่ 3: แก้ไขไฟล์ .env

เปิดไฟล์ `.env` และกำหนดค่าต่างๆ ตามที่อธิบายใน[หัวข้อ การตั้งค่า .env](#การตั้งค่า-env)

### ขั้นตอนที่ 4: Build และ Run Docker Containers

```bash
# Build image และ run container
docker-compose up -d --build

# ดูสถานะ container
docker-compose ps

# ดู logs ทั้งหมด
docker-compose logs -f
```

### ขั้นตอนที่ 5: รอให้ Database Migrate อัตโนมัติ

Docker Compose จะ migrate database ให้อัตโนมัติ รอประมาณ 1-2 นาที

```bash
# ตรวจสอบสถานะ migration
docker-compose logs backend | grep migration
```

### ขั้นตอนที่ 6: เช็คว่าทุกอย่างทำงานได้

```bash
# เช็ค health ของ backend
curl http://localhost:18000/api/health

# เช็ค web admin
curl http://localhost:18080

# เช็ค liff app
curl http://localhost:18081
```

### ✅ ผลลัพธ์ที่คาดหวัง

| Service | URL | Status |
|---------|-----|--------|
| Backend API | http://localhost:18000 | ✅ ทำงานได้ |
| Web Admin | http://localhost:18080 | ✅ ทำงานได้ |
| LIFF App | http://localhost:18081 | ✅ ทำงานได้ |

---

## 🔧 วิธีติดตั้งแบบ Manual

> **สำหรับผู้ที่ต้องการควบคุมระบบเองโดยละเอียด**

### ส่วนที่ 1: ติดตั้ง Backend (Laravel)

#### ขั้นตอนที่ 1.1: ติดตั้ง PHP และ Extensions

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install php8.2 php8.2-cli php8.2-common php8.2-mysql php8.2-xml php8.2-mbstring php8.2-curl php8.2-zip php8.2-intl

# macOS (ด้วย Homebrew)
brew install php@8.2
```

#### ขั้นตอนที่ 1.2: ติดตั้ง Composer

```bash
# ดาวน์โหลดและติดตั้ง Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# ตรวจสอบเวอร์ชัน
composer --version
```

#### ขั้นตอนที่ 1.3: ติดตั้ง Database (MariaDB)

```bash
# Ubuntu/Debian
sudo apt install mariadb-server

# macOS
brew install mariadb
```

#### ขั้นตอนที่ 1.4: สร้าง Database

```bash
sudo mysql -u root -p

# ใน MySQL shell
CREATE DATABASE farm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'farm_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON farm_system.* TO 'farm_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### ขั้นตอนที่ 1.5: ติดตั้ง Dependencies ของ Backend

```bash
cd backend
composer install
```

#### ขั้นตอนที่ 1.6: ตั้งค่า .env

```bash
cp .env.example .env
php artisan key:generate
```

แก้ไขไฟล์ `.env` ตามที่อธิบายใน[หัวข้อ การตั้งค่า .env](#การตั้งค่า-env)

#### ขั้นตอนที่ 1.7: Run Migrations

```bash
php artisan migrate
```

#### ขั้นตอนที่ 1.8: Run Seeders

```bash
php artisan db:seed
```

#### ขั้นตอนที่ 1.9: Start Backend Server

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

---

### ส่วนที่ 2: ติดตั้ง Web Admin (React)

#### ขั้นตอนที่ 2.1: ติดตั้ง Node.js

```bash
# Ubuntu/Debian (ด้วย NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs

# macOS
brew install node@18
```

#### ขั้นตอนที่ 2.2: ติดตั้ง Dependencies

```bash
cd web-admin
npm install
```

#### ขั้นตอนที่ 2.3: สร้างไฟล์ .env

```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env` โดยกำหนดค่า:

```env
VITE_LINE_CLIENT_ID=your_line_client_id
VITE_LINE_REDIRECT_URI=http://localhost:18000/api/auth/line/callback
```

#### ขั้นตอนที่ 2.4: Build Frontend

```bash
npm run build
```

#### ขั้นตอนที่ 2.5: Start Dev Server

```bash
npm run dev
# หรือสำหรับ production
npm run preview
```

---

### ส่วนที่ 3: ติดตั้ง LIFF App (React)

#### ขั้นตอนที่ 3.1: ติดตั้ง Dependencies

```bash
cd liff-app
npm install
```

#### ขั้นตอนที่ 3.2: สร้างไฟล์ .env

```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env` โดยกำหนดค่า:

```env
VITE_LIFF_ID=your_liff_id
VITE_API_BASE=http://localhost:18000
```

#### ขั้นตอนที่ 3.3: Build Frontend

```bash
npm run build
```

#### ขั้นตอนที่ 3.4: Start Dev Server

```bash
npm run dev
```

---

## ⚙️ การตั้งค่า .env

ไฟล์ `.env` เป็นไฟล์สำคัญมากสำหรับการตั้งค่าระบบ โปรดกำหนดค่าต่างๆ อย่างถูกต้อง

### ตัวอย่างไฟล์ .env ที่สมบูรณ์

```env
# ===========================================
# Application Settings
# ===========================================
APP_NAME="Farm Tracking System"
APP_ENV=local
APP_DEBUG=true
APP_KEY=base64:YOUR_APP_KEY_HERE
APP_URL=http://localhost:18000

# ===========================================
# Database Configuration
# ===========================================
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=farm_system
DB_USERNAME=farm_user
DB_PASSWORD=your_secure_password

# ===========================================
# Docker Database Settings
# ===========================================
MARIADB_ROOT_PASSWORD=your_root_password
MARIADB_DATABASE=farm_system
MARIADB_USER=farm_user
MARIADB_PASSWORD=your_secure_password

# ===========================================
# Session & Cache
# ===========================================
SESSION_DRIVER=file
CACHE_DRIVER=file
QUEUE_CONNECTION=sync

# ===========================================
# Redis (Optional)
# ===========================================
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=null

# ===========================================
# LINE Login Settings
# ===========================================
LINE_CLIENT_ID=1234567890
LINE_CLIENT_SECRET=your_line_client_secret
LINE_REDIRECT_URI=http://localhost:18000/api/auth/line/callback

# ===========================================
# LIFF App Settings
# ===========================================
LIFF_ID=1234567890-abcdefgh

# ===========================================
# Frontend Environment
# ===========================================
VITE_LINE_CLIENT_ID=1234567890
VITE_LINE_REDIRECT_URI=http://localhost:18000/api/auth/line/callback
VITE_API_BASE=http://localhost:18000
```

### คำอธิบาย Variables สำคัญ

| Variable | คำอธิบาย | ตัวอย่าง |
|----------|---------|---------|
| `APP_KEY` | Key สำหรับเข้ารหัสข้อมูล Laravel | `base64:xxx...` |
| `APP_ENV` | สภาพแวดล้อม (local/production) | `local` หรือ `production` |
| `APP_DEBUG` | เปิด/ปิด debug mode | `true` หรือ `false` |
| `DB_HOST` | ที่อยู่ Database server | `127.0.0.1` หรือ `mariadb` |
| `LINE_CLIENT_ID` | LINE Login Channel ID | จาก LINE Developers Console |
| `LINE_CLIENT_SECRET` | LINE Login Channel Secret | จาก LINE Developers Console |

### วิธีสร้าง APP_KEY ใหม่

```bash
cd backend
php artisan key:generate
```

---

## 📚 การติดตั้ง Dependencies

### Backend Dependencies (ด้วย Composer)

```bash
cd backend

# ติดตั้ง dependencies ทั้งหมด
composer install

# หรือถ้าต้องการ update
composer update

# ตรวจสอบว่าติดตั้งสำเร็จ
composer show
```

### Frontend Dependencies (ด้วย npm)

#### Web Admin

```bash
cd web-admin

# ติดตั้ง dependencies ทั้งหมด
npm install

# หรือถ้าต้องการ update
npm update

# ตรวจสอบ dependencies
npm ls
```

#### LIFF App

```bash
cd liff-app

# ติดตั้ง dependencies ทั้งหมด
npm install

# หรือถ้าต้องการ update
npm update
```

---

## 🔄 การ Run Migrations

> Migration คือการสร้างตารางในฐานข้อมูลตามโครงสร้างที่กำหนดไว้

### คำสั่ง Migration พื้นฐาน

```bash
cd backend

# Run migrations ทั้งหมด
php artisan migrate

# Rollback migrations ล่าสุด
php artisan migrate:rollback

# Rollback และ run ใหม่ทั้งหมด (⚠️ ลบข้อมูลเดิม!)
php artisan migrate:fresh

# ดูสถานะ migrations
php artisan migrate:status
```

### การสร้าง Migration ใหม่

```bash
# สร้าง migration สำหรับตารางใหม่
php artisan make:migration create_farms_table

# สร้าง migration สำหรับเพิ่ม column
php artisan make:migration add_phone_to_farms_table --table=farms
```

### ตัวอย่างการสร้าง Migration

```php
// database/migrations/2024_01_01_000000_create_farms_table.php
public function up(): void
{
    Schema::create('farms', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->text('description')->nullable();
        $table->decimal('latitude', 10, 8)->nullable();
        $table->decimal('longitude', 11, 8)->nullable();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->timestamps();
    });
}
```

---

## 🌱 การ Run Seeders (ข้อมูล Demo)

> Seeder เป็นคำสั่งสำหรับเพิ่มข้อมูลทดสอบ (Demo Data) ลงในฐานข้อมูล

### คำสั่ง Seeder พื้นฐาน

```bash
cd backend

# Run seeders ทั้งหมด
php artisan db:seed

# หรือรันเฉพาะ Seeder ที่ต้องการ
php artisan db:seed --class=FarmSeeder
php artisan db:seed --class=UserSeeder
php artisan db:seed --class=AnimalSeeder

# Fresh migrate + seed (⚠️ ลบข้อมูลเดิม!)
php artisan migrate:fresh --seed
```

### ตัวอย่าง Seeder

```php
// database/seeders/FarmSeeder.php
public function run(): void
{
    // สร้างข้อมูลฟาร์มตัวอย่าง 5 ฟาร์ม
    Farm::factory()->count(5)->create();
    
    // หรือสร้างด้วยข้อมูลที่กำหนดเอง
    Farm::create([
        'name' => 'ฟาร์มโคนมสว่าง',
        'description' => 'ฟาร์มเลี้ยงโคนมออร์แกนิค',
        'latitude' => 13.7563,
        'longitude' => 100.5018,
    ]);
}
```

### ข้อมูล Demo ที่มีให้

| Seeder | จำนวน | คำอธิบาย |
|--------|-------|---------|
| UserSeeder | 10 users | ผู้ใช้ทดสอบ |
| FarmSeeder | 20 farms | ข้อมูลฟาร์ม |
| AnimalSeeder | 50 animals | ข้อมูลสัตว์ |
| HealthRecordSeeder | 100 records | บันทึกสุขภาพสัตว์ |

---

## 🏗️ การ Build Frontend

### Web Admin

```bash
cd web-admin

# Development build (เร็ว ไม่ optimize)
npm run build

# Production build (optimize แล้ว)
npm run build

# Preview production build
npm run preview

# Development mode (hot reload)
npm run dev
```

### LIFF App

```bash
cd liff-app

# Development build
npm run build

# Production build
npm run build

# Preview production build
npm run preview

# Development mode
npm run dev
```

### ตรวจสอบ Build Output

```bash
# Web Admin build output
ls -la web-admin/dist/

# LIFF App build output
ls -la liff-app/dist/
```

### การ Deploy Build Output

หลังจาก build แล้ว ให้ copy ไฟล์จาก `dist/` ไปยัง server หรือใช้ Docker ตามที่อธิบายใน [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## ❓ การแก้ปัญหาเบื้องต้น

### ปัญหา: Docker Container ไม่ start

```bash
# ดู logs เพื่อหาสาเหตุ
docker-compose logs

# ลบ container และ volume แล้วสร้างใหม่
docker-compose down -v
docker-compose up -d --build
```

### ปัญหา: Permission Denied

```bash
# Linux/Mac
sudo chown -R $USER:$USER .

# แก้ไข permission ของ storage
cd backend
chmod -R 775 storage bootstrap/cache
```

### ปัญหา: Database Connection Failed

```bash
# ตรวจสอบว่า MariaDB ทำงานอยู่
sudo systemctl status mariadb

# ลองเชื่อมต่อด้วยมือ
mysql -u farm_user -p farm_system
```

### ปัญหา: Node modules มีปัญหา

```bash
# ลบ node_modules และติดตั้งใหม่
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 ติดต่อสอบถาม

หากพบปัญหาในการติดตั้ง กรุณาติดต่อทีมพัฒนา:

- **อีเมล:** dev@nisk.co.th
- **GitHub Issues:** https://github.com/your-org/farm-system/issues

---

_เอกสารนี้จัดทำโดย NiSK Dev Team © 2024_
