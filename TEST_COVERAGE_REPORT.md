# Test Coverage Report - Farm System
**Reviewed by:** Circuit (Code Review Specialist)  
**Date:** 2026-03-26  
**Status:** ⚠️ Critical gaps found

---

## Missing Tests

### Backend (Laravel/PHP)

> **Current:** Only `tests/Unit/PlantTest.php` exists. No Feature tests at all.

#### Endpoints NOT Covered

- [ ] **Endpoint:** `POST /api/auth/line/callback` — LINE Login callback
- [ ] **Endpoint:** `POST /api/auth/line/login` — LINE Login initiation
- [ ] **Endpoint:** `POST /api/auth/register` — User registration
- [ ] **Endpoint:** `POST /api/auth/logout` — Logout
- [ ] **Endpoint:** `POST /api/auth/refresh` — Token refresh
- [ ] **Endpoint:** `GET /api/auth/me` — Get current user profile
- [ ] **Endpoint:** `GET /api/dashboard/metrics` — Dashboard metrics
- [ ] **Endpoint:** `GET /api/dashboard/today` — Today's statistics
- [ ] **Endpoint:** `GET /api/farms` — List farms
- [ ] **Endpoint:** `POST /api/farms` — Create farm
- [ ] **Endpoint:** `GET /api/farms/{id}` — Get farm details
- [ ] **Endpoint:** `PUT /api/farms/{id}` — Update farm
- [ ] **Endpoint:** `DELETE /api/farms/{id}` — Delete farm
- [ ] **Endpoint:** `GET /api/farms/{id}/with-relations` — Farm with all relations
- [ ] **Endpoint:** `GET /api/farms/{id}/metrics` — Farm-specific metrics
- [ ] **Endpoint:** `GET /api/farms/{id}/users` — Farm users
- [ ] **Endpoint:** `GET/POST /api/farms/{farmId}/zones` — Zone CRUD under farm
- [ ] **Endpoint:** `GET/PUT/DELETE /api/farms/{farmId}/zones/{zoneId}` — Single zone
- [ ] **Endpoint:** `GET /api/farms/{farmId}/problem-reports` — Problem reports by farm
- [ ] **Endpoint:** `GET/POST /api/zones/{zoneId}/plots` — Plot CRUD under zone
- [ ] **Endpoint:** `GET/PUT/DELETE /api/zones/{zoneId}/plots/{plotId}` — Single plot
- [ ] **Endpoint:** `GET/POST /api/plots/{plotId}/plants` — Plant CRUD under plot
- [ ] **Endpoint:** `GET/PUT/DELETE /api/plots/{plotId}/plants/{plantId}` — Single plant
- [ ] **Endpoint:** `POST /api/plots/{plotId}/plants/find-by-qr` — Find plant by QR
- [ ] **Endpoint:** `GET /api/plots/{id}/activities/plot` — Plot activities
- [ ] **Endpoint:** `GET /api/plants/{id}/activities/plant` — Plant activities
- [ ] **Endpoint:** `GET /api/plants/{id}` — Get plant
- [ ] **Endpoint:** `PUT /api/plants/{id}` — Update plant
- [ ] **Endpoint:** `DELETE /api/plants/{id}` — Delete plant
- [ ] **Endpoint:** `GET /api/activities` — List activities
- [ ] **Endpoint:** `POST /api/activities` — Log single activity
- [ ] **Endpoint:** `POST /api/activities/batch` — Log batch activities
- [ ] **Endpoint:** `GET /api/activities/{id}` — Get activity
- [ ] **Endpoint:** `GET /api/tasks` — List tasks
- [ ] **Endpoint:** `POST /api/tasks` — Create task
- [ ] **Endpoint:** `GET /api/tasks/my` — My assigned tasks
- [ ] **Endpoint:** `GET /api/tasks/{id}` — Get task
- [ ] **Endpoint:** `PUT /api/tasks/{id}` — Update task
- [ ] **Endpoint:** `DELETE /api/tasks/{id}` — Delete task
- [ ] **Endpoint:** `PUT /api/tasks/{taskId}/assignment-status` — Update assignment status
- [ ] **Endpoint:** `GET /api/problem-reports` — List problem reports
- [ ] **Endpoint:** `POST /api/problem-reports` — Create problem report
- [ ] **Endpoint:** `GET /api/problem-reports/{id}` — Get problem report
- [ ] **Endpoint:** `PUT /api/problem-reports/{id}` — Update problem report
- [ ] **Endpoint:** `DELETE /api/problem-reports/{id}` — Delete problem report
- [ ] **Endpoint:** `POST /api/qr/scan` — Scan QR code
- [ ] **Endpoint:** `GET /api/qr/plot/{id}` — Get plot QR data
- [ ] **Endpoint:** `GET /api/qr/plant/{id}` — Get plant QR data
- [ ] **Endpoint:** `GET /api/qr/as-image` — Get QR as image
- [ ] **Endpoint:** `POST /api/line-notify/send` — Send LINE Notify message
- [ ] **Endpoint:** `POST /api/line-notify/send-with-image` — Send with image
- [ ] **Endpoint:** `POST /api/line-notify/send-task` — Send task notification
- [ ] **Endpoint:** `POST /api/line-notify/send-problem` — Send problem notification
- [ ] **Endpoint:** `POST /api/line-notify/authorize` — Authorize LINE Notify token
- [ ] **Endpoint:** `POST /api/line-notify/revoke` — Revoke LINE Notify token

#### Flows NOT Covered

- [ ] **Flow:** LINE Login OAuth flow (callback → token generation → user creation)
- [ ] **Flow:** Authentication middleware (unauthenticated → 401 response)
- [ ] **Flow:** Farm access authorization (user without farm access → 403)
- [ ] **Flow:** Role-based access (worker accessing owner-only endpoints → 403)
- [ ] **Flow:** Activity logging with photo upload
- [ ] **Flow:** Batch activity logging (storeBatch)
- [ ] **Flow:** Task assignment and status update flow
- [ ] **Flow:** Problem report creation with photo
- [ ] **Flow:** QR code scanning and target resolution
- [ ] **Flow:** LINE Notify OAuth authorization flow
- [ ] **Flow:** Offline queue sync flow
- [ ] **Flow:** Rate limiting (throttle middleware)
- [ ] **Flow:** CORS and preflight requests

#### Additional Backend Gaps

- [ ] **Unit:** All Repository tests (FarmRepository, ZoneRepository, PlotRepository, PlantRepository, ActivityRepository, TaskRepository, ProblemReportRepository, UserRepository)
- [ ] **Unit:** Request validation classes (FarmStoreRequest, ZoneStoreRequest, PlotStoreRequest, PlantStoreRequest, ActivityStoreRequest, ActivityBatchStoreRequest, TaskStoreRequest, TaskUpdateRequest, ProblemReportStoreRequest, LineNotifySendRequest, LineLoginRequest)
- [ ] **Unit:** Middleware tests (CheckFarmAccess, CheckRole)
- [ ] **Unit:** Model tests (Farm, Zone, Plot, Activity, Task, User, ProblemReport, LineNotifyToken)
- [ ] **Feature:** Database migrations (fresh DB state, foreign keys, indexes)

---

### Web Admin (React/Vite)

> **Current:** No test framework installed. Zero test files. No test script in package.json.

#### Components NOT Tested

- [ ] **Component:** `Layout.jsx` — Main layout wrapper
- [ ] **Component:** `ProtectedRoute.jsx` — Route guard with role checking
- [ ] **Component:** `ErrorBoundary.jsx` — Error boundary wrapper
- [ ] **Component:** `Shared.jsx` — Shared UI components (LoadingSpinner, ErrorAlert, etc.)

#### Pages NOT Tested

- [ ] **Page:** `Login.jsx` — LINE Login page + callback handler
- [ ] **Page:** `Dashboard.jsx` — Dashboard with stats cards
- [ ] **Page:** `Farms.jsx` — Farm listing and CRUD
- [ ] **Page:** `Zones.jsx` — Zone listing and management
- [ ] **Page:** `Plots.jsx` — Plot listing and management
- [ ] **Page:** `Plants.jsx` — Plant listing and management
- [ ] **Page:** `PlotQR.jsx` — QR code display for plots
- [ ] **Page:** `Tasks.jsx` — Task listing and management
- [ ] **Page:** `Problems.jsx` — Problem report listing
- [ ] **Page:** `Users.jsx` — User management (owner only)

#### Hooks NOT Tested

- [ ] **Hook:** `useApi.js` — API request hook

#### Services NOT Tested

- [ ] **Service:** `services/api.js` — Axios instance and all API functions

#### Additional Web Admin Gaps

- [ ] **AuthContext:** `AuthContext.jsx` — Auth state management (login, logout, token refresh)
- [ ] **App.jsx:** Router setup and routing logic

---

### LIFF App (React/Vite)

> **Current:** No test framework installed. Zero test files. No test script in package.json.

#### Components NOT Tested

- [ ] **Component:** `Header.jsx` — Navigation header with view switching
- [ ] **Component:** `ActionButton.jsx` — Action button component
- [ ] **Component:** `PhotoUpload.jsx` — Photo upload with camera
- [ ] **Component:** `Loading.jsx` — Loading spinner
- [ ] **Component:** `ErrorBoundary.jsx` — Error boundary
- [ ] **Component:** `ActivityItem.jsx` — Activity display item

#### Pages NOT Tested

- [ ] **Page:** `LoginPage.jsx` — LIFF login page
- [ ] **Page:** `ScanPage.jsx` — QR scan result and action selection
- [ ] **Page:** `ActionForm.jsx` — Activity logging form
- [ ] **Page:** `ProblemReport.jsx` — Problem report form
- [ ] **Page:** `TaskList.jsx` — Worker task list
- [ ] **Page:** `SuccessPage.jsx` — Success confirmation page

#### Hooks NOT Tested

- [ ] **Hook:** `useLiff.js` — LIFF SDK integration
- [ ] **Hook:** `useOffline.js` — Offline status detection

#### Services NOT Tested

- [ ] **Service:** `api.js` — Full API service including offline queue
- [ ] **Service:** `liffMock.js` — LIFF mock for development

#### Additional LIFF Gaps

- [ ] **App.jsx:** Main app state, view routing, offline banner
- [ ] **Offline sync:** IndexedDB photo storage, queue serialization, sync logic
- [ ] **Deep link routing:** `parseRoute()` from URL path

---

### Docker / Deployment

> **Current:** docker-compose.yml defines healthchecks but no test suite validates them.

#### Missing Tests

- [ ] **Healthcheck:** Backend `/api/health` endpoint returns expected JSON structure
- [ ] **Healthcheck:** Web Admin and LIFF containers return HTTP 200
- [ ] **Integration:** Full stack startup — all containers start successfully
- [ ] **Integration:** Database migration runs on fresh `mariadb_data` volume
- [ ] **Integration:** Environment variables are correctly passed to containers
- [ ] **Integration:** Nginx proxy routing (`/api/*` → backend, `/admin/*` → web-admin)
- [ ] **Security:** Non-root user in backend container (user: "82:82")
- [ ] **Security:** No sensitive data leaked in container logs or ENV

---

### Security Tests

> **Current:** No security tests exist at all.

#### Missing Tests

- [ ] **Auth:** Unauthenticated access to protected endpoints → 401
- [ ] **Auth:** Invalid/expired token → 401
- [ ] **Auth:** LINE Login with invalid code → appropriate error response
- [ ] **Auth:** CSRF token validation on state-changing requests
- [ ] **Auth:** Token refresh with expired token
- [ ] **Auth:** Logout invalidates token
- [ ] **Auth:** Double logout is idempotent
- [ ] **RBAC:** Worker role accessing `/farms/*` → 403
- [ ] **RBAC:** Worker role accessing `/users` → 403
- [ ] **RBAC:** Owner/Manager accessing all farm resources
- [ ] **RBAC:** Unassigned user accessing farm's zones → 403
- [ ] **RBAC:** Manager of Farm A accessing Farm B's resources → 403
- [ ] **Input Validation:** Malformed JSON body → 422 with validation errors
- [ ] **Input Validation:** XSS payload in text fields → sanitized or rejected
- [ ] **Input Validation:** SQL injection in ID parameters → handled gracefully
- [ ] **Rate Limiting:** Auth endpoint throttling after 5 attempts → 429
- [ ] **Rate Limiting:** API write endpoints throttling → 429
- [ ] **File Upload:** Uploading oversized file → 413
- [ ] **File Upload:** Uploading non-image file as photo → 422
- [ ] **File Upload:** Photo upload without authentication → 401
- [ ] **LINE Notify:** Send notification without valid LINE Notify token → error response

---

## Recommendations

### 1. Priority Tests to Add

#### 🔴 High Priority (Must have before production)

| Priority | Test Area | Reason |
|----------|-----------|--------|
| 1 | **Auth flow** — LINE Login | Security critical; handles all user access |
| 2 | **Farm access middleware** | Authorization bypass = data leakage between farms |
| 3 | **Role-based access** (owner/manager/worker) | Access control is a core security boundary |
| 4 | **Rate limiting** on auth and write endpoints | DoS protection |
| 5 | **Input validation** for all store/update endpoints | Security critical |
| 6 | **LIFF offline queue sync** | Data loss risk for field workers |
| 7 | **Task assignment flow** | Core business process |
| 8 | **Docker healthchecks** actually work | Deployment reliability |

#### 🟡 Medium Priority (Should have before production)

| Priority | Test Area | Reason |
|----------|-----------|--------|
| 9 | **Activity batch logging** | Core workflow for field workers |
| 10 | **Problem report with photo upload** | Core workflow |
| 11 | **Dashboard metrics API** | Admin-facing reporting |
| 12 | **QR code generation and scanning** | Farm tracking core feature |
| 13 | **LINE Notify send/revoke flow** | Notification system |
| 14 | **Web Admin: AuthContext** | Core app state |

#### 🟢 Low Priority (Nice to have)

| Priority | Test Area | Reason |
|----------|-----------|--------|
| 15 | Repository unit tests | Already partially covered by integration tests |
| 16 | Component snapshot tests for Web Admin | UI regression |
| 17 | Component snapshot tests for LIFF | UI regression |
| 18 | Lighthouse CI / bundle size tests | Performance |

### 2. E2E Test Scenarios

#### Scenario A: Worker logs activity in offline mode, then syncs
```
Given: Field worker is offline
When: Worker scans QR code and logs watering activity with photo
Then: Activity is saved to IndexedDB queue
When: Worker comes back online
Then: Activity syncs to server with photo
And: Server returns 201 Created
```

#### Scenario B: Owner creates farm, adds zones, assigns worker
```
Given: Owner is authenticated as owner
When: POST /api/farms with valid data
Then: Farm is created, returns 201
When: POST /api/farms/{id}/zones
Then: Zone is created under farm
When: Worker (unassigned) tries to access zone
Then: Returns 403 Forbidden
When: Owner assigns worker to farm
Then: Worker can now access zones and plots
```

#### Scenario C: LINE Login full flow
```
Given: User has LINE app installed
When: User initiates LINE Login via web-admin
Then: Redirected to LINE OAuth
When: User approves in LINE app
Then: Callback received with code
When: Backend exchanges code for token
Then: User created/updated, JWT returned
When: Client stores JWT
Then: Subsequent requests include Bearer token
```

#### Scenario D: Rate limiting triggers
```
Given: Attacker sends 6 POST /api/auth/line/login in 1 minute
When: 7th request within the minute
Then: Returns 429 Too Many Requests
And: Retry-After header present
```

#### Scenario E: Problem report escalates to LINE Notify
```
Given: Worker submits problem report with photo
Then: Returns 201 Created
When: Problem report is severe (priority=high)
Then: LINE Notify sends message to subscribed channels
```

#### Scenario F: Docker stack full startup
```
Given: Fresh environment with docker-compose
When: docker-compose up -d
Then: All 4 services start (mariadb, backend, web-admin, liff-app)
And: Backend healthcheck returns 200 within 30s
And: web-admin returns 200 at /
And: liff-app returns 200 at /
```

#### Scenario G: Batch activity logging
```
Given: Worker logs 5 activities at once (batch)
When: POST /api/activities/batch with 5 activities
Then: All 5 activities stored
And: Each linked to correct plant/plot
And: Photos uploaded for applicable activities
```

---

## Test Framework Setup Required

### Backend
- PHPUnit already configured (`phpunit.xml` exists)
- Need: Feature tests directory populated
- Need: Model factories for all entities
- Need: Database seeding for test data

### Web Admin
- **Missing:** Install `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
- Add to `package.json`:
  ```json
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
  ```
- Create `vite.config.js` test setup
- Create `src/setupTests.js`

### LIFF App
- **Missing:** Same as Web Admin
- No LIFF SDK mock currently exists in tests
- Need: `liffMock.js` imported in tests (already exists as `src/services/liffMock.js`)

---

*Report generated by Circuit (Code Review Specialist) — NiSK Dev Team*
