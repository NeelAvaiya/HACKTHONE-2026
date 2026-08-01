# Chat-Driven Appointment Booking + Support Calendar

**Date:** 2026-08-01
**Status:** Approved design

## Goal

Booking happens entirely inside the chat thread. There is no separate booking
page and no product/expert selection screen - the client picks a module from
reply chips, the server answers from the database with which experts are free
and when, and one more reply books it. On the support side, a single team
calendar shows every booked shift at a glance.

Secondary requirement: the AI always replies in English, even when the client
writes in Hinglish or Hindi.

### Target conversation A - guided (tap "Book an appointment")

```
Client: [taps 'Book an appointment']
Bot:    Which module do you need help with?
          [ HRMS ] [ Payroll ] [ PMS ] [ Other ]
Client: Payroll
Bot:    Two Payroll experts are free today:
          [ 9:00 AM  - Priya Nair ]
          [ 11:00 AM - Amit Deshmukh ]
Client: 9:00 AM
Bot:    Booked - Today, 9:00 AM with Priya Nair.  [ Change slot ]
```

### Target conversation B - typed time

```
Client: I want to book at 8
Bot:    Sure - which module is this about?
          [ HRMS ] [ Payroll ] [ PMS ] [ Other ]
Client: Payroll
Bot:    8:00 AM is outside our hours (9:00 AM - 6:00 PM). The nearest
        Payroll experts free today:
          [ 9:00 AM  - Priya Nair ]
          [ 11:00 AM - Amit Deshmukh ]
Client: 9
Bot:    Booked - Today, 9:00 AM with Priya Nair.  [ Change slot ]
```

Both paths run through the same state machine and the same booking call. The
requested time from path B is remembered and used to rank the offers.

Support opens `/support/calendar` and sees the 9:00 AM cell in Priya's row
filled with the client's name.

## Decisions

| Question | Decision |
| --- | --- |
| Entry point | Entirely in-chat. "Book an appointment" posts module chips into the thread |
| Module choice | Reply chips; tapping and typing "Payroll" are equivalent |
| Time understanding | Hybrid: local regex first, Gemini structured extraction as fallback |
| Availability source | Seeded `team` collection in Mongo; server computes free slots |
| Offer shape | Time + expert pair, one reply books |
| Support view | Team day-grid: experts (rows) x time slots (columns), 5-day strip |
| English | All bot output and UI copy; client may still write Hinglish |
| Confirmation | Book instantly, with Undo / "Change slot" on the confirmation card |
| Old flow | `/book` page, category grid, expert picker and calendar are deleted |

## Architecture

Three units, each independently testable:

1. **Availability service (server)** - owns "who is free when". Pure function
   over team busy-maps plus booked appointments; HTTP routes are a thin shell.
2. **Slot parser (client util)** - pure function from free text to
   `{dayIdx, time, confident}`. No network, no React.
3. **Booking flow (chat state machine)** - extends the existing `flowRef`
   machine in `useChatBot`. Calls the two above; owns no availability logic.

The support calendar is a read-only view over the same availability service.

### 1. Data layer

Business hours widen so that 8:00 AM is naturally out of range and 9:00 AM is
the first bookable slot:

```js
// src/data/team.js
export const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
                         '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM']
```

`connectDB` seeds `team.js` into a `team` collection on first run, mirroring the
existing ticket seeding. Documents keep the current shape (`name`, `skills`,
`categories`, `status`, `busy`), so no consumer changes shape.

A slot is **free** for an expert when all three hold:

- the time is in `timeSlots`
- the time is not in that expert's `busy[dayIdx]`
- no `appointments` document exists with that `date` + `time` + `person`

Appointment documents gain `date` (ISO `YYYY-MM-DD`) and `time` (string)
alongside the existing human-readable `slot`, so availability can be computed
without parsing display strings.

`dayIdx` is a **transport-only** value: it is a relative offset from today used
in requests and in the UI day-strip, and is never persisted. The server converts
it to an absolute `date` on write and back on read. Persisting the offset would
make a booking drift by a day every midnight.

The expert `busy` maps stay keyed by relative offset, since they are static
demo data representing "a typical week ahead" rather than real calendar entries.

Existing appointment documents lacking `date`/`time` are treated as not
occupying any slot - acceptable, since they are demo seed data.

### 2. Availability service

New `server/availability.js`, mounted under `/api`.

**`GET /api/availability`**
Query: `category` (required, e.g. `Payroll`), `day` (int, default 0),
`time` (optional, e.g. `8:00 AM`).

Without `time` - the guided path - the response lists the soonest free
`{time, person}` pairs for that category. With `time`, offers are ranked by
nearness to it. `exact` is only ever populated when `time` was supplied.

```json
{
  "day": 0,
  "requested": "8:00 AM",
  "inHours": false,
  "exact": [],
  "alternatives": [
    { "time": "9:00 AM",  "person": "Priya Nair",    "category": "Payroll" },
    { "time": "11:00 AM", "person": "Amit Deshmukh", "category": "Payroll" }
  ]
}
```

Ranking of alternatives: ascending absolute distance in minutes from the
requested time, or ascending time-of-day when no time was requested. Ties break
toward the expert with fewer bookings that day, so load spreads across the team.
At most one offer per expert, capped at 3 offers total. If the requested day has
no free slot at all, the service rolls forward to the next day that does (up to
5 days) and sets `"rolledToDay": n` so the bot can say "tomorrow" explicitly.

**`POST /api/appointments/book`**
Body: `{ dayIdx, time, person, category, client }`. Resolves `dayIdx` to an
absolute `date`, re-checks freshness inside the request, and returns
`409 { error: 'taken', alternatives: [...] }` if the slot was claimed in
between. On success returns the created appointment.

This becomes the write path for every real booking - both the chat and the
`/book` page. The existing fire-and-forget `POST /api/appointments` stays only
for `simulateDuplicate`, which deliberately creates a colliding booking for the
merge demo and must bypass the freshness check.

**`DELETE /api/appointments/:id`**
Removes the appointment. Backs the Undo action. Returns `{ ok: true }`.

**`GET /api/team`** - team documents for the support calendar.

All routes degrade like the existing store routes: no DB means `GET` returns
`null` and writes are no-ops. With no DB, the chat falls back to the existing
static slot picker rather than claiming availability it cannot verify.

### 3. Slot parser

New `src/utils/parseSlot.js`, a pure function:

```js
parseSlot('8 baje book karna hai')  // { dayIdx: 0, time: '8:00 AM', confident: true }
parseSlot('tomorrow at 3')          // { dayIdx: 1, time: '3:00 PM', confident: true }
parseSlot('sometime after lunch')   // { dayIdx: 0, time: null,      confident: false }
```

Rules:

- Day words: `today`/`aaj` -> 0, `tomorrow`/`kal` -> 1, weekday names -> next
  matching offset within 5 days. Default 0.
- Time forms: `8`, `8am`, `8 am`, `8pm`, `8:30`, `at 8`, `8 baje`, `8 bje`.
- Meridiem: explicit `am`/`pm` wins. A bare hour 1-6 resolves to PM, 7-12 to AM.
  This is a business-hours heuristic, documented in the file.
- Minutes are rounded down to the hour, since all slots are on the hour.
- Returns `confident: false` when no time is found; the caller decides the
  fallback.

**Gemini fallback.** When `matchIntent` reads the message as a booking but the
parser is not confident, the chat calls `POST /api/parse-slot { message }`. The
server prompts Gemini for strict JSON `{ day, time }` with a low temperature,
validates the shape, and returns the same structure as the parser. On any
failure - bad JSON, quota, 503 - it returns `{ confident: false }`.

An unknown time is not an error state: `requested` simply stays `null` and the
flow continues down the guided path, offering the soonest free slots for the
chosen module. Booking therefore never depends on Gemini being reachable, and
there is no dead end to escape from.

### 4. Booking flow in chat

`matchIntent` gains a `bookTime` intent: the message contains a booking keyword
(`book`, `appointment`, `meeting`, `call`, `schedule`, `slot`, `milna`), with or
without a time.

State added to the existing `flowRef` machine in `useChatBot`, as a `booking`
sub-object:

```js
{ stage: 'awaitModule' | 'awaitSlotChoice',
  category: null,          // set once the module is chosen
  requested: null,         // { dayIdx, time } from a typed time, or null
  offers: [] }             // [{ time, person, category }]
```

**Step 1 - start.** Two triggers, one entry function `startBooking(requested)`:

- tapping the "Book an appointment" CTA -> `startBooking(null)`
- a `bookTime` intent message -> `parseSlot`, and if not confident and the text
  still reads as a booking, `POST /api/parse-slot` -> `startBooking(parsed)`

`startBooking` stores `requested`, posts the module question carrying
`moduleChips` (built from `categories` in `team.js`), and sets
`stage: 'awaitModule'`.

**Step 2 - module.** In `awaitModule`, a tapped chip resolves directly; typed
text is matched case-insensitively against the category keys and their aliases
(`salary`/`payslip` -> Payroll, `attendance`/`leave` -> HRMS, and so on). No
match re-asks once, then falls through to `Other`. The chosen category is stored
and the client's choice is pushed as their own message, so tapping and typing
produce an identical-looking thread.

**Step 3 - offers.** `GET /api/availability` with the category and, if present,
the requested day/time.

- `exact` non-empty -> book immediately with the best-ranked expert
- otherwise push a bot message carrying `slotOffers` and set
  `stage: 'awaitSlotChoice'`
- zero offers within 5 days -> tell the client no slots are open and clear the
  flow

**Step 4 - book.** In `awaitSlotChoice`, a tapped chip resolves directly; a
typed reply is run through `parseSlot` and matched against the pending offers by
hour. Both call the same `bookOffer(offer)`.

`bookOffer` calls `POST /api/appointments/book`. On `409` it re-renders the
returned alternatives and stays in `awaitSlotChoice`. On success it pushes the
confirmation card and clears the flow.

A typed reply that matches no pending offer (for example "5") is treated as a
new time request: it re-runs step 3 with the newly parsed time, keeping the
already-chosen category. Anything that parses as neither clears the flow, matching
how the ticket flow already abandons cleanly.

`BookingContext.book` is extended to accept `{ dayIdx, time, person, category }`
and to go through `/api/appointments/book`, returning the server's appointment
so the caller can render the confirmation. `BookingContext` gains `cancel(id)`
for Undo, which calls `DELETE` and drops the appointment from state.

### 5. UI components

**`SlotPicker`** is reduced to two modes now that the `/book` page is gone: an
**offers** mode rendering one button per `{time, person}` pair with the expert's
name, and the existing **booking** confirmation mode. The old `slots` array mode
is removed along with the hard-coded `botScripts.meetingSlots`.

**Module chips** reuse the existing `chips` message field and `selectChip`
handler - no new component. The chip labels come from `categories` in `team.js`,
so the module list has one source of truth.

**Confirmation card** adds a "Change slot" action that calls `cancel(id)` and
re-opens the offers. Available until the client sends another message.

**`ChatWindow`** replaces the `<Link to="/book">` CTA with a button that calls a
new `onBookStart` prop. `Chat.jsx` wires it to `startBooking` from the hook.

### 5b. Code removed

Deleting the parallel booking path is part of this work, not a follow-up:

- `src/pages/BookAppointment.jsx` - category grid, expert picker, calendar
- `src/components/booking/AvailabilityCalendar.jsx`
- `src/components/booking/BookingConfirmed.jsx`
- `botScripts.meetingSlots`, `botScripts.slotIntro`, and the `slots` mode of `SlotPicker`
- `showSlots()` and `pickSlot()` in `useChatBot.js`, replaced by the new flow

`/book` keeps a route, but only as `<Navigate to="/chat" replace />`. A bare 404
would be worse for anyone with the old URL open, and the redirect lands them on
the flow that replaced it.

The module matcher lives in its own unit, `src/utils/matchModule.js`, rather than
inside the hook - it is a pure function and the flow test exercises it directly.

`src/components/booking/ReviewBlock.jsx` and `ReviewForm.jsx` stay - they serve
the post-meeting review, which is unrelated. After deletion, nothing outside the
chat imports from `components/booking/` except those two.

Verification that the removal is complete: `grep -rn "/book\|BookAppointment\|AvailabilityCalendar\|BookingConfirmed\|meetingSlots" src` returns nothing, and `npm run build` succeeds.

**`TeamDayGrid`** (new, `src/components/support/TeamDayGrid.jsx`) - props-only:
`{ team, appointments, dayIdx, onSelectBooking }`. Renders experts as rows and
`timeSlots` as columns. Cell states:

- **booked** - colored block with the client name; clickable
- **busy** - gray, blocked (from the expert's busy map)
- **free** - light/empty

**`SupportCalendar`** (new page, route `/support/calendar`) - owns the 5-day
strip with per-day booking counts, fetches `/api/team` once, calls the existing
`reload()` on mount for fresh appointments, and passes everything to
`TeamDayGrid`. Clicking a booked cell navigates to `/support` with the
appointment id in router state so the Inbox opens that thread. A "Calendar" tab
is added to the tab list in `Support.jsx`.

### 6. English-only copy

`BASE_PROMPT` in `server/index.js` gains an explicit rule:

> Always reply in English. The user may write in Hinglish or Hindi - understand
> it, but always answer in English.

Hinglish strings are rewritten in English in `src/data/botScripts.js`,
`summaryText()` in `useChatBot.js`, and any remaining page microcopy in
`Landing.jsx`, `Chat.jsx` and the support pages. (The Hinglish copy in
`BookAppointment.jsx` needs no rewrite - that file is deleted.)

**Cache trap.** The Mongo `qa` collection already holds Hinglish replies and is
consulted before Gemini, so it would serve pre-change answers straight past the
new prompt. Cached documents therefore carry a `promptVersion` field; the chat
route only serves a cached reply when its version matches the current one, and
overwrites it otherwise.

## Error handling

| Condition | Behavior |
| --- | --- |
| Mongo unreachable | Availability falls back to the in-memory `team.js` busy maps with no bookings subtracted, so the chat still offers and confirms slots; the booking is not persisted and the support calendar shows an empty state |
| Gemini unreachable during parse | Parser result stands; if it was not confident, `requested` stays null and the guided path offers the soonest slots |
| Requested time out of hours | Bot states the hours and offers the nearest in-hours slots |
| No free slot for the requested day | Service rolls forward up to 5 days; bot names the day explicitly |
| Slot claimed between offer and book | `409` with fresh alternatives; bot re-offers without losing the conversation |
| Reply does not match any offer | Treated as a new time request; availability is re-queried |

## Testing

No test runner is configured, so tests follow the existing `server/test-chat.js`
pattern - plain Node scripts run via npm scripts.

**`server/test-parse-slot.js`** - table-driven cases over `parseSlot`: bare
hours, `baje` forms, explicit meridiem, day words in English and Hinglish,
minutes rounding, and the no-time case.

**`server/test-booking.js`** - end-to-end against a running server:

1. `GET /api/availability?category=Payroll` (no time - the guided path) returns
   free `{time, person}` pairs, at most one per expert.
2. `GET /api/availability?category=Payroll&day=0&time=8:00 AM` returns
   `inHours: false` with alternatives ranked nearest-first.
3. `POST /api/appointments/book` with the first alternative returns the
   appointment, and the response carries an absolute `date`, not `dayIdx`.
4. Re-querying availability no longer lists that expert at that time.
5. Booking the same slot again returns `409` with fresh alternatives.
6. `DELETE /api/appointments/:id` frees the slot again.

Scripts registered as `npm run test:slots` and `npm run test:booking`.

**Removal check** - `grep -rn "/book\|BookAppointment\|AvailabilityCalendar\|BookingConfirmed\|meetingSlots" src` returns nothing and `npm run build` succeeds.

## Out of scope

- Real calendar integration (Google/Outlook) - the invite line stays cosmetic.
- Recurring appointments, rescheduling beyond Undo, or timezone handling.
- Editing expert schedules from the support UI; `busy` maps stay seed data.
- Live push to the support calendar; it refreshes on tab open like the Inbox.
