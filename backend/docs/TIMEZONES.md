# Timezone Management

## Overview

- **Teachers and students** set availability in **their local time** (their country/timezone).
- **Storage**: All availability slots are stored in **UTC** (dayOfWeek 1–7, startTime/endTime as HH:mm in UTC). The optional `enteredTimezone` field records the IANA timezone used when the slot was created.
- **Admin** always sees and enters availability in **Morocco time (Africa/Casablanca)** for easy comparison and assignment.

## Flow

1. **Professor/Student submits availability**
   - Frontend sends `dayOfWeek`, `startTime`, `endTime` in the user’s local time (and optionally `timezone` from the browser if the user has no profile timezone).
   - Backend uses the user’s timezone (from profile or request body) to convert to UTC and saves the slot with `enteredTimezone`.
   - If the user had no timezone set and the client sent `timezone`, the user’s profile is updated with that timezone.

2. **Professor/Student views their availability**
   - Backend loads UTC slots and converts them to the user’s timezone (from profile or country fallback) before returning.

3. **Admin views all availability**
   - `GET /admin/professors/availability` and `GET /admin/students/availability` return slots converted to **Africa/Casablanca**.
   - The admin calendar and “add slot” form are in Morocco time; the API expects Morocco time when creating student slots.

4. **Professor planning (all profs’ slots)**
   - `GET /professor/planning/availability-all` returns every professor’s slots in the **requesting professor’s timezone** so they can compare in their local time.

## Helpers

- `availabilityUtc.js`: `localSlotToUtc`, `utcSlotToZoned`, `moroccoSlotToUtc`, `getUserTz`, `MOROCCO_TZ`.
- User timezone is taken from `User.timezone` or, if missing, from `User.country` via a country → IANA mapping; if the client sends `timezone` on availability submit and the user has none, it is stored on the user.
