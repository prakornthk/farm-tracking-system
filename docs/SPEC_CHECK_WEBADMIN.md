# Web Admin Spec Check

## ภาพรวม

ตรวจสอบ Implementation ของ Web Admin (`web-admin/`) เทียบกับ Farm Tracking System Spec

---

## ✅ Complete: สิ่งที่ครบถ้วนแล้ว

### Pages — ทุกหน้าครบตาม spec
- [x] **login** — `Login.jsx` รองรับ username/password login
- [x] **dashboard** — `Dashboard.jsx` แสดง summary cards
- [x] **farms CRUD** — `Farms.jsx` มี create/read/update/delete ครบ
- [x] **zones CRUD** — `Zones.jsx` มี create/read/update/delete ครบ
- [x] **plots CRUD** — `Plots.jsx` มี create/read/update/delete ครบ
- [x] **plants CRUD** — `Plants.jsx` มี create/read/update/delete ครบ
- [x] **tasks board** — `Tasks.jsx` แสดง list + filter by status/user
- [x] **problem reports** — `Problems.jsx` มี create/read/update/delete ครบ
- [x] **users management** — `Users.jsx` มี create/read/update/delete ครบ
- [x] **QR download/print** — `PlotQR.jsx` มี download PNG + print dialog

### Role Permissions — Routing Level (ProtectedRoute)
| Role | Pages ที่เข้าถึงได้ | Status |
|------|---------------------|--------|
| owner | ทุกหน้า ( farms/zones/plots/plants/tasks/problems/users ) | ✅ |
| manager | farms, zones, plots, plants, tasks, problems | ✅ |
| worker | tasks, problems, plots/qr | ✅ |

- `/farms/**` → owner, manager ✅
- `/zones/**` → owner, manager ✅
- `/plots/**` → owner, manager ✅
- `/plants/**` → owner, manager ✅
- `/tasks` → ทุก role ✅
- `/problems` → ทุก role ✅
- `/users` → owner only ✅
- `/plots/:id/qr` → owner, manager, worker ✅

### Dashboard บางส่วน
- [x] today_tasks (pending_tasks)
- [x] completed_tasks_today
- [x] overdue_tasks (alert แสดง)

### Auth Flow
- [x] Login/Logout ครบ
- [x] Token stored in localStorage
- [x] 401 redirect to login
- [x] ProtectedRoute กัน unauthorized access

---

## ❌ Missing: สิ่งที่ยังขาดหายไป

### Dashboard Metrics — ขาด 3 รายการจาก 7
| Metric | Status | หมายเหตุ |
|--------|--------|-----------|
| total_plants | ❌ | ไม่มีใน `todayStats()` API |
| plant_status_breakdown | ❌ | ไม่มี (healthy/warning/sick/dead breakdown) |
| total_plots | ❌ | ไม่มี |
| today_tasks / completed_tasks_today | ✅ | มีแล้ว |
| total_yield | ❌ | ไม่มี API endpoint และไม่แสดงใน UI |
| yield_by_plot | ❌ | ไม่มี |

### Role: worker — ขาด permission ตาม spec
| Permission | Spec | Implementation | Status |
|------------|------|----------------|--------|
| scan_qr | ต้องมี | ไม่มี scanner — มีแค่ view QR | ❌ |
| log_activity | ต้องมี | ไม่มี UI สำหรับ log กิจกรรมประจำวัน | ❌ |
| view_tasks | ✅ | มี Tasks.jsx | ✅ |
| report_problem | ⚠️ | มี แต่ create ได้อย่างเดียว — edit/delete ไม่ได้ | ⚠️ |

### Role: manager — ขาด permission ตาม spec
| Permission | Spec | Implementation | Status |
|------------|------|----------------|--------|
| manage_farm_scope | ✅ | CRUD ครบ | ✅ |
| view_dashboard | ✅ | มี | ✅ |
| assign_tasks | ⚠️ | มี dropdown เลือก assignee แต่ไม่มี UI "การมอบหมาย" ที่ชัดเจน | ⚠️ |

---

## ⚠️ Issues: ปัญหาที่พบ

### 1. Worker สร้างงานได้ — เกินสิทธิ์
- `Tasks.jsx` ใช้ `isManager()` ในการซ่อนปุ่ม create/edit/delete
- แต่ `/tasks` route ไม่ได้ restrict สำหรับ worker — worker เข้าถึงได้
- Worker ไม่ควรสร้างงาน ควรเป็น view only (ตาม spec: `scan_qr, log_activity, view_tasks, report_problem`)
- **Fix:** เปลี่ยน `isManager()` เป็น `isOwner()` หรือเพิ่ม route guard สำหรับ `/tasks` ให้ owner/manager only

### 2. Manager มอบหมายงานได้ไม่ชัดเจน
- Form มี dropdown เลือก assignee แต่เป็น single-select
- spec บอก `assign_tasks` สำหรับ manager — แต่ UI ไม่ชัดเจนว่ากำลัง "มอบหมาย"
- **Fix:** เพิ่ม action button "มอบหมาย" ที่ชัดเจน หรือ modal assign

### 3. Worker แก้ไข/ลบปัญหาได้
- `Problems.jsx` ใช้ `isManager()` ซ่อน edit/delete — worker เห็นแค่ view
- แต่ spec ไม่ได้บอกว่า worker ต้อง edit/delete problem — อาจจะตั้งใจให้ worker แค่ create
- **Note:** นี่อาจเป็น design ที่ถูกต้อง แต่ spec ไม่ชัดเจนเรื่อง problem edit/delete

### 4. QR Scanner — ไม่มี
- spec บอก `scan_qr` สำหรับ worker
- มี QR display/view แต่ไม่มี scanner (กล้องสแกน)
- LIFF app อาจมี scanner อยู่แล้ว — แต่ web admin ไม่มี

### 5. Activity Log — ไม่มี
- spec บอก `log_activity` สำหรับ worker
- ไม่มี UI หน้าไหนสำหรับ log กิจกรรมประจำวัน
- `tasksAPI.list()` อาจใช้แทน แต่ไม่ตรง spec

### 6. Dashboard Metrics ไม่ครบ
- Backend API `todayStats()` ไม่ return `total_plants`, `total_plots`, `total_yield`, `yield_by_plot`
- ต้องเพิ่ม endpoint หรือ expand `todayStats()` ให้ครบ
- `Dashboard.jsx` call `dashboardAPI.todayStats()` แต่ response ไม่ match spec

### 7. `dashboardAPI.metrics()` — ไม่ได้ใช้
- มี `dashboardAPI.metrics()` ใน `api.js` แต่ `Dashboard.jsx` ใช้แค่ `todayStats()`
- อาจเป็น备用 endpoint ที่ยังไม่ implement

---

## Summary

| Category | Total | ✅ Pass | ❌ Fail | ⚠️ Partial |
|----------|-------|--------|---------|------------|
| Pages | 10 | 10 | 0 | 0 |
| Dashboard Metrics | 7 | 2 | 3 | 2 (overdue + open_problems แทนที่บางตัว) |
| Role: owner | 4 permissions | 4 | 0 | 0 |
| Role: manager | 3 permissions | 2 | 0 | 1 (assign_tasks) |
| Role: worker | 4 permissions | 2 | 2 (scan_qr, log_activity) | 0 |

**Overall Completion: ~75%** — หน้า UI ครบเกือบหมด แต่ metrics และ worker permissions ยังขาด
