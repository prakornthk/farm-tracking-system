# Farm Tracking System - Docker Setup

## โครงสร้าง

```
farm-tracking-system/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
│       ├── backend.conf
│       ├── web-admin.conf
│       └── liff-app.conf
├── backend/
│   ├── Dockerfile
│   └── .dockerignore
├── web-admin/
│   ├── Dockerfile
│   ├── nginx.spa.conf
│   └── .dockerignore
└── liff-app/
    ├── Dockerfile
    ├── nginx.spa.conf
    └── .dockerignore
```

## การใช้งาน

### 1. คัดลอก .env

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

- **Web Admin:** http://admin.farm.localhost (เพิ่มใน /etc/hosts: `127.0.0.1 admin.farm.localhost`)
- **LIFF App:** http://liff.farm.localhost
- **API:** http://api.farm.localhost

### 5. Stop

```bash
docker-compose down
```

### 6. Rebuild

```bash
docker-compose down && docker-compose up -d --build
```

## Services

| Service    | Port | Description          |
|------------|------|----------------------|
| nginx      | 80   | Reverse Proxy        |
| backend    | 9000 | Laravel API (PHP-FPM)|
| web-admin  | -    | React SPA            |
| liff-app   | -    | React LIFF SPA       |
| mariadb    | 3306 | Database             |

## Tips

- เพิ่ม `127.0.0.1 api.farm.localhost admin.farm.localhost liff.farm.localhost` ใน `/etc/hosts`
- สำหรับ development: `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up`
