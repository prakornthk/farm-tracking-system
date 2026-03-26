## LIFF App Final Check

> วันที่: 2026-03-26 20:23 GMT+8
> ตรวจสอบโดย: Circuit (Code Review Specialist) @ NiSK Dev Team

---

### ✅ Compliant:

1. **Quick Actions �ครบทั้ง 4 รายการตาม Spec**
   - `water` (💧 รดน้ำ) — `ActionButton.jsx` line 3
   - `fertilize` (🌿 ใส่ปุ๋ย) — `ActionButton.jsx` line 4
   - `spraying` (🔬 พ่นยา) — `ActionButton.jsx` line 8 ✅ **(เพิ่มแล้ว!)**
   - `report` (⚠️ แจ้งปัญหา) — `ActionButton.jsx` line 9

2. **Scan QR Flow ทำงานได้**
   - `liff.scanCode()` — `App.jsx` line 196-203 และ line 219-226
   - Regex parse: `(?:scan\/)?([^\/]+)\/([^\/]+)$` รองรับ `plant` และ `plot`
   - `ScanPage.jsx` แสดง target info + action grid หลังสแกน
   - Deep link route parsing: `/scan/:type/:id` ทำงานได้

3. **Offline Support ครบ**
   - `useOffline.js` — `isOnline`, `isSyncing`, `pendingCount`, `sync()`
   - Auto-sync เมื่อกลับมาออนไลน์ (event listener `online`)
   - `addToOfflineQueue()` — รองรับ `activity`, `problem`, `task_complete`
   - IndexedDB สำหรับเก็บ photo blobs (ไม่ผ่าน localStorage เพราะ File object ไม่ serialize ได้)
   - `syncOfflineQueue()` — restore photo จาก IndexedDB ก่อน POST

4. **Task View สำหรับ Worker**
   - `TaskList.jsx` — `getTasks(userId)` แสดงงานที่ได้รับมอบหมาย
   - `completeTask(taskId)` — ทำเครื่องหมายเสร็จ
   - Offline fallback: ถ้าไม่มีเน็ตแสดง mock tasks และ queue `task_complete`
   - แบ่ง pending/completed sections ชัดเจน

5. **Photo Upload สำหรับ Problem Report**
   - `PhotoUpload.jsx` — File API, `capture="environment"`, max 5MB, image/* validation
   - `ProblemReport.jsx` — แนบ photo กับ FormData (`formData.append('photo', photo)`)
   - Offline: photo ถูกเก็บใน IndexedDB ด้วย `_photoId` reference ใน queue
   - `restorePhotoFromDB()` — restore Blob กลับมาเป็น File ก่อน sync

---

### ❌ Still Missing:

**ไม่มีรายการที่ขาด — LIFF App ครบ spec แล้ว!**

---

### Verdict: **READY**

> LIFF App พร้อมสำหรับ deployment — spec compliance 100%

---

### สรุปการเปลี่ยนแปลงจาก Spec Check ก่อนหน้า

| Item | ก่อน | ปัจจุบัน |
|------|------|---------|
| `spraying` action | ❌ ขาด | ✅ เพิ่มแล้ว (`ActionButton.jsx` line 8) |

**Action ที่มีเกิน spec:** `prune`, `inspect`, `harvest` — ไม่ใช่ปัญหา เพราะไม่ทำให้ spec ผิด และเป็น use case ที่เป็นไปได้ในฟาร์มจริง

