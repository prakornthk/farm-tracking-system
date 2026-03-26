# Farm Admin - Web Dashboard

ระบบจัดการฟาร์มอัจฉริยะ (React Web Admin)

## Tech Stack

- **React 18** + Vite
- **React Router v6** - Routing
- **TailwindCSS** - Styling
- **Axios** - HTTP client
- **Lucide React** - Icons
- **QRCode.react** - QR code generation

## Project Structure

```
src/
├── components/        # Shared components
│   ├── Layout.jsx         # Main layout with sidebar
│   ├── ProtectedRoute.jsx  # Route guard
│   └── Shared.jsx         # Reusable UI (Loading, Error, Empty, Modal)
├── context/
│   └── AuthContext.jsx    # Auth state & LINE login
├── hooks/
│   └── useApi.js          # Generic API fetching hook
├── pages/
│   ├── Login.jsx          # /login - LINE OAuth login
│   ├── Dashboard.jsx      # /dashboard - metrics & charts
│   ├── Farms.jsx          # /farms - farm management
│   ├── Zones.jsx          # /farms/:id/zones - zone CRUD
│   ├── Plots.jsx          # /zones/:id/plots - plot CRUD
│   ├── Plants.jsx         # /plots/:id/plants - plant CRUD
│   ├── PlotQR.jsx         # /plots/:id/qr - QR download/print
│   ├── Tasks.jsx          # /tasks - task board
│   ├── Problems.jsx       # /problems - problem reports
│   └── Users.jsx          # /users - user management (owner only)
├── services/
│   └── api.js             # Axios instance & API endpoints
├── App.jsx                # Routes setup
└── main.jsx               # Entry point
```

## Setup

### 1. ติดตั้ง dependencies

```bash
cd farm-system/web-admin
npm install
```

### 2. สร้างไฟล์ `.env`

```bash
VITE_LINE_CLIENT_ID=your-line-channel-id
```

### 3. รัน development server

```bash
npm run dev
```

เปิด http://localhost:3000

### 4. Backend

Backend API ต้องรันที่ `http://localhost:8000/api`

```bash
# จาก Laravel project
php artisan serve
```

## API Endpoints

API ที่คาดหวังจาก Laravel backend:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/line | LINE OAuth login |
| GET | /api/auth/profile | Get current user |
| POST | /api/auth/logout | Logout |
| GET | /api/dashboard/stats | Dashboard metrics |
| GET/POST/PUT/DELETE | /api/farms | Farm CRUD |
| GET/POST/PUT/DELETE | /api/farms/:id/zones | Zone CRUD |
| GET/POST/PUT/DELETE | /api/zones/:id/plots | Plot CRUD |
| GET/POST/PUT/DELETE | /api/plots/:id/plants | Plant CRUD |
| GET | /api/plots/:id/plants/qr | QR data |
| GET/POST/PUT/DELETE | /api/tasks | Task CRUD |
| POST | /api/tasks/:id/complete | Mark complete |
| GET/POST/PUT/DELETE | /api/problems | Problem CRUD |
| GET/POST/PUT/DELETE | /api/users | User CRUD (owner) |

## Role-Based Access

| Route | Owner | Manager | Worker |
|-------|-------|---------|--------|
| /dashboard | ✅ | ✅ | ✅ |
| /farms | ✅ | ✅ | ❌ |
| /farms/:id/zones | ✅ | ✅ | ❌ |
| /zones/:id/plots | ✅ | ✅ | ❌ |
| /plots/:id/plants | ✅ | ✅ | ❌ |
| /plots/:id/qr | ✅ | ✅ | ✅ |
| /tasks | ✅ | ✅ | ✅ |
| /problems | ✅ | ✅ | ✅ |
| /users | ✅ | ❌ | ❌ |

## Build for Production

```bash
npm run build
# output: dist/
```

Serve ด้วย any static server หรือ Laravel's public folder.
