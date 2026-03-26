# Backend Spec Check - Farm Tracking System

**วันที่:** 2026-03-26  
**ผู้ตรวจสอบ:** Circuit (Code Review Specialist)  
**Backend Path:** `/farm-system/backend`

---

## ✅ Complete (ตรงตาม Spec)

### Entities
- ✅ **Farm** - id, name (มี extra fields: description, location, latitude, longitude, qr_code, is_active)
- ✅ **Zone** - id, farm_id, name (มี extra fields: description, qr_code, sort_order, is_active)
- ✅ **Plant** - มี CRUD ครบ มี polymorphic relationship สำหรับ activities
- ✅ **Plot** - มี CRUD ครบ มี polymorphic relationship สำหรับ activities

### API Modules
- ✅ **auth** - login, register, me, logout, refresh (username/password ผ่าน Sanctum)
- ✅ **farm_management** - CRUD + withRelations + metrics + users
- ✅ **plant_management** - CRUD + findByQrCode
- ✅ **plot_management** - CRUD (nested ภายใต้ zone)
- ✅ **activity_logging** - CRUD + batch + byTarget
- ✅ **task_management** - CRUD + myTasks + assignmentStatus
- ✅ **problem_reporting** - CRUD + byFarm
- ✅ **dashboard** - metrics + todayStats
- ✅ **notification (LINE Notify)** - send, sendWithImage, sendTaskNotification, sendProblemNotification, authorize, revoke
- ✅ **qr_generation** - `/qr/plot/{id}`, `/qr/plant/{id}`, `/qr/as-image`, `/qr/scan`

### MVP Features
- ✅ farm_zone_plot_structure
- ✅ plant_crud
- ✅ plot_crud
- ✅ qr_generation
- ✅ scan_liff (endpoint `/qr/scan`)
- ✅ activity_logging
- ✅ basic_dashboard

### Database
- ✅ MariaDB stack (ตาม spec)
- ✅ Laravel backend (ตาม spec)
- ✅ SoftDeletes บนทุก entity
- ✅ Proper indexes สำหรับ query performance
- ✅ Polymorphic relationships สำหรับ activity_targets

---

## ❌ Missing (ขาดหายไป)

### Entities Fields
1. **Plot** - ขาด `code` field (spec กำหนด แต่ไม่มี)
2. **Plot** - ขาด `crop_type` field
3. **Plot** - ขาด `total_plants` field
4. **Plot** - ขาด `area` field (มี `size` แต่ไม่ตรงกับ spec)
5. **Plot** - ขาด `image_url` field
6. **Plot** - ขาด `note` field (มี `description` แต่ไม่ตรงกับ spec)
7. **Plant** - ขาด `code` field
8. **Plant** - ขาด `species` field
9. **Plant** - ขาด `latest_image_url` field

### Activity System
1. ขาด `image_url` field ใน activity (spec กำหนด)
2. `problem_report` ไม่ใช่ activity type (เป็น separate entity แล้ว - อาจจะ OK)

### API Modules
1. **reporting** - ไม่มี dedicated reporting module/controller (มีแค่ใน dashboard)

### Task System
1. ขาด `scheduled_date` field ใน task (มี `due_date` แต่ไม่ตรงชื่อ spec)
2. ขาด dedicated task_type enum สำหรับ task (spec: watering, fertilizing, spraying, harvesting, inspection)

---

## ⚠️ Mismatches (ไม่ตรงตาม Spec)

### Plant Status Enum
| Spec | Implementation |
|------|----------------|
| normal | seedling |
| problem | vegetative |
| dead | flowering |
| harvested | fruiting |
| | harvested |
| | dead |
| | removed |

**ปัญหา:** Spec กำหนด `normal, problem, dead, harvested` แต่ implementation ใช้ `seedling, vegetative, flowering, fruiting, harvested, dead, removed`

### Plot Status Enum
| Spec | Implementation |
|------|----------------|
| active | empty |
| inactive | planted |
| harvested | growing |
| | harvesting |
| | fallow |

**ปัญหา:** Spec กำหนด `active, inactive, harvested` แต่ implementation ใช้ `empty, planted, growing, harvesting, fallow`

### Activity Types
| Spec | Implementation |
|------|----------------|
| watering | watering ✅ |
| fertilizing | fertilizing ✅ |
| spraying | pesticide (คล้ายกัน) |
| pruning | pruning ✅ |
| harvesting | harvesting ✅ |
| replanting | planting (คล้ายกัน) |
| inspection | inspection ✅ |
| problem_report | ❌ (เป็น separate entity แล้ว) |

**ปัญหา:** `spraying` เป็น `pesticide`, `replanting` เป็น `planting`, `problem_report` ไม่มีใน activity types

### Activity Fields
| Spec Field | Implementation Field |
|------------|---------------------|
| performed_at | activity_date |
| performed_by | user_id |
| note | description |
| image_url | ❌ (ไม่มี) |
| unit | quantity_unit |

### Task Status
| Spec | Implementation |
|------|----------------|
| pending | pending ✅ |
| in_progress | in_progress ✅ |
| completed | completed ✅ |

**Note:** Implementation มี extra `cancelled` status

### Task Assignment
| Spec | Implementation |
|------|----------------|
| task_id | task_id ✅ |
| assigned_to | user_id ✅ |

**Note:** Implementation มี extra fields: status, notes, assigned_at, accepted_at, completed_at

### Problem Report
| Spec Field | Implementation |
|------------|----------------|
| target_type | ❌ (ใช้ plot_id, plant_id แทน) |
| target_id | ❌ (ใช้ plot_id, plant_id แทน) |
| problem_type | ❌ (ใช้ severity + description + symptoms แทน) |
| reported_by | reporter_id |
| reported_at | created_at |
| note | description |
| image_url | image_url ✅ |

**ปัญหา:** ไม่มี `problem_type` field (spec: disease, pest, dead), ไม่มี polymorphic `target_type/target_id`

### Problem Type Enum (Missing)
**Spec กำหนด:** disease, pest, dead  
**Implementation:** ไม่มี problem_type enum - ใช้ severity (low, medium, high, critical) + description/symptoms แทน

---

## 📊 Summary

| Category | Status |
|----------|--------|
| Structure (farm-zone-plot-plant) | ✅ Complete |
| API Modules | 9/10 (ขาด reporting) |
| MVP Features | 7/7 Complete |
| Enums ตรง Spec | 0/4 (ทั้งหมดไม่ตรง) |
| Entity Fields ตรง Spec | ~60% |
| Activity System | 80% |

---

## 🔧 Recommendations

1. **เพิ่ม `code` field** ให้ Plot และ Plant (spec กำหนด)
2. **ปรับ Status Enums** ให้ตรงกับ spec:
   - Plant status → `normal, problem, dead, harvested`
   - Plot status → `active, inactive, harvested`
3. **เพิ่ม Reporting Module** หรือบอกว่า dashboard ครอบคลุมแล้ว
4. **เพิ่ม `problem_type` field** ใน ProblemReport (disease, pest, dead)
5. **เพิ่ม `image_url` field** ใน Activity
6. **ตั้งชื่อ field ให้ตรง spec** เช่น scheduled_date, species, crop_type, area, note

---

*หมายเหตุ: Backend implementation มีความสมบูรณ์สูง แต่มี naming/field mismatch กับ spec ที่กำหนดไว้*
