# Scheduling APIs Built/Changed

This file documents the **new and changed APIs** implemented for the production-grade Doctor Appointment & Slot Management flow.

Base URL used below: `{{baseUrl}} = /api`

---

## 1) Doctor APIs

### `POST /availability-rules`
- **Objective:** Create a recurring weekly availability rule for the authenticated doctor.
- **Auth header:** `dtoken`
- **Typical use:** Define working windows (e.g., 09:00-13:00, Mon).

### `PUT /availability-rules/:id`
- **Objective:** Update an existing availability rule.
- **Auth header:** `dtoken`
- **Typical use:** Modify timings, slot duration, buffer, timezone, active state.

### `DELETE /availability-rules/:id`
- **Objective:** Soft-delete an availability rule (`is_active = false`).
- **Auth header:** `dtoken`
- **Typical use:** Retire old schedules without hard deleting records.

### `POST /doctor-leaves`
- **Objective:** Add doctor leave (date range), which suppresses slot generation.
- **Auth header:** `dtoken`
- **Typical use:** Planned leave/vacation.

### `POST /doctor-blocks`
- **Objective:** Add a time-specific block for a date.
- **Auth header:** `dtoken`
- **Typical use:** Temporary unavailability during working day.

### `PATCH /appointments/:id/status`
- **Objective:** Doctor updates appointment status to `COMPLETED` or `NO_SHOW`.
- **Auth header:** `dtoken`
- **Typical use:** Post-consultation status update.

---

## 2) Patient APIs

### `GET /doctors/:id/slots?date=YYYY-MM-DD[&clinicId=...]`
- **Objective:** Dynamically generate and return available slots for given doctor/date.
- **Auth header:** Not required currently.
- **Typical use:** Slot discovery before booking.

### `POST /appointments`
- **Objective:** Book appointment (uses temporary slot lock + appointment create).
- **Auth header:** `token`
- **Typical use:** Confirm selected slot.

### `PUT /appointments/:id/reschedule`
- **Objective:** Reschedule patient’s appointment to a new slot.
- **Auth header:** `token`
- **Typical use:** Move booking to another available slot.

### `DELETE /appointments/:id`
- **Objective:** Cancel patient’s appointment (`status = cancelled`).
- **Auth header:** `token`
- **Typical use:** Patient cancellation flow.

---

## 3) Admin APIs

### `POST /holidays`
- **Objective:** Create clinic/global holiday; holiday suppresses slot generation.
- **Auth header:** `atoken`
- **Typical use:** Public holiday or clinic closure day.

### `POST /emergency-blocks`
- **Objective:** Admin creates emergency doctor block for specific date/time.
- **Auth header:** `atoken`
- **Typical use:** Emergency override on doctor schedule.

### `GET /reports/analytics`
- **Objective:** Get analytics summary:
  - total appointments
  - status breakdown (`booked`, `completed`, `cancelled`, `no_show`)
  - unique doctors/patients
  - no-show/cancellation rates
  - completed consultation-fee revenue
- **Auth header:** `atoken`

---

## 4) Background Automation Added

### No-show watcher job
- **What:** Periodically marks overdue `BOOKED` appointments as `NO_SHOW`.
- **Where:** `src/jobs/noShow.job.js`, started from `src/server.js`
- **Config envs:**
  - `NO_SHOW_GRACE_MINUTES` (default `15`)
  - `NO_SHOW_SCAN_INTERVAL_MS` (default `60000`)

---

## 5) Recommended Sequential Test Plan

Use `scheduling-apis.http` and run in this order.

1. **Doctor setup**
   - `POST /availability-rules`
   - `POST /doctor-blocks` (optional)
   - `POST /doctor-leaves` (optional)

2. **Admin overrides**
   - `POST /holidays` (optional)
   - `POST /emergency-blocks` (optional)

3. **Patient booking flow**
   - `GET /doctors/:id/slots?date=...`
   - `POST /appointments`

4. **Patient lifecycle actions**
   - `PUT /appointments/:id/reschedule`
   - `DELETE /appointments/:id` (if testing cancellation)

5. **Doctor lifecycle actions**
   - `PATCH /appointments/:id/status` with `COMPLETED` or `NO_SHOW`

6. **Admin reporting**
   - `GET /reports/analytics`

7. **No-show automation check**
   - Keep one booked appointment in past beyond grace period
   - Wait for watcher interval
   - Recheck status/analytics

---

## 6) Additional Route Aliases (Also Available)

The same scheduling handlers are also mounted under actor route files:
- Doctor-prefixed routes in `src/routes/doctor.routes.js`
- Admin-prefixed routes in `src/routes/admin.routes.js`

For clean testing, prefer the canonical endpoints listed above under `/api/...`.

