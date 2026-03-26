# Farm Tracking System - LINE LIFF Frontend

React LINE LIFF app สำหรับระบบติดตามและบันทึกกิจกรรมในไร่/สวน

## Features

### Core Features
- ✅ **LIFF Login** - เข้าสู่ระบบด้วย LINE
- ✅ **QR Scan** - สแกน QR Code เพื่อระบุต้นไม้/แปลง
- ✅ **Quick Actions** - รดน้ำ, ใส่ปุ๋ย, ตัดแต่ง, ตรวจสอบ, เก็บเกี่ยว, แจ้งปัญหา
- ✅ **Task View** - ดูงานที่ได้รับมอบหมาย
- ✅ **Task Quick-Complete** - ทำเครื่องหมายงานว่าเสร็จจาก LIFF
- ✅ **Problem Report** - แจ้งปัญหาพร้อมรูปภาพ
- ✅ **Offline Support** - บันทึกออฟไลน์แล้ว sync เมื่อกลับมาออนไลน์

### LIFF UX Optimizations
- `max_steps: 2` - ลดขั้นตอนให้น้อยที่สุด
- `minimal_input: true` - ใช้ปุ่มแทนฟอร์มยาว
- `default_values: enabled` - เติมค่าเริ่มต้นอัตโนมัติ
- Lightweight CSS - โหลดเร็ว
- Lazy load - ไม่โหลดทุกอย่างพร้อมกัน

## Tech Stack

- **React 18** (Vite)
- **@line/liff-sdk** - LINE LIFF SDK
- **Axios** - HTTP client
- **Minimal CSS** - Performance priority

## Setup

### 1. Install dependencies

```bash
cd liff-app
npm install
```

### 2. Configure Environment

สร้างไฟล์ `.env`:

```env
VITE_LIFF_ID=your-liff-id-here
VITE_API_BASE=https://your-api-domain.com/api
```

### 3. Development

```bash
npm run dev
```

เปิด browser ที่ `http://localhost:3000`

> **หมายเหตุ:** LIFF จะทำงานได้เต็มประสิทธิภาพเมื่อรันใน LINE App เท่านั้น

### 4. Production Build

```bash
npm run build
```

Output จะอยู่ใน `dist/`

## LINE LIFF Setup

### สร้าง LIFF App

1. ไปที่ [LINE Developers Console](https://developers.line.biz/)
2. สร้าง Provider (หรือเลือก existing)
3. สร้าง Channel > LINE Login
4. ไปที่ tab **LIFF**
5. กด **Add**
6. กรอกข้อมูล:
   - **Name:** Farm Tracking
   - **Size:** Tall (หรือ Compact)
   - **Endpoint URL:** URL ของ app ที่ deploy แล้ว
   - **LIFF features:** 
     - ✅ Bot link (ถ้าต้องการ open chat)
     - ✅ Scan with QR code

7. กด **Add** - จะได้ LIFF ID (格式: `xxxxxxxx-xxxxxxxx`)

### Configure LIFF Settings

ใน LIFF settings:

```json
{
  "max_steps": 2,
  "minimal_input": true,
  "default_values": {
    "context": true
  },
  "permanent_link_pattern": "^/scan"
}
```

### QR Code Format

QR Code ควรมี format:

```
/scan/{type}/{id}
```

ตัวอย่าง:
- `/scan/plant/M-001`
- `/scan/plot/P-101`

## API Endpoints

### GET /targets/{type}/{id}
```json
{
  "id": "M-001",
  "name": "มะม่วงโชกุน",
  "type": "plant",
  "location": "แปลง A-1",
  "status": "active"
}
```

### GET /targets/{type}/{id}/activities
```json
{
  "data": [
    {
      "id": 1,
      "action_type": "water",
      "action_display": "รดน้ำ",
      "user_name": "สมชาย",
      "notes": "ดินแห้งมาก",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST /activities
```json
{
  "target_type": "plant",
  "target_id": "M-001",
  "action_type": "water",
  "notes": "รดน้ำเต็มที่"
}
```

### GET /tasks?user_id={userId}
```json
{
  "data": [
    {
      "id": "task-1",
      "title": "รดน้ำต้นมะม่วง",
      "target_type": "plant",
      "target_id": "M-001",
      "location": "แปลง A-1",
      "status": "pending",
      "due_date": "2024-01-15"
    }
  ]
}
```

### PATCH /tasks/{id}/complete
```json
{
  "status": "completed"
}
```

### POST /problems
```
Content-Type: multipart/form-data

target_type: plant
target_id: M-001
problem_type: pest
severity: high
description: พบตัวเต็มวัยบนใบ
photo: [file]
```

## Offline Behavior

เมื่ออุปกรณ์อยู่ในโหมดออฟไลน์:

1. Banner แสดง "ไม่มีการเชื่อมต่ออินเทอร์เน็ต"
2. ข้อมูลที่ submit จะถูกเก็บใน localStorage queue
3. เมื่อกลับมาออนไลน์ ระบบจะ sync อัตโนมัติ
4. แสดงจำนวนรายการที่รอ sync

## Project Structure

```
liff-app/
├── public/
├── src/
│   ├── components/
│   │   ├── ActionButton.jsx
│   │   ├── ActivityItem.jsx
│   │   ├── Header.jsx
│   │   ├── Loading.jsx
│   │   └── PhotoUpload.jsx
│   ├── hooks/
│   │   ├── useLiff.js
│   │   └── useOffline.js
│   ├── pages/
│   │   ├── ActionForm.jsx
│   │   ├── LoginPage.jsx
│   │   ├── ProblemReport.jsx
│   │   ├── ScanPage.jsx
│   │   ├── SuccessPage.jsx
│   │   └── TaskList.jsx
│   ├── services/
│   │   └── api.js
│   ├── styles/
│   │   └── index.css
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Deployment

### Vercel

```bash
npm install -g vercel
vercel --prod
```

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### GitHub Pages

ใช้ `base: './'` ใน vite.config.js และ deploy จาก `dist/`

## Troubleshooting

### LIFF ไม่ทำงาน
- ตรวจสอบ LIFF ID ใน `.env`
- ตรวจสอบ Endpoint URL ตรงกับที่ deploy
- ทดสอบใน LINE App (ไม่ใช่ browser)

### ไม่สามารถ login
- ตรวจสอบว่า Channel มี LINE Login enabled
- ตรวจสอบ privacy URL (ถ้ามี)

### API ไม่ทำงาน
- ตรวจสอบ CORS settings ของ API
- ตรวจสอบ API Base URL ใน `.env`

## License

MIT
