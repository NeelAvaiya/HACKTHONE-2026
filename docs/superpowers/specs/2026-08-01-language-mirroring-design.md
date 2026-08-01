# Language Mirroring in AI Answers

**Date:** 2026-08-01
**Status:** Implemented

## The problem this solves

A client asked "attendance kya hai" and the bot refused outright — it returned
`NOT_COVERED` and pushed them toward booking an appointment, even though the
help docs cover attendance. The docs are in English, the question was in Hindi,
and the strict docs-only prompt treated "not written in English" as "not in the
docs".

Refusing a question you can answer is worse than answering it imperfectly.

## Scope

**Only the AI's own answers mirror the client's language.** Everything else —
the meeting summary, booking confirmations, module questions, review forms, the
support inbox, the calendar, the meeting room — stays English.

This deliberately replaces an earlier, larger design that translated the whole
`botScripts` copy into three languages. That work was reverted: it tripled the
copy to maintain for parts of the product nobody asked to translate.

| Question | Decision |
| --- | --- |
| What mirrors | The AI's replies, and the local small-talk replies |
| What stays English | All scripted flow copy, summaries, and the support side |
| Languages | English, Hindi in Latin script, Hinglish |
| Detection | Local pure function, no API call |
| Switching | Only a typed message carrying a signal changes the language |
| Greetings | Answered locally, never routed to booking |

**"Hindi" means Hindi written in Latin script** ("attendance kya hai"), not
Devanagari — that is how people type in this product. Devanagari input is still
accepted and treated as Hindi.

## Language detection

`src/utils/detectLanguage.js` — pure, returns `'en' | 'hi' | 'hinglish' | null`.

- Devanagari characters present -> `hi`
- Hindi words present (word-boundary matched) and **no** English words mixed in
  -> `hi`
- Hindi words present **with** English words mixed in -> `hinglish`
- No Hindi, three or more words -> `en`
- Anything else -> `null`

Product nouns (`payslip`, `payroll`, `login`, `attendance`, `leave`) are
excluded from the "English words" count. Everyone says those in English no
matter which language they are speaking, so counting them would make every real
question Hinglish.

Words that are also ordinary English — `the`, `salary`, `mat`, `so` — are
deliberately kept out of the Hindi list. Any one of them would misread most
English sentences as Hindi. Matching is on word boundaries for the same reason:
substring matching reads "Karnataka" and "market" as Hindi because they contain
"kar".

### Why `null` matters

`null` means "no signal", and the caller keeps the language it already had.
After a Hindi question the client answers `9` to pick a slot, or taps the
`Payroll` chip. Neither carries a Hindi signal. Treating them as English would
flip the conversation to English exactly when the booking is being confirmed.

Chip taps never change the language at all — only typed messages do.

## Server changes

`BASE_PROMPT` is rewritten around three rules:

1. **Language** — reply in the same language the user wrote in, keeping product
   menu names (Attendance, My Payroll, Payslips) in English because they are
   literal labels in the product.
2. **Greetings** — answer warmly, never `NOT_COVERED`.
3. **Coverage** — `NOT_COVERED` only when the docs genuinely say nothing about
   the topic. The prompt states explicitly that *the language of the question
   never decides this*, which is the rule that was missing.

The detected language is also passed from the client and prepended to the
message as an explicit instruction — a short question gives the model little to
infer from, and it follows a stated instruction more reliably.

`PROMPT_VERSION` goes to **3** so answers cached under the old English-only
prompt are not served.

### Cache changes

The `qa` cache key gains `lang`. Without it the first English answer to a
question would be replayed to someone who asked in Hindi. Index becomes
`{ normalized: 1, lang: 1 }`.

**Refusals are no longer cached.** Previously a `NOT_COVERED` result was stored,
which made a single borderline refusal permanent for that phrasing — the model
would happily answer the same question on a retry, but the cache kept saying no.
Only successful answers are written now. Existing `covered: false` rows were
deleted.

## Small talk

`matchSmallTalk` in `src/utils/matchIntent.js` recognises greetings, thanks and
goodbyes in all three languages and returns which reply fits, or `null`.

It only fires on messages of five words or fewer: "hi my payroll run failed for
the whole company" is a support request that happens to open with a greeting,
not small talk. Matching is on whole words, since "hi" appears inside "this",
"which" and "high".

The four replies live in `botScripts.smallTalk`, keyed by language. These are
the bot answering, so they mirror — they are the one exception to "everything
else stays English". Anything conversational the list misses still reaches
Gemini, whose relaxed prompt answers it.

## Module matching

`matchModule` gains romanised Hindi aliases: `vetan` and `tankhwah` for Payroll,
`chhutti` and `haazri` for HRMS. The module keys stay in English — they are
product menu names.

`parseSlot` already handled `baje`, `kal` and `aaj`, so it needed no change.

## Error handling

| Condition | Behavior |
| --- | --- |
| Message carries no language signal | Keep the current language |
| Unknown `lang` value from the client | Falls back to the English hint |
| Gemini unreachable | Scripted fallback reply, in English |
| Model refuses a covered topic | Not cached, so a retry can succeed |

## Testing

`server/test-language.js`, run via `npm run test:lang` — 45 checks covering:

- Detection across all three languages
- Word-boundary safety: "Karnataka", "market", "nagpur", "household"
- `null` for `9`, `ok`, `Payroll`, empty and whitespace input
- Stickiness: a Hindi conversation survives `Payroll` and `9` replies, then
  switches back on a clear English sentence
- Small talk matched in all three languages, and real questions **not** matched
- Module aliases in all three languages

Verified against the live API as well: "attendance kya hai" now returns a Hindi
answer, the same OD question in Hinglish returns the correct
`Attendance → My OD & Remote Work` path in Hinglish, and an off-topic question
returns `NOT_COVERED` in both English and Hindi — coverage no longer depends on
language.

## Out of scope

- Translating the scripted flow copy, summaries, or the support side
- Any language beyond these three
- A manual language switcher
