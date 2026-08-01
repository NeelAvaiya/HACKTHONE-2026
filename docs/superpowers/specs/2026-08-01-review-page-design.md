# Shared Review Page

**Date:** 2026-08-01
**Status:** Approved design

## Goal

Reviews move out of the chat bubble and the support thread into one dedicated
page that both sides use. After submitting, each side sees both reviews laid out
properly instead of a cramped card inside a conversation. Support additionally
gets a Reviews tab listing every meeting's feedback in one place.

## Decisions

| Question | Decision |
| --- | --- |
| Entry | One shared page; the inline forms are removed from both sides |
| After submit | Both reviews side by side, with a waiting state for the other |
| Support overview | A Reviews sub-tab listing every completed meeting |
| Data | No schema change — `reviews.client` / `reviews.support` already exist |

## Architecture

| Unit | Responsibility | Depends on |
| --- | --- | --- |
| `utils/reviewStats.js` | Pure `reviewStats(appointments)` | nothing |
| `components/booking/ReviewBlock.jsx` | One submitted review (existing) | nothing |
| `components/booking/ReviewSummary.jsx` | Two reviews side by side | `ReviewBlock` |
| `components/booking/ReviewForm.jsx` | The form (existing, unchanged) | nothing |
| `pages/ReviewPage.jsx` | Route shell: load, validate, submit, navigate | the three above |
| `pages/SupportReviews.jsx` | Reviews tab | `reviewStats` |

### Route

`/review/:id/:side`, where `:side` is `client` or `support`. Registered outside
the `/support` tab shell so it renders full-width on both sides.

Using one route with a `:side` segment — rather than two routes — is what makes
"both sides the same" true by construction: there is one component, and the side
only decides which review slot is written and where Back returns to.

### Entry points

**Client chat.** The message that currently carries `reviewFor` (rendering a
form inline) instead carries `reviewCta` with the appointment id, and
`ChatWindow` renders a button. `useChatBot.sendReview` is removed, along with
the `reviewConfig` and `onReviewSubmit` props on `ChatWindow`.

**Support thread.** The inline `ReviewForm` and the two `ReviewBlock`s are
replaced by the same button.

The button reads "Give your review" until that side has submitted, then "View
reviews" — it opens the same page either way.

### Page states

1. **Meeting not `done`** — an explanatory line, no form. Reviews only make
   sense after the call.
2. **This side has not reviewed** — header plus `ReviewForm`.
3. **This side has reviewed** — header plus `ReviewSummary`.

The header shows the appointment id, category, both participants, the slot, and
the average rating so far.

`ReviewSummary` labels the current side's card "Your review" and the other
"<Name>'s review", so the same component reads correctly from either side. The
other side's card shows a waiting state until they submit.

### Reviews tab

`/support/reviews`, a new sub-tab beside Inbox, Calendar, Dashboard and Metrics.
Header shows the average rating, how many meetings are fully reviewed, and how
many are still awaiting one. Below it, a row per completed meeting with the
client, category, and each side's rating or a "waiting" marker. A row opens
`/review/:id/support`.

`reviewStats(appointments)` returns `{ reviewed, awaiting, average }` where
`reviewed` counts meetings with **both** reviews in, `awaiting` counts completed
meetings missing at least one, and `average` is the mean of every submitted
star rating — both sides pooled — rounded to one decimal. An empty list returns
zeros rather than `NaN`.

## Error handling

| Condition | Behavior |
| --- | --- |
| Appointments still loading | Render nothing until the context has data |
| Unknown appointment id | Redirect to `/chat` or `/support` by side |
| `:side` is not client/support | Redirect to `/support` |
| Meeting not yet `done` | Explanatory state, no form |
| Already submitted by this side | Summary view; submitting is one-way |
| No reviews yet on the tab | Empty state, not a zero-row table |

## Testing

`server/test-review-stats.js`, run via `npm run test:reviews`:

- Empty list returns zeros and does not divide by zero
- Only client reviewed counts as awaiting, not reviewed
- Both sides reviewed counts as reviewed
- Average pools both sides' stars
- Average rounds to one decimal
- Appointments that are not `done` are excluded from both counts

## Out of scope

- Editing or deleting a submitted review
- Free-text comments; the form stays three options plus stars
- Reviews for anything other than completed appointments
