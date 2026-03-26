# Farm Tracking System - Backend API

ระบบติดตามและจัดการฟาร์มอัจฉริยะ สำหรับการเกษตร

## Tech Stack

- **Framework:** Laravel 10.x
- **Authentication:** Laravel Sanctum + LINE Login
- **Database:** MariaDB/MySQL compatible
- **QR Code:** simplesoftwareio/simple-qrcode

## Installation

```bash
# Clone repository
git clone <repo-url>
cd farm-system/backend

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate

# Seed demo data (optional)
php artisan db:seed

# Start development server
php artisan serve
```

## Configuration

### Environment Variables

```env
APP_NAME="Farm Tracking System"
APP_ENV=local
APP_KEY=
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=farm_system
DB_USERNAME=root
DB_PASSWORD=

# LINE Login
LINE_CLIENT_ID=your_line_channel_id
LINE_CLIENT_SECRET=your_line_channel_secret
LINE_REDIRECT_URI=http://localhost/api/auth/line/callback

# LINE Notify
LINE_NOTIFY_CLIENT_ID=your_line_notify_client_id
LINE_NOTIFY_CLIENT_SECRET=your_line_notify_client_secret
```

## Authentication

### LINE Login

```
POST /api/auth/line/callback
Content-Type: application/json

{
    "code": "authorization_code_from_line"
}
```

### LINE Login with Access Token

```
POST /api/auth/line/login
Content-Type: application/json

{
    "access_token": "line_access_token"
}
```

### Get Current User

```
GET /api/auth/me
Authorization: Bearer {token}
```

### Logout

```
POST /api/auth/logout
Authorization: Bearer {token}
```

## API Endpoints

### Base URL
```
http://localhost/api
```

### Health Check

```
GET /api/health
```

### Dashboard

```
# Get dashboard metrics
GET /api/dashboard/metrics
Authorization: Bearer {token}
Query Parameters:
  - farm_id (optional): Filter by specific farm
  - start_date (optional): Start date for metrics (default: start of month)
  - end_date (optional): End date for metrics (default: end of month)

# Get today's stats
GET /api/dashboard/today
Authorization: Bearer {token}
```

### Farms

```
# List all farms
GET /api/farms
Authorization: Bearer {token}
Query Parameters:
  - is_active (optional): Filter by active status
  - search (optional): Search by name/description
  - per_page (optional): Items per page (default: 15)

# Create farm
POST /api/farms
Authorization: Bearer {token}
Body: { name, description?, location?, latitude?, longitude?, is_active?, owner_id? }

# Get farm details
GET /api/farms/{id}
Authorization: Bearer {token}

# Update farm
PUT /api/farms/{id}
Authorization: Bearer {token}
Body: { name?, description?, location?, latitude?, longitude?, is_active? }

# Delete farm
DELETE /api/farms/{id}
Authorization: Bearer {token}

# Get farm with all relations
GET /api/farms/{id}/with-relations
Authorization: Bearer {token}

# Get farm metrics
GET /api/farms/{id}/metrics
Authorization: Bearer {token}

# Get farm users
GET /api/farms/{id}/users
Authorization: Bearer {token}
```

### Zones (Nested under Farm)

```
# List zones in a farm
GET /api/farms/{farmId}/zones
Authorization: Bearer {token}

# Create zone
POST /api/farms/{farmId}/zones
Authorization: Bearer {token}
Body: { name, description?, sort_order?, is_active? }

# Get zone details
GET /api/zones/{id}
Authorization: Bearer {token}

# Update zone
PUT /api/zones/{id}
Authorization: Bearer {token}

# Delete zone
DELETE /api/zones/{id}
Authorization: Bearer {token}
```

### Plots (Nested under Zone)

```
# List plots in a zone
GET /api/zones/{zoneId}/plots
Authorization: Bearer {token}
Query Parameters:
  - status (optional): Filter by status (empty, planted, growing, harvesting, fallow)
  - is_active (optional): Filter by active status
  - search (optional): Search by name/description

# Create plot
POST /api/zones/{zoneId}/plots
Authorization: Bearer {token}
Body: { name, description?, size?, size_unit?, status?, sort_order?, is_active? }

# Get plot details
GET /api/plots/{id}
Authorization: Bearer {token}

# Update plot
PUT /api/plots/{id}
Authorization: Bearer {token}

# Delete plot
DELETE /api/plots/{id}
Authorization: Bearer {token}
```

### Plants (Nested under Plot)

```
# List plants in a plot
GET /api/plots/{plotId}/plants
Authorization: Bearer {token}
Query Parameters:
  - status (optional): Filter by status
  - search (optional): Search by name/variety

# Create plant
POST /api/plots/{plotId}/plants
Authorization: Bearer {token}
Body: { name, variety?, planted_date?, expected_harvest_date?, status?, quantity?, notes? }

# Get plant details
GET /api/plots/{plotId}/plants/{plantId}
Authorization: Bearer {token}

# Alternative direct access
GET /api/plants/{id}
Authorization: Bearer {token}

# Update plant
PUT /api/plants/{id}
Authorization: Bearer {token}

# Delete plant
DELETE /api/plants/{id}
Authorization: Bearer {token}

# Find plant by QR code
POST /api/plants/find-by-qr
Authorization: Bearer {token}
Body: { qr_code: string }
```

### Activities

```
# List all activities
GET /api/activities
Authorization: Bearer {token}
Query Parameters:
  - farm_id (optional): Filter by farm
  - type (optional): Filter by activity type
  - start_date (optional): Start date
  - end_date (optional): End date
  - user_id (optional): Filter by user
  - per_page (optional): Items per page

# Create single activity
POST /api/activities
Authorization: Bearer {token}
Body: {
  farm_id?,
  activitable_type: "App\Models\Plot" | "App\Models\Plant",
  activitable_id: number,
  type: "watering" | "fertilizing" | "pesticide" | "weeding" | "pruning" | "harvesting" | "inspection" | "planting" | "soil_preparation" | "other",
  description?,
  quantity?,
  quantity_unit?,
  yield_amount?,
  yield_unit?,
  yield_price_per_unit?,
  metadata?,
  activity_date?
}

# Create batch activities (multi-target)
POST /api/activities/batch
Authorization: Bearer {token}
Body: {
  activities: [
    { activitable_type, activitable_id, type, ... },
    { activitable_type, activitable_id, type, ... }
  ]
}

# Get activity details
GET /api/activities/{id}
Authorization: Bearer {token}

# Get activities for a specific plot
GET /api/plots/{plotId}/activities
Authorization: Bearer {token}

# Get activities for a specific plant
GET /api/plants/{plantId}/activities
Authorization: Bearer {token}
```

### Tasks

```
# List all tasks
GET /api/tasks
Authorization: Bearer {token}
Query Parameters:
  - farm_id (optional): Filter by farm
  - status (optional): Filter by status
  - priority (optional): Filter by priority
  - type (optional): Filter by type
  - assigned_to (optional): Filter by assigned user
  - overdue (optional): Show only overdue tasks

# Create task
POST /api/tasks
Authorization: Bearer {token}
Body: {
  farm_id,
  title,
  description?,
  type?,
  priority?,
  due_date?,
  plot_id?,
  zone_id?,
  assigned_users?: [user_id, ...],
  metadata?
}

# Get my tasks
GET /api/tasks/my
Authorization: Bearer {token}

# Get task details
GET /api/tasks/{id}
Authorization: Bearer {token}

# Update task
PUT /api/tasks/{id}
Authorization: Bearer {token}

# Delete task
DELETE /api/tasks/{id}
Authorization: Bearer {token}

# Update task assignment status
PUT /api/tasks/{taskId}/assignment-status
Authorization: Bearer {token}
Body: { user_id, status: "accepted" | "rejected" | "completed", notes? }
```

### Problem Reports

```
# List all problem reports
GET /api/problem-reports
Authorization: Bearer {token}
Query Parameters:
  - farm_id (optional): Filter by farm
  - severity (optional): Filter by severity
  - status (optional): Filter by status

# Create problem report
POST /api/problem-reports
Authorization: Bearer {token}
Body: {
  farm_id,
  plot_id?,
  plant_id?,
  severity?,
  title,
  description,
  symptoms?,
  suspected_cause?,
  image_url?,
  metadata?
}

# Get problem report details
GET /api/problem-reports/{id}
Authorization: Bearer {token}

# Update problem report
PUT /api/problem-reports/{id}
Authorization: Bearer {token}

# Delete problem report
DELETE /api/problem-reports/{id}
Authorization: Bearer {token}

# Get farm's problem reports
GET /api/farms/{farmId}/problem-reports
Authorization: Bearer {token}
```

### QR Codes

```
# Generate QR code for plot
GET /api/qr/plot/{id}
Authorization: Bearer {token}

# Generate QR code for plant
GET /api/qr/plant/{id}
Authorization: Bearer {token}

# Generate QR code as image (base64)
GET /api/qr/as-image
Authorization: Bearer {token}
Query Parameters:
  - type: "plot" | "plant"
  - id: number
  - size (optional): QR code size (default: 300)
  - margin (optional): QR code margin (default: 10)

# Scan QR code
POST /api/qr/scan
Body: { qr_data: string }
```

### LINE Notify

```
# Send notification
POST /api/line-notify/send
Authorization: Bearer {token}
Body: { message: string, token: string }

# Send notification with image
POST /api/line-notify/send-with-image
Authorization: Bearer {token}
Body: { message: string, image_url?, token: string }

# Send task notification
POST /api/line-notify/send-task
Authorization: Bearer {token}
Body: { task_id, action: "created" | "assigned" | "completed" | "overdue", token: string }

# Send problem notification
POST /api/line-notify/send-problem
Authorization: Bearer {token}
Body: { problem_id, action: "reported" | "resolved", token: string }
```

## Entity Relationships

```
User (users)
  ├── farms (many-to-many with role)
  ├── activities (one-to-many)
  ├── tasks created (one-to-many)
  ├── task assignments (one-to-many)
  └── problem reports (one-to-many)

Farm (farms)
  ├── users (many-to-many with role)
  ├── zones (one-to-many)
  ├── activities (one-to-many)
  ├── tasks (one-to-many)
  └── problem reports (one-to-many)

Zone (zones)
  ├── farm (belongs-to)
  ├── plots (one-to-many)
  └── tasks (one-to-many)

Plot (plots)
  ├── zone (belongs-to)
  ├── plants (one-to-many)
  └── activities (morph-one)
       └── [Plot | Plant] (polymorphic)

Plant (plants)
  ├── plot (belongs-to)
  ├── activities (morph-one)
  └── problem reports (one-to-many)
       └── [Plot | Plant] (polymorphic)

Activity (activities)
  ├── user (belongs-to)
  ├── farm (belongs-to)
  └── activitable (morphs-to: Plot|Plant)

Task (tasks)
  ├── farm (belongs-to)
  ├── creator (belongs-to User)
  ├── zone (belongs-to)
  ├── plot (belongs-to)
  └── assignments (has-many)
       └── User (belongs-to-many)

ProblemReport (problem_reports)
  ├── farm (belongs-to)
  ├── reporter (belongs-to User)
  ├── plot (belongs-to)
  └── plant (belongs-to)
```

## Activity Types

| Type | Description |
|------|-------------|
| watering | รดน้ำ |
| fertilizing | ใส่ปุ๋ย |
| pesticide | พ่นยาฆ่าแมลง |
| weeding | ถอนวัชพืช |
| pruning | ตัดแต่ง |
| harvesting | เก็บเกี่ยว |
| inspection | ตรวจสอบ |
| planting | ปลูก |
| soil_preparation | เตรียมดิน |
| other | อื่นๆ |

## Yield Tracking

For harvest activities, yield data is recorded directly:

```json
{
  "type": "harvesting",
  "yield_amount": 25,
  "yield_unit": "kg",
  "yield_price_per_unit": 30,
  "yield_total_value": 750
}
```

## Task Priorities

| Priority | Description |
|----------|-------------|
| low | ต่ำ |
| medium | ปานกลาง |
| high | สูง |
| urgent | เร่งด่วน |

## Problem Report Severities

| Severity | Description |
|----------|-------------|
| low | ต่ำ |
| medium | ปานกลาง |
| high | สูง |
| critical | วิกฤติ |

## User Roles

| Role | Description |
|------|-------------|
| super_admin | ผู้ดูแลระบบสูงสุด |
| owner | เจ้าของฟาร์ม |
| manager | ผู้จัดการฟาร์ม |
| worker | พนักงาน |

## QR Code Structure

### Plot QR
```json
{
  "type": "plot",
  "farm_id": 1,
  "zone_id": 1,
  "plot_id": 1
}
```

### Plant QR
```json
{
  "type": "plant",
  "farm_id": 1,
  "zone_id": 1,
  "plot_id": 1,
  "plant_id": 1
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Retrieved successfully",
  "data": [...],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 75
  },
  "links": {
    "first": "...",
    "last": "...",
    "prev": null,
    "next": "..."
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": { ... }
}
```

## Middleware

- `auth:sanctum` - Requires valid Sanctum token
- `role:owner,manager` - Requires specific roles

## Demo Data

After running `php artisan db:seed`, you can use:

| User | Email | Password |
|------|-------|----------|
| Super Admin | admin@farm.local | password |
| Owner | owner@farm.local | password |
| Manager | manager@farm.local | password |
| Worker 1 | worker1@farm.local | password |
| Worker 2 | worker2@farm.local | password |

## License

MIT
