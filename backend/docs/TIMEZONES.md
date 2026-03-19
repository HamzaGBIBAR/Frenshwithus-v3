# Timezone Management

**Rule: DATABASE = UTC. DISPLAY = USER TIMEZONE (admin = Morocco).**

## Overview

- **User timezone**: Each user has `User.timezone` (IANA, e.g. Europe/Paris). If missing, fallback from `User.country` or auto-detect from browser (`Intl.DateTimeFormat().resolvedOptions().timeZone`) and save via `PATCH /auth/me` or when submitting availability.
- **Availability**: Stored in **UTC** (dayOfWeek 1–7, startTime/endTime as HH:mm in UTC). `enteredTimezone` records the timezone when the slot was created. Teachers/students input in local time; backend converts to UTC. Admin sees and enters in **Africa/Casablanca**.
- **Lessons (Course)**: Stored with `startUtc` (DateTime, UTC) as canonical start. `date` and `time` are kept in Morocco for admin display. Admin creates in Morocco time; backend converts to UTC and saves `startUtc`. Student and teacher see lessons in their timezone (frontend converts `startUtc` → local).

## Flow

1. **Professor/Student submits availability**
   - Frontend sends local `dayOfWeek`, `startTime`, `endTime` (and optional `timezone` from browser).
   - Backend converts to UTC and saves with `enteredTimezone`. If user had no timezone, it is updated.

2. **Professor/Student views availability**
   - Backend returns slots converted to the user’s timezone.

3. **Admin views availability**
   - All slots in **Africa/Casablanca**. Admin creates student slots in Morocco time (converted to UTC on save).

4. **Lesson creation (admin)**
   - Admin enters date + time in Morocco. Backend computes `startUtc = moroccoDateTimeToUtc(date, time)` and saves `date`, `time`, `startUtc`.

5. **Lesson display**
   - **Admin**: sees `date` + `time` (Morocco).
   - **Student/Teacher**: API returns `startUtc`; frontend uses `formatUtcInTimezone(startUtc, userTz)` to show in local time.

## Helpers

- **Backend** `availabilityUtc.js`: `localSlotToUtc`, `utcSlotToZoned`, `moroccoSlotToUtc`, `moroccoDateTimeToUtc`, `utcToMoroccoDateTime`, `utcToZonedDateTime`, `getUserTz`, `MOROCCO_TZ`.
- **Frontend** `countries.js`: `formatUtcInTimezone(isoUtcString, toTz, locale)` for course display from UTC.
- **Timezone detection**: Frontend calls `PATCH /auth/me` with `{ timezone }` when user has no timezone and browser provides `Intl.DateTimeFormat().resolvedOptions().timeZone`.
