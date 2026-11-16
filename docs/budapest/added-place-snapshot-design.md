# Added places in saved plans: keep the data used at the time of the add (design, 2026-11-16; NOT implemented)

**Target (owner):** a place the customer adds keeps a copy of its details and the hours used when it was added, with the data date or
version. Its schedule never changes silently because the plan was opened after a data update.

## 1. How it works today (read from the code)
- **Stored row** (`smart_planner_saved_plans.generated_plan_json`): `{ plan: <generated plan>, customizations: { "<day>": { startMinutes?, order?, durations? } } }`.
  - `customizations` holds ids and numbers only (`sanitizeCustomizations`).
  - It is written by the server action `customizeSavedPlan` through `replace_owned_plan_content` after `decidePlanChange` accepted the change.
- **On every open** (`applyPlanCustomizations` → `buildDay`), each edited day is rebuilt:
  - a place of the generated day uses its stored stop (stored hours);
  - **an added place** is resolved from the **current** city data for that day's date (`resolveStop(cityForAddedPlaces(...))`, `tripHoursForAddedPlaces`). Its per-day hours record (`dayPlaceDetails`) is also recomputed.
- **Consequence:** after a data update (hours, a closure, a season), an added place can get different hours on the next open. Its visit, the visits after it, lunch and the notes can then move with no action by the customer.

## 2. Smallest change
1. **Snapshot at the add:** when `decidePlanChange` accepts an `add`, it puts into the day's edit:
   `added: { "<placeId>": { stop, details, dataVersion, addedOn } }`
   - `stop` is the resolved stop as `buildDay` uses it (hours for that date, duration, visit mode, warnings).
   - `details` is the place-details record for that day (what the details sheet shows).
   - `dataVersion` is a per-city constant, e.g. `BUDAPEST_DATA_VERSION = "2026-11-16"`, changed whenever place data changes.
   - `addedOn` is the date of the edit.
2. **Rebuild uses the snapshot:** `buildDay` takes the stop of an added place from `edit.added[id]` when present, exactly as it takes a generated place from the stored base. `applyPlanCustomizations` takes its details / day hours from the same snapshot. Current data is not read for it.
3. **Lifecycle:**
   - **Remove:** drops the snapshot.
   - **Re-add:** takes a new one.
   - **Duration, order, start changes:** keep it.
   - **Resetting the day:** drops it.
4. **Validation** (`sanitizeCustomizations`):
   - `added` is kept only for ids that are in that day's `order`;
   - shape check (an hours object of a known type, numbers in range, strings of bounded length);
   - a size cap per day (e.g. 16 KB).
   - The snapshot is written only by the server (the client never sends customizations), but the stored JSON is still checked when read.
5. **Opt-in per city:** `CityPlannerModule.snapshotAddedPlaces`, set by Budapest. Prague and Barcelona are unchanged.

## 3. What does not change
- **Storage:** no table, column, RLS policy or RPC change. The snapshot lives inside the existing `generated_plan_json` (JSON object, no size check in `replace_owned_plan_content`). No migration, no rewrite of stored rows.
- **Generated places:** they already use stored data; unchanged.

## 4. Effect on existing saved plans
- **Plans with no added place, or of other cities:** nothing changes.
- **Budapest plans saved before the change** (only test plans exist; Budapest is not public):
  - added places have no snapshot and keep today's behaviour (current data on open);
  - on the next accepted change to THAT day, the server takes the snapshot of the day's added places from the data of that moment, which then stays;
  - nothing is rewritten when a plan is only opened.
- **Size:** about 3–5 KB per added place (stop + details). A 7-day plan is about 177 KB today; ten added places add about 40 KB.

## 5. Customer-facing
- No new text is needed for the rule itself.
- **Optional, later (owner decision):** when `dataVersion` of a snapshot is older than the city's, the details could say "hours as of <date>" and offer an explicit refresh. Not part of the smallest change.

## 6. Tests to write with it
- **Add a place, then change its hours in a test copy of the data, then reopen:** the schedule and details are the snapshot's.
- **Remove + re-add:** new snapshot. **Duration / order / start change:** snapshot kept.
- **An old stored row without `added`:** same as today; after one change to that day, a snapshot exists.
- **Tampered stored JSON** (unknown hours type, oversize, id not in order): dropped by sanitize, the day falls back to today's behaviour.
- **Prague / Barcelona:** the edit regression stays byte-identical to 925512d.

**Not blocking the Preview:** the Preview can run with today's documented behaviour (research section 23.7).
