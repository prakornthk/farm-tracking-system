# Farm Tracking System - ระบบติดตามฟาร์ม

## ภาพรวมโครงการ

**Farm Tracking System** เป็นระบบจัดการฟาร์มแบบครบวงจร พัฒนาด้วย Laravel (Backend) และ React (Frontend) ออกแบบมาเพื่อช่วยให้ผู้ประกอบการฟาร์มสามารถติดตามและจัดการข้อมูลกิจกรรมในฟาร์มได้อย่างมีประสิทธิภาพ

---

## Quick Links

- [API Documentation](./docs/API.md) - เอกสาร API ฉบับเต็ม
- [Backend README](./backend/README.md) - รายละเอียด Backend
- [Docker Setup](#docker-setup) - การตั้งค่า Docker

---

## Features (คุณสมบัติ)

### จัดการโครงสร้างฟาร์ม
- **ฟาร์ม (Farms)** - สร้างและจัดการฟาร์มหลายแห่ง
- **โซน (Zones)** - แบ่งพื้นที่ฟาร์มเป็นโซนต่างๆ
- **แปลง (Plots)** - จัดการแปลงปลูกภายในโซน
- **ต้นไม้ (Plants)** - บันทึกข้อมูลต้นไม้/พืชแต่ละต้น

### กิจกรรมและงาน
- **กิจกรรม (Activities)** - บันทึกกิจกรรมต่างๆ เช่น รดน้ำ ใส่ปุ๋ย ฉีดยา เก็บเกี่ยว
- **งาน (Tasks)** - มอบหมายและติดตามงานให้ผู้ใช้
- **รายงานปัญหา (Problem Reports)** - รายงานและติดตามปัญหาที่พบ

### Dashboard และ Metrics
- **Dashboard Metrics** - ดูภาพรวมสถิติฟาร์ม
- **Today Stats** - สถิติประจำวัน
- **รายงานการเก็บเกี่ยว** - บันทึกผลผลิตและมูลค่า

### LINE Notify Integration
- **แจ้งเตือนทาง LINE** - ส่งการแจ้งเตือนเมื่อมีงานใหม่หรือปัญหาใหม่
- **การตั้งค่า Token** - เชื่อมต่อกับ LINE Notify

### QR Code System
- **สร้าง QR Code** - สำหรับแปลงและต้นไม้
- **Scan QR** - ค้นหาข้อมูลด้วย QR Code

---

## Tech Stack

### Backend
- **Framework:** Laravel 10.x
- **Language:** PHP 8.2+
- **Authentication:** Laravel Sanctum
- **Database:** MariaDB / MySQL
- **QR Code:** SimpleSoftwareIO/QrCode

### Frontend
- **Web Admin:** React + Vite
- **Mobile:** React (LIFF App)
- **Package Manager:** npm

### Infrastructure
- **Container:** Docker + Docker Compose
- **Web Server:** Nginx
- **Reverse Proxy:** Nginx (main)

---

## โครงสร้างโปรเจกต์

```
farm-tracking-system/
├── docker-compose.yml          # Docker Compose configuration
├── .env.example               # ตัวอย่าง Environment variables
├── README.md                  # เอกสารหลัก
├── docs/
│   └── API.md                # เอกสาร API
├── backend/
│   ├── app/                  # Laravel Application
│   ├── routes/               # API Routes
│   ├── database/             # Migrations & Seeders
│   ├── tests/                # Unit Tests
│   └── Dockerfile
├── web-admin/
│   ├── src/                  # React Source
│   └── Dockerfile
├── liff-app/
│   ├── src/                  # React LIFF Source
│   └── Dockerfile
└── nginx/
    ├── nginx.conf
    └── conf.d/
```

---

## Docker Setup

### 1. คัดลอก Environment File

```bash
cp .env.example .env
# แก้ไขค่าต่างๆ ใน .env
```

### 2. Build และ Run

```bash
docker-compose up -d --build
```

### 3. ตรวจสอบสถานะ

```bash
docker-compose ps
docker-compose logs -f
```

### 4. เปิดใช้งาน

| Service | URL |
|---------|-----|
| Web Admin | http://admin.farm.localhost |
| LIFF App | http://liff.farm.localhost |
| API | http://api.farm.localhost |

### 5. เพิ่ม Hosts

เพิ่มใน `/etc/hosts`:
```
127.0.0.1 api.farm.localhost admin.farm.localhost liff.farm.localhost
```

### 6. Stop

```bash
docker-compose down
```

---

## Development

### Backend (Laravel)

```bash
cd backend

# Install dependencies
composer install

# Run migrations
php artisan migrate

# Seed database
php artisan db:seed

# Run tests
php artisan test
```

### Frontend (React)

```bash
cd web-admin

# Install dependencies
npm install

# Run development server
npm run dev
```

---

## API Endpoints Summary

| Category | Endpoints |
|----------|-----------|
| **Auth** | login, register, logout, me, refresh |
| **Farms** | CRUD, metrics, users |
| **Zones** | CRUD (nested under farms) |
| **Plots** | CRUD (nested under zones) |
| **Plants** | CRUD, find-by-qr |
| **Activities** | CRUD, batch, by-target |
| **Tasks** | CRUD, my-tasks, assignment-status |
| **Problem Reports** | CRUD |
| **Dashboard** | metrics, today-stats |
| **QR** | plot, plant, as-image, scan |
| **LINE Notify** | send, authorize, revoke |

ดูรายละเอียดเต็มได้ที่ [API Documentation](./docs/API.md)

---

## Contributing

1. สร้าง Branch ใหม่จาก `develop`
2. ทำการเปลี่ยนแปลงและเขียน Tests
3. สร้าง Pull Request
4. รอการ Review จากทีม

---

## License

MIT License - ดูรายละเอียดในไฟล์ LICENSE

---

## Contact

**NiSK Dev Team**

*เอกสารนี้สร้างโดย NiSK Dev Team*
