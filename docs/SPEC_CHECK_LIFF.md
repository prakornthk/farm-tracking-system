# LIFF App Spec Check

> วันที่: 2026-03-26
> ตรวจสอบโดย: Circuit (Code Review Specialist)
> Project: farm-system/liff-app

---

## Original Spec

```yaml
platforms: line_liff
field_app:
  type: line_liff
  interaction_model: scan_based

LIFF_FLOW:
  - scan_qr
  - identify_target (plant | plot)
  - show_quick_actions
  - select_action
  - submit_activity

quick_actions:
  - watering
  - fertilizing
  - spraying
  - problem_report

ux_rules:
  - max_steps: 2
  - minimal_input: true
  - default_values: enabled

features:
  - task view for workers
  - problem report with photo
  - offline support
  - LINE login (built-in)
```

---

## ✅ Complete:

- **LIFF Flow (scan → identify → actions → submit):** ขั้นตอนครบ flow ตาม spec
  - `scan_qr` → `App.jsx` line 196-203 (`liff.scanCode()`)
  - `identify_target` → `ScanPage.jsx` รองรับ `plant` และ `plot`
  - `show_quick_actions` → `ScanPage.jsx` line 99-106 (action grid)
  - `select_action` / `submit_activity` → `ActionForm.jsx`

- **LINE Login:** `useLiff.js` รองรับ LIFF SDK เต็มรูปแบบ
  - `login()`, `logout()`, `getProfile()`, `isLoggedIn()`, `scanCode()`

- **Task View สำหรับ Worker:** `TaskList.jsx`
  - `getTasks(userId)` → แสดงงานที่ได้รับมอบหมาย
  - `completeTask(taskId)` → ทำเครื่องหมายงานเสร็จ

- **Problem Report with Photo:** `ProblemReport.jsx` + `PhotoUpload.jsx`
  - ประเภทปัญหา: pest, disease, water, soil, weather, other
  - ระดับความรุนแรง: low, medium, high
  - รองรับอัพโหลดรูป (File API, max 5MB)

- **Offline Support:** `useOffline.js` + `api.js` (Offline Queue)
  - เก็บข้อมูลใน localStorage + IndexedDB (สำหรับ photo blobs)
  - Auto-sync เมื่อกลับมาออนไลน์
  - `syncOfflineQueue()` ส่งข้อมูลที่ค้างอยู่

- **UX Rules:**
  - `max_steps: 2` ✅ — Scan → Action (2 ขั้นตอน)
  - `minimal_input: true` ✅ — notes ไม่บังคับ, photo ไม่บังคับ
  - `default_values: enabled` ✅ — severity ค่าเริ่มต้น `medium`

---

## ❌ Missing:

| Feature | Status | Note |
|---------|--------|------|
| `spraying` (พ่นยา) | ❌ ไม่มี | มี prune, inspect, harvest แทน (ไม่อยู่ใน spec) |

---

## ⚠️ Issues:

1. **Quick Actions ไม่ตรง Spec:**
   - Spec กำหนด: `watering`, `fertilizing`, `spraying`, `problem_report`
   - Implementation มี: `water`, `fertilize`, `prune`, `inspect`, `harvest`, `report`
   - **Action ที่ขาด:** `spraying` (พ่นยา)
   - **Action ที่เกิน (ไม่อยู่ใน spec):** `prune`, `inspect`, `harvest`

2. **รายละเอียด Action Config (`ActionButton.jsx` line 2-8):**
   ```javascript
   const ACTION_CONFIG = {
     water:     { icon: '💧', label: 'รดน้ำ',       color: '#3b82f6' },
     fertilize: { icon: '🌿', label: 'ใส่ปุ๋ย',      color: '#22c55e' },
     prune:     { icon: '✂️', label: 'ตัดแต่ง',      color: '#8b5cf6' },  // ไม่อยู่ใน spec
     inspect:   { icon: '🔍', label: 'ตรวจสอบ',     color: '#f59e0b' },  // ไม่อยู่ใน spec
     harvest:   { icon: '🍎', label: 'เก็บเกี่ยว',   color: '#ef4444' },  // ไม่อยู่ใน spec
     report:    { icon: '⚠️', label: 'แจ้งปัญหา',   color: '#ef4444' }
   }
   ```

---

## Summary

| Category | Status |
|----------|--------|
| LIFF Flow | ✅ ครบ |
| LINE Login | ✅ ครบ |
| Task View | ✅ ครบ |
| Problem Report + Photo | ✅ ครบ |
| Offline Support | ✅ ครบ |
| UX Rules | ✅ ครบ |
| Quick Actions | ⚠️ ไม่ตรง spec (ขาด `spraying`, มี action เกิน 3 รายการ) |

**คำแนะนำ:** ควรเพิ่ม `spraying` action และพิจารณาว่า `prune`, `inspect`, `harvest` เป็น requirement ใหม่หรือไม่ หากไม่ใช่ควร remove ออกเพื่อให้ตรง spec
