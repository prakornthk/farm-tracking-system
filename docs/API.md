# Farm Tracking System - API Documentation
## เอกสาร API สำหรับระบบติดตามฟาร์ม

**เวอร์ชัน:** 1.0.0  
**ภาษา:** ภาษาไทย / English  
**ผู้ดูแล:** NiSK Dev Team  

---

## สารบัญ

- [Overview](#overview)
- [Authentication](#authentication)
- [Farms](#farms)
- [Zones](#zones)
- [Plots](#plots)
- [Plants](#plants)
- [Activities](#activities)
- [Tasks](#tasks)
- [Problem Reports](#problem-reports)
- [Dashboard](#dashboard)
- [QR Code](#qr-code)
- [LINE Notify](#line-notify)
- [Common Error Codes](#common-error-codes)

---

## Overview

### Base URL

```
Production: https://api.farm.localhost
Development: http://api.farm.localhost
```

### Authentication

ระบบใช้ **Laravel Sanctum** สำหรับ Authentication  
Token-based authentication ผ่าน Bearer Token

**Header ที่จำเป็น:**
```
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

### Response Format

**Response สำเร็จ:**
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

**Response แบบ Paginated:**
```json
{
  "success": true,
  "message": "Success message",
  "data": [...],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 75
  }
}
```

**Response ผิดพลาด:**
```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

---

## Authentication

### POST /api/auth/login

**คำอธิบาย:** เข้าสู่ระบบด้วย Username/Email และ Password

**Authentication:** ไม่ต้องการ

**Request Body:**
```json
{
  "username": "string (required) - Email หรือ Username",
  "password": "string (required)"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "สมชาย ใจดี",
      "email": "somchai@example.com",
      "role": "owner",
      "created_at": "2024-01-15T10:30:00Z"
    },
    "token": "1|abc123...",
    "token_type": "Bearer"
  }
}
```

**Error Codes:**
- `401` - Invalid credentials

---

### POST /api/auth/register

**คำอธิบาย:** ลงทะเบียนผู้ใช้ใหม่ (สำหรับ Demo/Seeding - ควรจำกัดการเข้าถึงใน Production)

**Authentication:** ไม่ต้องการ

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required, unique)",
  "password": "string (required, min: 8)",
  "password_confirmation": "string (required)",
  "role": "string (optional) - owner|manager|worker (default: worker)"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": 2,
      "name": "สมหญิง รักสวย",
      "email": "somying@example.com",
      "role": "worker",
      "created_at": "2024-01-15T11:00:00Z"
    },
    "token": "2|xyz789...",
    "token_type": "Bearer"
  }
}
```

**Error Codes:**
- `422` - Validation error

---

### POST /api/auth/logout

**คำอธิบาย:** ออกจากระบบ (ลบ Token ปัจจุบัน)

**Authentication:** ต้องการ

**Request Body:** ไม่ต้องการ

**Response 200:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET /api/auth/me

**คำอธิบาย:** ดึงข้อมูลผู้ใช้ปัจจุบัน

**Authentication:** ต้องการ

**Response 200:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": 1,
    "name": "สมชาย ใจดี",
    "email": "somchai@example.com",
    "role": "owner",
    "farms": [
      {
        "id": 1,
        "name": "ฟาร์มสวนผลไม้",
        "pivot": { "role": "owner" }
      }
    ],
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### POST /api/auth/refresh

**คำอธิบาย:** รีเฟรช Token ใหม่

**Authentication:** ต้องการ

**Response 200:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "user": { ... },
    "token": "3|newtoken...",
    "token_type": "Bearer"
  }
}
```

---

## Farms

### GET /api/farms

**คำอธิบาย:** ดึงรายการฟาร์มทั้งหมดที่ผู้ใช้มีสิทธิ์เข้าถึง

**Authentication:** ต้องการ

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | int | หมายเลขหน้า |
| per_page | int | จำนวนรายการต่อหน้า (default: 15) |
| search | string | ค้นหาตามชื่อ |
| is_active | boolean | กรองตามสถานะ active |

**Response 200:**
```json
{
  "success": true,
  "message": "Farms retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "ฟาร์มสวนผลไม้",
      "description": "ฟาร์มปลูกผลไม้อินทรีย์",
      "location": "จ.เชียงใหม่",
      "latitude": "18.788277",
      "longitude": "98.985400",
      "is_active": true,
      "zones_count": 5,
      "plots_count": 20,
      "plants_count": 150,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": { "current_page": 1, "last_page": 1, "per_page": 15, "total": 1 }
}
```

---

### POST /api/farms

**คำอธิบาย:** สร้างฟาร์มใหม่

**Authentication:** ต้องการ (Owner/Manager เท่านั้น)

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "location": "string (optional)",
  "latitude": "decimal (optional)",
  "longitude": "decimal (optional)",
  "is_active": "boolean (optional, default: true)"
}
```

**Example Request:**
```bash
curl -X POST http://api.farm.localhost/api/farms \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "ฟาร์มสวนผลไม้ใหม่", "description": "ฟาร์มทดสอบ", "location": "จ.เชียงราย"}'
```

**Response 201:**
```json
{
  "success": true,
  "message": "Farm created successfully",
  "data": {
    "id": 2,
    "name": "ฟาร์มสวนผลไม้ใหม่",
    "description": "ฟาร์มทดสอบ",
    "location": "จ.เชียงราย",
    "is_active": true,
    "created_at": "2024-01-16T09:00:00Z"
  }
}
```

**Error Codes:**
- `403` - Forbidden (ไม่มีสิทธิ์)
- `422` - Validation error

---

### GET /api/farms/{id}

**คำอธิบาย:** ดึงข้อมูลฟาร์มตาม ID

**Authentication:** ต้องการ

**Response 200:**
```json
{
  "success": true,
  "message": "Farm retrieved successfully",
  "data": {
    "id": 1,
    "name": "ฟาร์มสวนผลไม้",
    "description": "ฟาร์มปลูกผลไม้อินทรีย์",
    "location": "จ.เชียงใหม่",
    "latitude": "18.788277",
    "longitude": "98.985400",
    "is_active": true,
    "zones": [{ "id": 1, "name": "โซน A", "plots_count": 5 }],
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Codes:**
- `403` - Forbidden (ไม่มีสิทธิ์เข้าถึงฟาร์มนี้)
- `404` - Farm not found

---

### PUT /api/farms/{id}

**คำอธิบาย:** อัพเดทข้อมูลฟาร์ม

**Authentication:** ต้องการ (Owner/Manager เท่านั้น)

**Request Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "location": "string (optional)",
  "latitude": "decimal (optional)",
  "longitude": "decimal (optional)",
  "is_active": "boolean (optional)"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Farm updated successfully",
  "data": { ... }
}
```

**Error Codes:**
- `403` - Forbidden
- `404` - Farm not found
- `422` - Validation error

---

### DELETE /api/farms/{id}

**คำอธิบาย:** ลบฟาร์ม (Soft Delete)

**Authentication:** ต้องการ (Owner เท่านั้น)

**Response 200:**
```json
{
  "success": true,
  "message": "Farm deleted successfully"
}
```

**Error Codes:**
- `403` - Forbidden
- `404` - Farm not found

---

### GET /api/farms/{id}/metrics

**คำอธิบาย:** ดึงข้อมูล Metrics ของฟาร์มสำหรับ Dashboard

**Authentication:** ต้องการ

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| start_date | date | วันที่เริ่มต้น (default: วันแรกของเดือน) |
| end_date | date | วันที่สิ้นสุด (default: วันสุดท้ายของเดือน) |

**Response 200:**
```json
{
  "success": true,
  "message": "Farm metrics retrieved successfully",
  "data": {
    "farm": { "id": 1, "name": "ฟาร์มสวนผลไม้" },
    "structures": { "zones": 5, "plots": 20, "plants": 150 },
    "activities": {
      "total": 45,
      "by_type": { "watering": 15, "fertilizing": 10, "harvesting": 5 }
    },
    "harvest": { "count": 5, "total_yield": 150.5, "total_value": 15000.00 },
    "problems": { "open": 2, "resolved": 8 },
    "tasks": { "pending": 10, "completed": 25 },
    "period": { "start_date": "2024-01-01", "end_date": "2024-01-31" }
  }
}
```

---

### GET /api/farms/{id}/users

**คำอธิบาย:** ดึงรายชื่อผู้ใช้ที่เกี่ยวข้องกับฟาร์ม

**Authentication:** ต้องการ

**Response 200:**
```json
{
  "success": true,
  "message": "Farm users retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "สมชาย ใจดี",
      "email": "somchai@example.com",
      "role": "owner",
      "pivot": { "role": "owner", "created_at": "2024-01-15T10:30:00Z" }
    },
    {
      "id": 2,
      "name": "สมหญิง รักสวย",
      "email": "somying@example.com",
      "role": "manager",
      "pivot": { "role": "manager", "created_at": "2024-01-16T08:00:00Z" }
    }
  ]
}
```

---

## Zones

### GET /api/farms/{farmId}/zones

**คำอธิบาย:** ดึงรายการโซนทั้งหมดในฟาร์ม

**Authentication:** ต้องการ

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | int | หมายเลขหน้า |
| per_page | int | จำนวนรายการต่อหน้า |
| search | string | ค้นหาตามชื่อ |
| is_active | boolean | กรองตามสถานะ active |

**Response 200:**
```json
{
  "success": true,
  "message": "Zones retrieved successfully",
  "data": [
    {
      "id": 1,
      "farm_id": 1,
      "name": "โซน A",
      "description": "โซนปลูกมะม่วง",
      "sort_order": 1,
      "is_active": true,
      "plots_count": 5,
      "plants_count": 50,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": { ... }
}
```

---

### POST /api/farms/{farmId}/zones

**คำอธิบาย:** สร้างโซนใหม่ในฟาร์ม

**Authentication:** ต้องการ (Owner/Manager เท่านั้น)

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "sort_order": "integer (optional)",
  "is_active": "boolean (optional, default: true)"
}
```

**Example Request:**
```bash
curl -X POST http://api.farm.localhost/api/farms/1/zones \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "โซน B", "description": "โซนปลูกมังคุด", "sort_order": 2}'
```

**Response 201:**
```json
{
  "success": true,
  "message": "Zone created successfully",
  "data": {
    "id": 2,
    "farm_id": 1,
    "name": "โซน B",
    "description": "โซนปลูกมังคุด",
    "sort_order": 2,
    "is_active": true,
    "created_at": "2024-01-16T09:00:00Z"
  }
}
```

**Error Codes:**
- `403` - Forbidden
- `404` - Farm not found
- `422` - Validation error

---

### GET /api/zones/{id}

**คำอธิบาย:** ดึงข้อมูลโซนตาม ID

**Authentication:** ต้องการ

**Response 200:**
```json
{
  "success": true,
  "message": "Zone retrieved successfully",
  "data": {
    "id": 1,
    "farm_id": 1,
    "name": "โซน A",
    "description": "โซนปลูกมะม่วง",
    "sort_order": 1,
    "is_active": true,
    "farm": { "id": 1, "name": "ฟาร์มสวนผลไม้" },
    "plots": [{ "id": 1, "name": "แปลง 1", "size": 100.5, "size_unit": "ตร.ม." }],
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Codes:**
- `403` - Forbidden
- `404` - Zone not found

---

### PUT /api/zones/{id}

**คำอธิบาย:** อัพเดทข้อมูลโซน

**Authentication:** ต้องการ (Owner/Manager เท่านั้น)

**Request Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "sort_order": "integer (optional)",
  "is_active": "boolean (optional)"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Zone updated successfully",
  "data": { ... }
}
```

**Error Codes:**
- `403` - Forbidden
- `404` - Zone not found
- `422` - Validation error

---

### DELETE /api/zones/{id}

**คำอธิบาย:** ลบโซน (Soft Delete)

**Authentication:** ต้องการ (Owner/Manager เท่านั้น)

**Response 200:**
```json
{
  "success": true,
  "message": "Zone deleted successfully"
}
```

**Error Codes:**
- `403` - Forbidden
- `404` - Zone not found

---

## Plots

### GET /api/zones/{zoneId}/plots

**คำอธิบาย:** ดึงรายการแปลงทั้งหมดในโซน

**Authentication:** ต้องการ

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | int | หมายเลขหน้า |
| per_page | int | จำนวนรายการต่อหน้า |
| search | string | ค้นหาตามชื่อ |
| status | string | กรองตามสถานะ |
| is_active | boolean | กรองตามสถานะ active |

**Response 200:**
```json
{
  "success": true,
  "message": "Plots retrieved successfully",
  "data": [
    {
      "id": 1,
      "zone_id": 1,
      "name": "แปลง 1",
      "description": "แปลงปลูกมะม่วงอกร่อง",
      "size": 100.5,
      "size_unit": "ตร.ม.",
      "status": "active",
      "sort_order": 1,
      "is_active": true,
      "plants_count": 25,
      "qr_code": "qr/plot_1_1705312200.svg",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": { ... }
}
```

---

### POST /api/zones/{zoneId}/plots

**คำอธิบาย:** สร้างแปลงใหม่ในโซน

**Authentication:** ต้องการ

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "size": "decimal (optional)",
  "size_unit": "string (optional, default: ตร.ม.)",
  "status": "string (optional)",
  "sort_order": "integer (optional)",
  "is_active": "boolean (optional, default: true)"
}
```

**Example Request:**
```bash
curl -X POST http://api.farm.localhost/api/zones/1/plots \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "แปลง 2", "description": "แปลงปลูกทุเรียน", "size": 150, "size_unit": "ตร.ม."}'
```

**Response 201:**
```json
{
  "success": true,
  "message": "Plot created successfully",
  "data": {
    "id": 2,
    "zone_id": 1,
    "name": "แปลง 2",
    "description": "แปลงปลูกทุเรียน",
    "size": 150.00,
    "size_unit": "ตร.ม.",
    "status": "active",
    "sort_order": 1,
    "is_active": true,
    "created_at": "2024-01-16T09:00:00Z"
  }
}
```

**Error Codes:**
- `403` - Forbidden
- `404` - Zone not found
- `422` - Validation error

---

### GET /api/plots/{id}

**คำอธิบาย:** ดึงข้อมูลแปลงตาม ID

**Authentication:** ต้องการ

**Response 200:**
```json
{
  "success": true,
  "message": "Plot retrieved successfully",
  "data": {
    "id": 1,
    "zone_id": 1,
    "name": "แปลง 1",
    "description": "แปลงปลูกมะม่วงอกร่อง",
    "size": 100.5,
    "size_unit": "ตร.ม.",
    "status": "active",
    "is_active": true,
    "zone": { "id": 1, "name": "โซน A" },
    "farm": { "id": 1, "name": "ฟาร์มสวนผลไม้" },
    "plants": [{ "id": 1, "name": "ต้นที่ 1", "variety": "มะม่วงอกร่อง" }],
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Codes:**
- `403` - Forbidden
- `404` - Plot not found

---

### PUT /api/plots/{id}

**คำอธิบาย:** อัพเดทข้อมูลแปลง

**Authentication:** ต้องการ

**Request Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "size": "decimal (optional)",
  "size_unit": "string (optional)",
  "status": "string (optional)",
  "sort_order": "integer (optional)",
  "is_active": "boolean (optional)"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Plot updated successfully",
  "data": { ... }
}
```

**Error Codes:**
- `403` - Forbidden
- `404` - Plot not found
- `422` - Validation error

---

### DELETE /api/plots/{id}

**คำอธิบาย:** ลบแปลง (Soft Delete)

**Authentication:** ต้องการ

**Response 200:**
```json
{
  "success": true,
  "message": "Plot deleted successfully"
}
```

**Error Codes:**
- `403` - Forbidden
- `404` - Plot not found

---

## Plants

### GET /api/plots/{plotId}/plants

**คำอธิบาย:** ดึงรายการต้นไม้ทั้งหมดในแปลง

**Authentication:** ต้องการ

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | int | หมายเลขหน้า |
| per_page | int | จำนวนรายการต่อหน้า |
| search | string | ค้นหาตามชื่อ |
| status | string | กรองตามสถานะ |

**Response 200:**
```json
{
  "success": true,
  "message": "Plants retrieved successfully",
  "data": [
    {
      "id": 1,
      "plot_id": 1,
      "name": "ต้นที่ 1",
      "variety": "มะม่วงอกร่อง",
      "planted_date": "2024-01-01",
      "expected_harvest_date": "2024-06-01",
      "status": "growing",
      "quantity": 1,
      "days_since_planted": 45,
      "days_until_harvest": 105,
      "qr_code": "qr/plant_1_1705312200.svg",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": { ... }
}
```

---

### POST /api/plots/{plotId}/plants

**คำอธิบาย:** สร้างต้นไม้ใหม่ในแปลง

**Authentication:** ต้องการ

**Request Body:**
```json
{
  "name": "string (required)",
  "variety": "string (optional)",
  "planted_date": "date (optional, format: Y-m-d)",
  "expected_harvest_date": "date (optional, format: Y-m-d)",
  "status": "string (optional)",
  "quantity": "integer (optional, default: 1)",
  "notes": "string (optional)"
}
```

**Example Request:**
```bash
curl -X POST http://api.farm.localhost/api/plots/1/plants \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "ต้นที่ 5", "variety": "มะม่วงแม่จัน", "planted_date": "2024-02-01", "expected_harvest_date": "2024-07-01"}'
```

**Response 201:**
```json
{
  "success": true,
  "message": "Plant created successfully",
  "data": {
    "id": 5,
    "plot_id": 1,
    "name": "ต้นที่ 5",
    "variety": "มะม่วงแม่จัน",
    "planted_date": "2024-02-01",
    "expected_harvest_date": "2024-07-01",
    "status": "growing",
    "quantity": 1,
    "created_at": "2024-02-01T10:00:00Z"
  }
}
```

**Error Codes:**
- `403` - Forbidden
- `404` - Plot not found
- `422` - Validation error

---

### GET /api/plants/{id}

**คำอธิบาย:** ดึงข้อมูลต้นไม้ตาม ID

**Authentication:** ต้องการ

**Response 200:**
```json
{
  "success": true,
  "message": "Plant retrieved successfully",
  "data": {
    "id": 1,
    "plot_id": 1,
    "name": "ต้นที่ 1",
    "variety": "มะม่วงอกร่อง",
    "planted_date": "2024-01-01",
    "expected_harvest_date": "2024-06-01",
    "status": "growing",
    "quantity": 1,
    "notes": "ต้นไม้สุกเต็มที่",
    "days_since_planted": 45,
    "days_until_harvest": 105,
    "plot": { "id": 1, "name": "แปลง 1" },
    "zone": { "id": 1, "name": "โซน A" },
    "farm": { "id": 1, "name": "ฟาร์มสวนผลไม้" },
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Codes:**
- `403` - Forbidden
- `404` - Plant not found

---

### PUT /api/plants/{id}

**คำอธิบาย:** อัพเดทข้อมูลต้นไม้

**Authentication:** ต้องการ

**Request Body:**
```json
{
  "name": "string (optional)",
  "variety": "string (optional)",
  "planted_date": "date (optional)",
  "expected_harvest_date": "date (optional)",
  "status": "string (optional)",
  "quantity": "integer (optional)",
  "notes": "string (optional)"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Plant updated successfully",
  "data": { ... }
}
```

**Error Codes:**
- `403` - Forbidden
- `404` - Plant not found
- `422` - Validation error

---

### DELETE /api/plants/{id}

**คำอธิบาย:** ลบต้นไม้ (Soft Delete)

**Authentication:** ต้องการ

**Response 200:**
```json
{
  "success": true,
  "message": "Plant deleted successfully"
}
```

**Error Codes:**
- `403` - Forbidden
- `404` - Plant not found

---

### GET /api/plants/find-by-qr

**คำอธิบาย:** ค้นหาต้นไม้ด้วย QR Code

**Authentication:** ต้องการ

**Request Body:**
```json
{
  "qr_code": "string (required) - ข้อมูล QR code"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Plant found successfully",
  "data": {
    "id": 1,
    "plot_id": 1,
    "name": "ต้นที่ 1",
    "variety": "มะม่วงอกร่อง",
    "planted_date": "2024-01-01",
    "expected_harvest_date": "2024-06-01",
    "status": "growing",
    "plot": { "id": 1, "name": "แปลง 1" },
    "zone": { "id": 1, "name": "โซน A" },
    "farm": { "id": 1, "name": "ฟาร์มสวนผลไม้" }
  }
}
```

**Error Codes:**
- `404` - Plant not found

---

## Activities

### GET /api/activities

**คำอธิบาย:** ดึงรายการกิจกรรมทั้งหมด

**Authentication:** ต้องการ

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | int | หมายเลขหน้า |
| per_page | int | จำนวนรายการต่อหน้า |
| farm_id | int | กรองตามฟาร์ม |
| type | string | กรองตามประเภท |
| start_date | date | วันที่เริ่มต้น |
| end_date | date | วันที่สิ้นสุด |

**Activity Types:**
- `watering` - รดน้ำ
- `fertilizing` - ใส่ปุ๋ย
- `pesticide` - ฉีดยาฆ่าแมลง
- `weeding` - กำจัดวัชพืช
- `pruning` - ตัดแต่ง
- `harvesting` - เก็บเกี่ยว
- `inspection` - ตรวจสอบ
- `planting` - ปลูก
- `soil_preparation` - เตรียมดิน
- `other` - อื่นๆ

**Response 200:**
```json
{
  "success": true,
  "message": "Activities retrieved successfully",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "farm_id": 1,
      "activitable_type": "App\\Models\\Plant",
      "activitable_id": 1,
      "type": "watering",
      "description": "รดน้ำต้นมะม่วง",
