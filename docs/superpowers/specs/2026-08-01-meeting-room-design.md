# Google Meet-Style Meeting Room (Support Side)

**Date:** 2026-08-01
**Status:** Approved design

## Goal

After a client books through the chat, the support person opens the booked
appointment and clicks **Join meeting**. A full-screen, Meet-style call page
opens showing two participants — the support expert and the client — visibly
holding a conversation. Ending the call marks the meeting complete, which
delivers the summary and review to both sides through the flow that already
exists.

Everything on this page is **dummy**: no camera, no microphone, no
`getUserMedia`, no permissions, no real media of any kind. The conversation is a
scripted timeline played back on a timer.

## Decisions

| Question | Decision |
| --- | --- |
| Call visuals | Simulated avatar tiles, speaking ring, scripted captions |
| Media | None. Nothing real — no camera, mic, or permission prompts |
| Access | Support side only; the client chat is untouched |
| Availability | "Join meeting" always enabled for upcoming appointments |
| End call | Marks the meeting done, then returns to the Inbox |

**Why "always enabled":** gating the button on the current time falling inside
the booked slot makes the feature undemonstrable — a 9:00 AM booking cannot be
shown at 3 PM. The slot time is displayed as a subtitle so it still reads as
scheduled.

## Architecture

Five units, each with one job:

| Unit | Responsibility | Depends on |
| --- | --- | --- |
| `utils/callScript.js` | Pure timing math: `lineAt(script, elapsedMs)` | nothing |
| `hooks/useCallScript.js` | Ticks a clock, exposes the current speaker and line | `utils/callScript.js` |
| `components/meeting/ParticipantTile.jsx` | One participant tile | nothing (props-only) |
| `components/meeting/CallControls.jsx` | Control bar and End call | nothing (props-only) |
| `pages/MeetingRoom.jsx` | Route shell, appointment lookup, End call | the four above |

The timing math is deliberately separated from React so it can be tested in a
plain node script, matching how `parseSlot` is tested.

### 1. Route and entry point

Route: `/support/meeting/:id`, registered in `App.jsx` **outside** the `/support`
tab shell so the page renders full-bleed without the tab bar.

Entry: a **Join meeting** button in `SupportThread.jsx`, beside the existing
"Meeting done", rendered when `status === 'upcoming' && !duplicateOf` — the same
condition that already guards "Meeting done".

Missing or unknown `:id` redirects to `/support`. This covers a stale link and a
hard refresh on a merged appointment.

### 2. The script

`src/data/callScript.js` exports scripts keyed by category:

```js
export const callScripts = {
  Payroll: [
    { speaker: 'expert', text: '…', ms: 4200 },
    { speaker: 'client', text: '…', ms: 3800 },
  ],
  default: [ /* generic support conversation */ ],
}
```

`speaker` is `'expert'` or `'client'` — resolved to real names from the
appointment at render time, so the dialogue names whoever was actually booked.
`ms` is how long that line stays on screen.

Category selection: `callScripts[appt.category] || callScripts.default`.

### 3. Timing

`lineAt(script, elapsedMs)` walks cumulative durations and returns
`{ index, line, spoken }` where `spoken` is every line up to and including the
current one. Past the end of the script it holds the final line and sets
`done: true` — the conversation does not loop, because a looping conversation
reads as a bug.

`useCallScript(script)` ticks every 250ms, feeds `elapsedMs` to `lineAt`, and
returns `{ activeSpeaker, currentLine, spoken, elapsed, done }`. It clears its
interval on unmount.

The call duration clock (`MM:SS` in the header) derives from the same elapsed
value — one timer, not two that can drift apart.

### 4. Components

**`ParticipantTile`** — props: `{ name, role, speaking, muted, self }`. Renders a
rounded dark tile with a large circular avatar (initials on a per-person colour),
a name chip bottom-left, a mic-off badge when muted, and a green ring plus a
subtle pulse when `speaking`. No internal state.

**`CallControls`** — props: `{ micOn, cameraOn, captionsOn, transcriptOpen,
onToggle, onEnd }`. Circular buttons for mic, camera, captions and transcript,
then a red pill End call. Mic and camera are **cosmetic**: toggling them changes
the icon and the tile badge and nothing else, because there is no media to
control. Captions and transcript genuinely show and hide their panels.

**`MeetingRoom`** — finds the appointment by id, derives expert and client
display names, drives `useCallScript`, and lays out header, tile grid, captions
and controls. Owns the mic/camera/captions/transcript booleans.

**Transcript panel** — slides in from the right, listing `spoken` lines with
speaker names, auto-scrolled to the newest. Same data as the captions, so there
is no second source of truth.

### 5. Visual direction

Google Meet's dark shell: `#202124` background, `#3c4043` tiles, white text,
green accent for the active speaker, red for End call. Rounded 16px tiles in a
two-up grid that stacks vertically under `sm`. Controls float in a bar at the
bottom. Captions sit above the controls in a translucent black rounded box, the
speaker's name in muted grey above the line.

The page uses its own dark palette rather than the app's light theme — that
contrast is the point, and it is scoped to this route.

### 6. Ending the call

`onEnd` calls the existing `complete(appt.id)` from `BookingContext`, then
navigates to `/support` with `{ state: { appointmentId: appt.id } }` so the
Inbox opens that thread — the same mechanism the team calendar already uses.

If the appointment is already `done`, End call skips `complete` and only
navigates, so a re-opened call cannot complete it twice.

## Error handling

| Condition | Behavior |
| --- | --- |
| Unknown or missing `:id` | Redirect to `/support` |
| Appointments still loading | Render nothing until the context has data, then resolve |
| Appointment already `done` | Page is viewable; End call navigates without re-completing |
| Script missing for a category | Falls back to `callScripts.default` |
| Script finished | Holds the last line, `done: true`, call stays open |

## Testing

`server/test-call-script.js`, run via `npm run test:call`, covers `lineAt`:

- `0ms` returns the first line
- a time inside line 2 returns line 2 with two `spoken` entries
- the exact boundary between lines resolves to the later line
- past the end holds the final line and sets `done: true`
- an empty script returns `null` without throwing

The React layer stays visually verified, consistent with the rest of the app.

## Incidental fix

`SupportThread.jsx` still contains one Hinglish string the English sweep missed
("ek hi ticket" in the merged-clients banner). It is corrected as part of this
work since the file is being edited anyway.

## Out of scope

- Real audio or video, screen sharing, or any WebRTC
- A client-side join; the client chat is not modified
- Persisting call state, duration, or transcript to the database
- Multi-party calls; the layout assumes exactly two participants
