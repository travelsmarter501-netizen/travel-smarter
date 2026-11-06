# Hybrid planner: rules engine + optional AI — proposal (2026-11-06)

Status: **proposal only.** Nothing here is built. No API is connected, no paid request was made, and prices, buyer rights and the database are unchanged. City expansion is paused until the owner decides on this proposal. Barcelona and Prague (engine-ready, not public) keep working exactly as they do today.

## 1. What the engine already does, and what really needs AI

The current engine (`app/lib/planner/v2CityPipeline.ts` + a city module) is deterministic, needs no external service, costs nothing per plan, and is covered by audits. It already does:

| Job | How, today |
|---|---|
| Pick places for the chosen interests | Weighted scoring over 6 interest weights, coverage goals, flagship "must-see" guarantees, similarity caps |
| Build days that make geographic sense | Area (cluster) compatibility, max 3 areas / 5–6 stops / 420 minutes per day, route ordering, cross-day and reclaim passes |
| Respect real opening hours and dates | Hard exclusion on verified closed weekdays, a final safety net, a timed day schedule fitted to verified hours |
| Meals | Breakfast / lunch / dinner chosen by area fit, hours and variety, never invented |
| Transport | Checked tables (Barcelona) or labelled distance estimates (Prague) |
| Accommodation | Geocoder + keyword fallback, day ordering around the stay |
| Honesty | Capacity / density warnings, operational warnings, "approximate time" labels |

Where AI adds something the engine cannot do:

| Need | Engine today | AI value | Also needs |
|---|---|---|---|
| **Free-text wishes** ("أبوي ما بقدر يمشي كثير", "بدنا إطلالات", "ما بدنا متاحف كثير") | Not possible: only 6 interest groups + Surprise Me | **High**: turns a sentence into settings the engine already understands | A new optional free-text question (≤300 chars) |
| **Personal wording** (day titles, "why this suits you" per stop) | Templates: "محطات اليوم: A، B وC" | **Medium**: warmer, more personal plan | Nothing new; uses facts already in the data |
| Edit by sentence ("خفّف اليوم 2", "بدّل المتحف بحديقة") | Edit = refill the questionnaire | Medium | Same settings as above; per-day lock in the engine |
| Picking places, routes, hours, meals, prices | Done, verified | **None / harmful**: an AI would only add risk here | — |
| Halal food, walking difficulty (stairs, hills), child-friendliness, budget | Not in the data | **AI cannot fix this**: it would have to guess | Verified per-place data first (see section 7) |

Conclusion: AI is useful in two narrow places, translating wishes into engine settings, and wording. Everything that must be true (places, times, hours, routes, prices) stays with the engine.

## 2. Where to add AI with the least change

```
answers ──► [A] wishes → settings (optional AI) ──► ENGINE (unchanged rules) ──► validated plan ──► [B] wording (optional AI) ──► saved plan
                         ▲ closed list of place ids                                               ▲ facts from the plan only
```

**Call A — wishes → settings.** One call before the engine, in `generateCityPlanV2` (`v2CityPipeline.ts`), only when the customer wrote a wish. It returns JSON that maps onto hooks the engine **already has**:

| AI field | Engine hook | Exists? |
|---|---|---|
| `preferPlaceIds` / `avoidTags` | `dayBuilderConfig.placeSelectionBonus` (per request) | Yes |
| `excludePlaceIds` | `dayBuilderConfig.isPlaceEligibleForDay` (per request) | Yes |
| `mustIncludePlaceIds` | `PlannerPreferences.mustVisit` (guaranteed by the Day Builder) | In the engine; not yet passed by the V2 pipeline (one line) |
| `pace` (relaxed / normal / full) | Max stops and minutes per day | **No**: today they are constants in `plannerDayBuilder.ts` (5–6 stops, 420 min). Small change: make them per-request config, defaulting to today's values; prove Barcelona unchanged with the existing 87-plan snapshot |
| `walking: low` | Prefer public transport above ~10 min; skip places marked as stair-heavy | Partly: needs a per-place "effort" field (data) |

**Call B — wording.** One call after `resolveV2Plan`, on the compact plan skeleton. It writes `title` / `summary` per day (fields that exist) and one new optional `personalNote` per stop (optional, so old saved plans still open). Any rejected line falls back to today's template text.

**Prague example (real catalogue, real plan).** Wish: «مسافرين أنا وأهلي، أبوي ما بقدر يمشي كثير، بنحب الإطلالات والصور، وبدنا أكل حلال إذا في، وما بدنا متاحف كثير.»

Call A input: the instructions, the 43 Prague place ids with name / area / visit length / top tags (one line each), and the wish. Expected output:

```json
{ "pace": "relaxed", "walking": "low", "avoidTags": ["museum"],
  "preferPlaceIds": ["letna-park", "vysehrad", "riegrovy-sady", "zizkov-tower"],
  "excludePlaceIds": ["petrin-tower", "old-town-bridge-tower"],
  "mustIncludePlaceIds": [],
  "unsupported": ["أكل حلال: ما عنا بيانات حلال موثقة لبراغ"] }
```

What happens next is all engine: fewer stops per day, views boosted, the two climbs the data documents (Petřín Tower: 299 steps; Old Town Bridge Tower: long narrow stairs) removed. Other towers stay, because the data says nothing about their stairs; that gap is exactly what the per-place effort field in section 7 fills, and hours and closures still enforced. The halal wish is **not** faked: the plan says plainly that this data is missing. Prague's only Lebanese restaurant (U Cedru) can be boosted, but the plan must not call it halal.

## 3. Stopping invention, and checking the output

1. **AI never writes places, times, prices or hours.** Call A can only return place ids from an `enum` built from the city's catalogue (structured outputs: `output_config.format` with a JSON schema; the model cannot emit an id outside the list). Call B's JSON is keyed by the ids in that plan only.
2. **The engine re-validates everything.** Settings from call A are just inputs: the engine still applies closed days, hours, area limits and the final date safety net. The existing audits keep running on the result.
3. **Wording checks (call B), each line rejected on failure (template text is used instead):**
   - no digits (Arabic or Latin) → no invented times, prices or distances;
   - no hours / price / distance words (ساعة، دقيقة، مفتوح، مغلق، CZK، يورو، كم، …);
   - every Latin word must belong to a place name in that day;
   - length limits;
   - no superlatives from a block list ("الأفضل بالعالم"…).
4. **Never block the plan.** Bad JSON or a failed check → that part is dropped, and the plan is saved exactly as today.
5. **Offline evaluation before any launch:** ~40 test wishes (dialects, English, mixed; adversarial ones such as "ضيف ديزني لاند", "اليوم 2 من الساعة 5 الصبح", "كل شي مجاني"). Measure:
   - schema-valid 100%;
   - unknown ids 0;
   - constraints respected (excluded places absent, must-includes present);
   - Prague / Barcelona audit metrics unchanged (closures 0, hours 0, duplicates 0);
   - wording-check pass rate;
   - a human read of a sample.

   Cost of one evaluation run: about $4 on Opus 5.5 at the figures below; it needs the owner's approval first.

## 4. Expected cost (measured request sizes)

Sizes measured from real Prague plans (script: built from engine output, no API call). Token counts are **estimates** (Latin ≈3.5 chars/token, Arabic ≈1.5 chars/token, conservative); confirm them with the free token-counting endpoint before deciding.

| Call | Input tokens | Output tokens |
|---|---|---|
| A — wishes → settings (43-place catalogue + wish) | ~1,030 + ~1,500 fixed instructions | ~100 + reasoning |
| B — wording, 3 days / 16 stops | ~1,140 + ~1,500 | ~1,270 + reasoning |
| B — wording, 5 days / 26 stops | ~1,750 + ~1,500 | ~2,080 + reasoning |
| B — wording, 10 days / 37 stops | ~2,440 + ~1,500 | ~3,260 + reasoning |
| *(for comparison) sending the whole saved plan* | 17,000–43,000 | — |

The design choice matters: sending the compact skeleton instead of the stored plan JSON makes input 10–15× smaller.

Per generation (A + B), including reasoning at low effort and a 10% retry allowance. Typical = 5 days, ~5.8K in / ~3K out. High = 10 days, ~6.5K in / ~6K out.

| Model (price per 1M tokens in / out) | Typical | High |
|---|---|---|
| Claude Opus 5.5 ($4 / $20) | $0.092 | $0.161 |
| Claude Sonnet 5.5 ($2 / $10) | $0.046 | $0.080 |
| Claude Haiku 5.5 ($0.10 / $0.50) | $0.0023 | $0.0040 |

Per customer (USD → ₪ at an assumed 3.7; prices from Anthropic's published table dated Oct 2026, to be rechecked):

| Generations per customer | Opus 5.5 | Sonnet 5.5 | Haiku 5.5 |
|---|---|---|---|
| 10 | ₪3.4 – ₪5.9 | ₪1.7 – ₪3.0 | ₪0.09 – ₪0.15 |
| 30 | ₪10.2 – ₪17.8 | ₪5.1 – ₪8.9 | ₪0.26 – ₪0.45 |
| 100 | ₪33.9 – ₪59.4 | ₪16.9 – ₪29.7 | ₪0.85 – ₪1.49 |

Notes:
- Batch processing halves the price but takes up to hours, so it does not fit a customer waiting on the generating screen.
- Caching helps little at low traffic: the fixed instructions are short and the cache expires after minutes.
- Model choice is the owner's decision and must follow the quality evaluation, not price alone. Call A (structured extraction) and call B (Arabic writing) may need different models; that, too, is settled by the evaluation.

## 5. Keeping ₪39 viable: separate access from AI usage

₪39 includes VAT, and Allpay's commission is not in this document (unknown here). Today a buyer can regenerate and edit without limit (the cap is 30 **saved** plans, not generations), so an unlimited AI feature has an unlimited cost. Proposal:

- **What the purchase grants does not change:**
  - access to every supported city;
  - 30 saved plans;
  - unlimited engine-only creation and editing (cost ₪0).

  No existing buyer loses anything.
- **AI personalization is a separate allowance per purchase**, for example N AI-assisted generations (a business decision). With Opus 5.5 at the high estimate: 10 cost ~₪6, 30 cost ~₪18; Sonnet 5.5 costs half that. After the allowance is used, plans are still built and edited by the engine as today, without the wish text and personal wording. The allowance is spent only when an AI call **succeeds**.
- **Counting needs a small ledger table** (one row per AI call: user, request, model, tokens, cost, outcome) and a check in the generation path. That is a database change: it would be prepared as a migration and explained before anyone applies it. It is not made now.
- **A global monthly budget** (environment setting + the provider's spend limit). When it is reached, the AI steps switch off for everyone; nothing else changes.

## 6. When AI is down or the budget runs out

- One switch, `PLANNER_AI_MODE = off | wording | full`, default `off`. With `off` the site is byte-for-byte today's product.
- Each call has a timeout of ~10 s inside the existing "building your plan" screen, at most one retry, and a circuit breaker (after repeated failures, skip AI for 15 minutes).
- Any failure (timeout, refusal, bad JSON, failed checks, quota or budget used up) → the engine plan is saved as today. The customer sees at most one short line ("التخصيص بالنص مش متاح حاليًا، بنينا خطتك من إجاباتك"), never an error, and is not charged allowance.
- The wish text is stored with the answers, so the plan can be regenerated with AI later.

## 7. What needs extra data or new questions (with or without AI)

| Wish | Missing today | Source |
|---|---|---|
| Little walking / older travellers | Per-place effort (stairs, hills, accessibility) | prague.eu and venue pages publish accessibility notes for many places |
| Halal food | Verified halal status per restaurant | The restaurants themselves; prague.eu marks none |
| With children | Child-friendliness per place | Venue pages ("suitable for children" exists on some prague.eu entries) |
| Budget | Restaurant price levels (omitted for Prague) | Menus / official pages |
| Rain / cold | Indoor vs outdoor per place | Derivable from the data with a review |
| Pace | A question (relaxed / normal / full) | New question |

**Comparison without AI.** Three short structured questions (pace, walking, children), plus the data above, would deliver most of the practical benefit deterministically and at no running cost. What only AI adds is free-text understanding and personal wording. A sound order:
1. (optional) structured questions + data;
2. AI wording;
3. AI wishes.

Each step is measured before the next.

## 8. Decisions for the owner

1. Is AI wanted at all, or are structured questions + data enough for now?
2. If yes: which call first (wording or wishes), and the allowance N per purchase.
3. The model per call, after the evaluation. The evaluation run itself (~$4 per run) needs approval.
4. A privacy-policy update: the wish text would be sent to an AI provider. Personal data (names, emails) is never sent.
5. When to resume adding cities (paused until this decision).
