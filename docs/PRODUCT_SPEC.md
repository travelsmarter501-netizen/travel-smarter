# Travel Smarter — Product Spec

Last verified against the code: 2026-11-03, base commit `e9e5084` plus the uncommitted phase 3 homepage work on branch `feature/homepage-single-product`.

This file separates three things so they are never mixed up:

1. **Confirmed decisions** — what the owner has decided.
2. **Current implementation** — what the code does today (verified by reading the code; "not runtime-tested" is stated where it applies).
3. **Open decisions** — things nobody has decided yet. Do not invent answers.

Paths are relative to the repo root. Prefer function and file names over line numbers, which drift.

---

## 1. Confirmed decisions

- The public sales presentation focuses on **one product: personalized travel planning**.
- Price stays **₪39, one-time** (Allpay, ILS).
- One purchase should give access to **all supported cities**. There is no per-city charge.
- Customers keep the ability to **create and edit multiple plans**, with the current maximum of **30 saved plans per customer**. Never describe this as unlimited.
- **Barcelona is the only supported destination today.**
- Target destinations: Barcelona, Rome, Prague, Budapest, Dubai, Batumi, Istanbul, Vienna, Paris, London. These are targets, not a claim of support.
- A destination stays unavailable until its data, generation, saving, viewing and quality checks are ready.
- Priority: a simple **mobile-first** experience. A visitor should quickly understand the product, what they receive, the price, and the next step.
- **Existing buyers keep access to what they bought** when the public presentation is simplified (1-day, 3-day, 5-day plans and the Barcelona Guide stay accessible to their owners).

## 2. Current implementation (facts)

### 2.1 Customer journey

1. Homepage (`app/page.tsx`; **implemented locally on branch `feature/homepage-single-product`, not yet committed or deployed**). It sells ONE product and every start button opens `/planner?new=1` (`app/components/home/homeOffer.ts`; the planner page keeps its claim-purchase safeguards). Order:
   1. Minimal header (`Header.tsx`): the logo and one compact menu (video, price and FAQ links, "My plans" for signed-in customers, account / sign in, language and currency). There is **no cart icon or cart drawer** in the header any more; `CartWidget.tsx` is simply not mounted. The cart data, `/checkout` (also `/checkout?product=...`) and all legacy product routes are untouched.
   2. Product video (`Hero.tsx`, `home/HomeVideo.tsx`): heading "شوف كيف بتكون خطتك" (the page's h1), the line "questions are free, payment comes after", then a click-to-play 4:5 video (`public/video/plan-demo.mp4`, 877 KB, no audio track, `preload="none"`, poster `public/video/plan-demo-poster.jpg`). It is a **real screen recording of the existing product UI** (see 2.9). A play button is added after hydration (native controls appear after the first play and are there from the start without JavaScript); if the file cannot load, the poster stays and an honest line says so.
   3. Visual offer (`home/HomeOfferVisual.tsx`): "خطتك، على طريقتك", the one-line description, "أماكن، مطاعم وتنقّل — مرتّبين يوم بيوم", the "available now for Barcelona" pill, and a static strip of the three real sample stops (photos, start times and the two real transport labels).
   4. Free example (`home/HomeExample.tsx`): badge "مثال مجاني", an explanation that it is a ready-made example and not the customer's plan, its inputs listed as plain facts (Barcelona, 3 days, culture & history + food, accommodation not booked; none of them is a control), and a native `<details>` entry "جرّب مثال" that reveals the day-1 excerpt with one openable place. No questionnaire fields are duplicated on the homepage.
   5. Compact price (`home/HomePricing.tsx`): the price from `PLAN_PRICE_ILS` through the shared `Price` component (follows the selected currency), multiple plans / editing / 30 saved plans, all supported cities (currently Barcelona), the Barcelona guide included. No purchase button inside the card (the floating button is the purchase action). No struck-through ₪59.
   6. Four essential FAQ answers as native `<details>` (`FAQ.tsx`: what is included, how to open the plan, more than one plan, bookings and tickets are not included) plus the support email and the existing refund terms link (`/terms-of-service`).
   7. Minimal footer (`Footer.tsx`): email, account, privacy, terms and copyright.
   - Copy for all of this is in `app/lib/homepageTranslations.ts` (`home`, `faq`, `nav`, `footer`, `seo`), Arabic and English together; Arabic is short, familiar and conversational ("شو"، "وين"، "هاد") without slang in legal text.
   - The example plan is an explicit public allowlist (`app/lib/home/homeSamplePlan.ts`): day 1 of a synthetic plan (3 days, culture + food, accommodation not booked) produced locally by the real engine; three stops, two transport legs, and details for one place. It is a snapshot: regenerate it the same way if the engine or Barcelona data change materially.
   - A floating purchase button exists on the homepage only (`home/HomeBottomCta.tsx`): non-owners see "اشترِ الآن | <price>" (same price source and currency formatting as the price card), owners see "اعمل خطة جديدة" without a price. It is not rendered until the session is known (an owner never sees purchase wording), hides while a modal / bottom sheet / menu is open, respects the iPhone safe area, never animates, and sets `data-home-cta` on `<body>` so the footer gets extra bottom padding (`app/globals.css`). The older `StickyCTA` (`components/detail/StickyCTA.tsx`) is a different thing: a mailto bar on the legacy guide / package detail pages.
   - Motion (CSS only, `home/RevealOnScroll.tsx` + `globals.css`): sections below the fold fade in and rise 14px once when reached (0.4 s). Everything is visible without JavaScript, with `prefers-reduced-motion`, and when printing. Buttons have a small press feedback (disabled for reduced motion).
2. Questionnaire at `/planner` (`app/planner/page.tsx`, `app/components/planner/PersonalizedPlanWizard.tsx`). Free, no sign-in needed, nothing is generated. Answers are kept in this tab's `sessionStorage` (`app/lib/planner/plannerDraft.ts`).
3. Checkout at `/checkout?plan=personalized` (`app/components/planner/PersonalizedPlanCheckout.tsx`): summary, a guest email field (guests only), Allpay button. `startPersonalizedPlanCheckout` in `app/planner/actions.ts` re-validates the answers on the server and creates the order plus the stored answers in one SQL transaction.
4. After payment: a signed-in buyer goes `/checkout/success` -> `/planner`. A guest returns to `/claim-purchase?token=...`, signs in or signs up, and the order is attached to the account (claim link, or automatic recovery by verified email), then goes to `/planner`.
5. At `/planner` a "ready to build" card appears. **The customer must press "ابنِ خطتي" to generate the plan** (`app/components/planner/MyPersonalizedPlans.tsx`). Generation does not start automatically after payment.
6. The plan is viewed at `/smart-planner/barcelona-v2/saved/<id>` (sign-in required).
7. Returning customers: `/planner` ("My Personalized Plans": open, edit, delete, create new) and `/account`.

### 2.2 Questionnaire (four steps, all required)

| Step | Field | Values / defaults |
|---|---|---|
| 1 | Destination | 10 cities listed; only Barcelona is selectable; default Barcelona |
| 2 | When | Flexible (1–10 days, default 3) or specific arrival/departure dates (1–10 days inclusive) |
| 3 | Interests | 6 display groups (popular, culture & history, nature & beaches, food, shopping, experiences & entertainment) or "Surprise me"; at least one |
| 4 | Accommodation | Hotel / apartment / not booked; free text (max 150 chars) required when booked |

Server-side validation and the stored shape: `app/lib/planner/personalizedPlanAnswers.ts` (`normalizePersonalizedAnswers`).

**Not asked:** pace, budget, number of travelers, companions, children.
**Collected but not used:** hotel vs apartment. Both are stored as `booked: true` with the text, and an edit re-opens as "hotel".

### 2.3 What the answers actually change (from `app/smart-planner/barcelona-v2/actions.ts`; not runtime-tested)

- **Days:** number of generated days. Capacity and density warnings appear when content is insufficient.
- **Specific dates:** weekday-based closures are respected and repaired; a beach-timing guard runs. **Flexible mode uses no dates at all.**
- **Interests:** mapped to the internal scoring model for the main stops. Food, shopping and nightlife also drive separate suggestion lists. "Surprise me" is a fixed, deterministic preset. The football/experiences group is Barcelona-specific.
- **Accommodation:** the text is geocoded (Geoapify; fallback is a keyword cluster) and, if resolved, the start of the trip is ordered around that area. If unresolved, the plan is built without it and the customer is told.

### 2.4 What the customer receives

- Generated by a **deterministic algorithm on curated, hand-maintained data. No LLM / AI is used.** The only external call is Geoapify geocoding of the accommodation text.
- Day tabs; a timed schedule per day; place cards and meal stops; transport connectors between stops (mode and minutes) and a per-day total transit time; food, shopping, nightlife and nearby suggestions; free-time blocks; capacity/density warnings.
- Place details sheet: address (copyable), weekday-aware opening hours, rating, price information, place phone, Google Maps and Apple Maps links.
- The Barcelona Guide is included with a Barcelona plan.
- **Not implemented:** PDF/download, print, sharing, total trip cost, in-plan editing (editing is done from "My plans" by re-running the questionnaire), built-in ticket booking.
- The plan view follows the site language: **Arabic, English or Hebrew** (phase 5L, `docs/PROJECT_PLAN.md`). The stored plan is never changed; `app/lib/i18n/localizePlan.ts` translates a display copy from reviewed translations in `app/lib/i18n/planCatalog.ts` and `planText.ts`. Stops, order, times, prices and links are identical in every language; a stored text without a reviewed translation is shown as stored. Barcelona transport notes are stored in English and shown in English in every language. The title names the plan's own city.

### 2.5 Price, payment, access

- Product slug `travel-smarter-personalized-plan`, ₪39 (database `products.price_ils` is the only authoritative price; `app/lib/commerce/pricing.ts` is display-only and also holds a ₪59 "reference" price shown struck through).
- Display note (2026-11-03): the personalized checkout summary and the homepage no longer show the struck-through ₪59 reference; `referencePriceIfDiscounted` remains in the code for legacy surfaces.
- Allpay payment page (language fixed to Arabic); the signed webhook verifies signature, amount, currency and status before granting anything. Pending or unpaid orders grant nothing.
- Ownership is **product-level and destination-independent**: the SQL function `user_owns_personalized_plan` (`supabase/migrations/20261018120000_personalized_planner_ownership.sql`) is true for an entitlement row or a paid order containing the product. Owners create/edit/delete plans with no payment; limits: 30 saved plans and one generation at a time (3-minute lease).
- Complimentary (no-payment) plans exist only for user ids in the server env `COMPLIMENTARY_USER_IDS`.
- Guests can buy without an account; the order is claimed by claim link or by automatic recovery using the verified account email (`app/lib/commerce/recoverGuestPurchases.ts`).
- The other four products (1-day, Guide, 3-day, 5-day) remain sold, gated by entitlements, and must stay accessible to their owners.

### 2.6 Destinations

| Layer | State |
|---|---|
| UI | All ten cities are listed in `app/lib/planner/plannerDestinations.ts`; only Barcelona has `available: true` (public). Prague is engine-ready but **not public** |
| Server | A destination is accepted only if it is enabled (`isAvailablePlannerDestinationId`: `available: true`, or the local-only preview switch below) **and** has an engine module (`app/lib/planner/cityPlannerRegistry.ts`). In production only Barcelona passes |
| Engine | Multi-city since 2026-11-05 (local, uncommitted): one pipeline (`app/lib/planner/v2CityPipeline.ts`) driven by a per-city `CityPlannerModule` (`cityPlannerModule.ts`). Modules: Barcelona (`barcelonaCityModule.ts`, same data and rules as before; output proven byte-identical on 87 plans) and Prague (`prague/`) |
| Saving | One planner tag for every city (`product_slug = 'barcelona-smart-planner-v2'`, which the 30-plan cap and edit/delete rules key on) and the city in `destination_slug`, `preferences_json.destinationId` and `generated_plan_json.plan.destination`. Old Barcelona rows are unchanged and still valid. Editing a plan keeps its city. No database change |
| Database | `personalized_plan_requests.destination_id` accepts any slug by pattern; adding a city needs no schema change |
| Data | Barcelona: full guide (`app/lib/barcelona-guide.ts`), planner metadata, checked route-leg tables, accommodation clusters and policies. Prague: planner data only (no guide), see 2.6a. Other cities: short static stubs in `app/lib/guides-data.ts` / `packages-data.ts` only |

**Local preview switch (testing only).** `NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS=prague` in the environment of a local `next dev` / `next build` makes Prague selectable (marked "معاينة محلية") and accepted by the server. The server ignores it whenever `VERCEL` is set, so it can never open Prague in production even if the variable were added there by mistake (checked: refused with no switch and with the switch + `VERCEL=1`). Do not set it on Vercel. Public availability is only ever the `available` flag.

The saved-plan URL stays `/smart-planner/barcelona-v2/saved/<id>` for every city so old links keep working; the page title and header now name the plan's own city.

### 2.6a Prague (engine-ready, not public; data verified 2026-11-05)

- **Content:** 43 main places in 13 walkable planner areas (Hradčany, Malá Strana, Petřín, Old Town, náměstí Republiky, Josefov, New Town, riverside, Vyšehrad, Žižkov/Vinohrady, Letná, Holešovice, Troja), incl. 1 seasonal river cruise and 3 shopping stops; 30 cafés/restaurants (one Lebanese); 1 evening venue. Files: `app/lib/planner/prague/praguePlaces.ts` (facts + sources), `pragueMetadata.ts` (planning judgements), `pragueCityModule.ts` (rules).
- **Sources:** each place's page on prague.eu (the City of Prague's official tourism portal): address, coordinates (the page's route link), opening hours, prices; jewishmuseum.cz and strahovskyklaster.cz for those two; Wikidata for three park/street coordinates. Every hours entry carries its source URL and `lastVerified: 2026-11-05`. Month-dependent hours are stored as the official text (`variable`), never as guessed fixed times; places without published hours have none (never assumed closed).
- **Not in the data (gaps, not invented):** restaurant price levels (omitted, the UI hides the field); halal status (prague.eu marks none; traditional Czech kitchens are tagged "may contain pork"); images (rights not cleared, cards use the existing no-image layout); day trips (Kutná Hora, Karlštejn: official hours/prices could not be confirmed); the Troja Château winter hours (not published); river-cruise prices.
- **Transport:** no checked route table exists, so every leg is an **estimate** from straight-line distance between verified coordinates (×1.3 street factor, walking 4.5 km/h, public transport offered above 20 minutes at 18 km/h + 10 min access). Shown as "تقدير تقريبي" with the note "تقدير حسب المسافة، مش من تطبيق خرائط…". The "رتبنا يومك حتى تقلّل وقت التنقل" claim (`routeFirstApplied`) is never set by estimates.
- **Interests:** no beaches, so the "طبيعة وشواطئ" group reads "طبيعة وإطلالات" for Prague (same two internal keys; relaxed parks / river banks / island); "تجارب وترفيه" = river cruise (only when chosen, seasonal warning), towers, zoo, technical museum.
- **Meals:** breakfast only at places verified open by 9:00 every day (4); lunch/dinner from Czech, Lebanese and other restaurants mapped to areas by verified address; Lví dvůr (closes 19:00) is suggestion-only. Plans without dates cannot check restaurant hours (shared engine rule, unchanged).
- **No Prague guide** is sold, promised or linked (`DESTINATION_INCLUDED_GUIDE_SLUG` still lists Barcelona only).

### 2.7 Contact

- Only an email is published: `travelsmarter501@gmail.com` (`app/lib/businessInfo.ts`; the address is shown on the legal pages only). No phone or WhatsApp number is published anywhere.
- The email string is also hard-coded in several components rather than read from `BUSINESS_CONTACT`.

### 2.8 Visual direction (homepage, header, footer)

Confirmed 2026-11-03; it supersedes the earlier dark, purple, teal and orange directions.

| Token (Tailwind utility) | Value | Use |
|---|---|---|
| page background | `#FFFFFF` | main background |
| `surface` | `#F5F7FC` | subtle section backgrounds |
| `brand` / `brand-strong` / `brand-tint` | `#2855D9` / `#1F44B3` / `#EAF0FF` | primary actions, selected states, small accents; hover; light tint |
| `ink` | `#17243B` | headings and main text |
| `muted` | `#586579` | secondary text |
| `line` | `#E3E8F1` | subtle borders |

Contrast (WCAG ratios, computed): white on `brand` 6.2:1 (8.3:1 on the hover blue), `brand` on white 6.2:1 and on `surface` 5.8:1, `ink` on white 15.5:1, `muted` on white 5.9:1 and on `surface` 5.5:1. The `line` color is decorative only; interactive outline buttons use a blue border. Focus is a 2px blue outline offset from the control.

The tokens are declared in `app/globals.css` (`@theme`) and used only by the homepage components, the header and the footer (`HomeButton`, the header menu and its language / currency switchers, the footer). Other pages still use their own teal/slate styling, so the site is intentionally not fully unified yet; the logo is unchanged. Typography stays Cairo.

### 2.8d Editorial homepage (supersedes the composition in 2.8c; 2026-11-03, local, uncommitted)

Inspired by the owner's reference video (an editorial split-screen travel hero). No copy was changed: every visible text comes from the existing translations or the public sample.

- **Palette (homepage only, scoped by `.home-editorial` on its `<main>`):** deep navy `#14233D` is the primary colour (buttons, floating purchase button, links, the example's rail), warm off-white `#F8F6F1` alternates with white, sky blue `#7DB8E6` is decoration only (dots, rules; it never carries text). The rest of the journey keeps the royal blue of 2.8b; aligning it is an open decision.
- **Typography:** homepage h1 / h2 use **Markazi Text** (an editorial Arabic + Latin serif, `--font-markazi`); body text stays Cairo. Journey pages keep Noto Kufi Arabic headlines.
- **Composition:** split hero (start side white with the oversized headline, the "questions are free" line, one start button "ابدأ خطتك" -> `/planner?new=1`, a link to the video and a small section index on wide screens; end side a large photo of Barcelona from above with a floating preview card: a thumbnail cross-fading between the gallery photos, the availability line, the sample day's title and "جرّب مثال" -> `#example`). On wide screens the headline crosses onto the photo over a white mist; on phones the text comes first and the photo follows as a rounded panel. Then: the **unchanged temporary video** (`#video`, on off-white), the offer as a gallery of real Barcelona photographs with different heights (Sagrada Família, Tibidabo, Recinte Modernista de Sant Pau; sideways scroll with snap on phones), the free example, the price, the FAQ, the minimal footer. Fixed purchase button, ownership behaviour and the no-cart rule unchanged.
- **Motion:** load sequence in CSS (photo unveiled from its inner edge and settling from a slight zoom, headline lines rising one after the other, then text, buttons and card) so the first paint never waits for JavaScript; GSAP (already installed) for the hero photo parallax, the gallery's staggered entrance, the example and price reveals and the example's stops; CSS for the card hover zoom and the thumbnail cross-fade. Framer Motion / Motion was **not** added: GSAP already covers these effects, and a second animation library would be an unnecessary dependency. Reduced motion: no load animation, no parallax, no reveals, no cross-fade, no hover zoom, `scroll-behavior: auto`.
- **Measured:** the headline's contrast against what is really behind it (headline made transparent, background compared pixel by pixel with navy) is at least 11:1 for 99% of the pixels at 1024, 1280, 1440 and 1920 px, Arabic and English.

### 2.8e Current homepage (product-first; supersedes 2.8c and 2.8d; 2026-11-03, local, uncommitted)

Principle taken from the owner's course-site screenshots (not their branding or claims): present the product clearly, demonstrate it, keep one persistent purchase button.

1. **Intro + video** (`#top`, `#video`): availability chip "متاح حاليًا لبرشلونة", destination-neutral headline "خطّط أقل، واستمتع أكثر" (EN "Plan less, enjoy more"), one line "خطة سفر يومية حسب أيامك واهتماماتك ومكان سكنك."; then the unchanged temporary video (side by side on wide screens). No destination hero photo.
2. **Product presentation** (`#offer`): "الخطة المخصصة إلك" + "أماكن، مطاعم وتنقّل — مرتّبين يوم بيوم."; three captioned panels rendered from the approved synthetic sample: part of day 1's schedule (first two stops, the example's own rail / stop components), the details of Sagrada Família (category, area, description, price text, booking note), and the transport options of the Sagrada Família -> Sant Pau leg exactly as the engine produced them (walking 23-26 min / 1.6 km; public transport 11-15 min, marked "مقترح" like the product). Fragments only; no customization, times or estimates were invented.
3. **"شوف مثال"** (`#example`): badge "مثال لبرشلونة", the "not your plan" line, the inputs as compact chips, ONE clear action (the `<details>` summary styled as a button) opening the existing excerpt (3 stops, 2 legs, one openable place-details sheet).
4. **Price** (`#price`): `{price} مرة واحدة` from the shared price source, the three existing points (multiple plans / editing / 30 saved plans; all supported cities, currently Barcelona; Barcelona guide included), and the note "الأسئلة مجانًا، والدفع بعد ما تخلّص." (hidden for owners and while ownership is loading). No crossed-out price.
5. **FAQ** (four existing questions) with the support email and refund link; **footer** on the homepage only shows privacy, terms and copyright (other pages keep email and account).
- Persistent purchase bar unchanged in behaviour ("اشترِ الآن" + price, owners "اعمل خطة جديدة", `/planner?new=1`, hidden while the menu or a modal sheet is open, safe-area and footer clearance, homepage only).
- **Palette:** white page, royal blue #2855D9 for primary actions, navy #17243B text, pale sky #EEF5FF section surfaces (`.home-page` scope), small apricot #FFD3A6 accents (chips with navy text, dots, one decorative disc). Headlines Noto Kufi Arabic (as on the journey pages), body Cairo. The editorial navy / Markazi / photo-gallery direction of 2.8d is withdrawn.
- **Motion:** intro rises once on load (CSS); GSAP reveals the product panels, the example card and the price card once, and staggers the example's stops; nothing with reduced motion.

**Update 2026-11-03 (2.8e, local, uncommitted):**
- The intro has **no destination badge** any more; headline and brand stay destination-neutral. Barcelona availability is still stated where it is accurate and needed: the example badge "مثال لبرشلونة", the price point "حاليًا: برشلونة", the questionnaire and the checkout (unchanged). No destination was enabled and no validation changed.
- New section **"صارت معك؟"** (`#problems`, `home/HomeProblems.tsx`) between the intro/video and "الخطة المخصصة إلك": four illustrative everyday situations as neutral speech bubbles (no names, avatars, timestamps, app chrome or counts), alternating pale sky and apricot, two columns on wide screens and stacked on phones, all visible (no carousel). Visible disclosure under the heading: "مواقف توضيحية، مش آراء زباين" (EN "Illustrative situations, not customer reviews"). Closing line: "خلّي وقتك للرحلة، والترتيب علينا." It does not promise that closures or every planning problem disappear.
- **Video presentation:** the 4:5 box is now `min(18rem, 40svh)` wide on phones (320 to 360 px tall measured at 360x640 to 430x932) and 19rem (380 px tall) from 640 px up; same ratio as the 640x800 recording, so nothing is cropped or letterboxed.

**Update 2026-11-03, later (owner's instruction):** "صارت معك؟" now uses four shorter lines set as chat-style bubbles (sized to their text, soft corners, a small tail, alternating sides; white / pale sky with one apricot; navy text) and the line "مواقف توضيحية، مش آراء زباين" was removed at the owner's request. The bubbles still carry no names, accounts, photos, times, read receipts or app logos, nothing imitates a WhatsApp / Instagram screenshot, and the section is framed as a question to the visitor, not as customer messages. A deep navy `brand-deep` #071343 (token in `app/globals.css`, with `on-deep` #DCE5FA for secondary text) is the background of this section and of the price section only (white headings 18.3:1, #DCE5FA 14.2:1; the price card stays white); each has one large clipped blue circle as decoration. The rest of the page stays white / pale sky; buttons and the fixed purchase bar stay #2855D9.

### 2.8f Homepage visual rebuild (2026-11-04, local, uncommitted; supersedes the layout parts of 2.8e)

Copy and behaviour are unchanged except the line "جاوب على الأسئلة مجانًا، والدفع بعد ما تخلّص." (EN "Answer the questions for free, and pay after you finish."), now shown before the video (owners: "اعمل خطة جديدة بدون دفع إضافي."), and the three scene titles "يومك بالترتيب" / "تفاصيل كل مكان" / "التنقّل بين المحطات".
- **Intro scene:** text on white; one composed block of a travel photograph (`bunkers-del-carmel.jpg`, local, rights still to be reviewed), the unchanged short video in its 4:5 player overlapping the photo, and a solid white card with one real stop of the sample (Sagrada Família, 09:45-11:45, 120 دقيقة). No text sits on the photo except solid cards. Phones: one compact block (photo panel 224 px, video overlapping its lower part); from 768 px: text beside the scene.
- **"صارت معك؟":** deep-navy band, chat-style bubbles sized to their words, smaller gaps, no decoration.
- **"الخطة المخصصة إلك":** three scenes from the sample, each on its own surface: the day in order (pale sky panel, first two stops with the real walking leg), the transport options of one leg (deep navy panel, suggested option marked), one place's details (photograph with a white details sheet on it). Wide screens: schedule and transport side by side at different heights, the place full width below; phones: schedule, details, transport stacked at natural height (no sideways scrolling).
- **Example:** no card; badge, the "not your plan" line, input chips and one filled "شوف مثال" button.
- **Price:** directly on the deep-navy band (no card): large white price with "مرة واحدة", the apricot "الأسئلة مجانًا، والدفع بعد ما تخلّص." pill, and the three points as a divided list.
- **FAQ:** simple dividers instead of a box, narrower column.
- **Motion:** every `data-reveal` element below the first screen (titles, lines, each bubble, each scene, each price point, each question) fades in and rises 20 px over 0.5 s, 0.1 s apart when several arrive together (GSAP ScrollTrigger.batch, once). Content is hidden only after GSAP has loaded and set up, the first screen is never hidden (CSS entrance only), keyboard focus inside a not-yet-revealed element shows it at once, no pinning or scroll hijacking, nothing with reduced motion.
- **Image rights to review before launch:** the hero photo and the Sagrada Família photo are local files with no recorded source; the Mercat and Sant Pau photos come from Wikimedia Commons, whose licences usually require attribution that the site does not show yet.

### 2.8g Homepage refinements (2026-11-04, local, uncommitted; supersedes the intro scene and the stacked phone scenes of 2.8f)

- **Intro:** the Barcelona photo and the floating Sagrada Família card were removed. The video stands alone in its own clean frame (moderate corners, thin border), with "شوف كيف بتكون خطتك" as a small title above it. File, player, poster and 4:5 ratio unchanged. Measured box: 254 x 318 px at 360x640, 286 x 358 px at 390x844, 294 x 368 px at 1280x800. With the video centred on screen its controls sit above the fixed purchase bar. From 768 px the text and video sit side by side.
- **"الخطة المخصصة إلك":** on phones and tablets a swipeable gallery (native scroll-snap, RTL-aware, no autoplay, vertical page scroll not blocked). Order: يومك بالترتيب, تفاصيل كل مكان, التنقّل بين المحطات, each with its title inside it. One whole scene plus a glimpse of the next, the hint "اسحب وشوف تفاصيل خطتك", three dots (aria-current) and two arrows ("المشهد السابق" / "المشهد التالي"). The scroller is focusable, so the arrow keys scroll it. Its height follows the current scene with a short transition, and only content below moves. From 1024 px the three scenes sit side by side with no controls. Shadows removed from the scenes (the details scene has a thin border).
- **"شوف مثال":** closed state is the badge, "3 أيام · ثقافة وأكل" (EN "3 days · Culture & food") and the button. "هاد مثال جاهز، مش خطتك" and all the inputs (including accommodation) are inside, before the schedule.
- **Spacing** tightened in "صارت معك؟", before the example, the price band and before the FAQ.
- **Motion:** as in 2.8f. Elements a fast scroll jumps over are shown at once, and the stagger shrinks for large groups, so nothing is left hidden. The gallery is revealed as one block, so a scene is never hidden when swiped to.

**Type scale (2026-11-04, after the owner's reference screenshots):** only titles are large: h1 2.75rem / 4rem, every section h2 2.5rem / 3.25rem, all bold Noto Kufi. Lead lines are 16 px / 18 px in the muted colour; labels, notes and price points are about 15 px. On phones the intro is centred, with the video under it. The FAQ title is start-aligned like the product title, and the closing line of "صارت معك؟" is quieter. Section order, copy and behaviour are unchanged.

**Update 2026-11-04:** below 640 px, section titles are 2.05rem (about 33 px, roughly 18% smaller); the h1 is unchanged (2.75rem). The intro description is 16 px with a 1.8 line height and a width that wraps it into two balanced lines on phones (19rem in Arabic, 22rem in English, with no forced break). The visitor's fixed "اشترِ الآن" button has a CSS-only shine: a soft diagonal white band sweeps under the text in about 1 s, once every 7 s, clipped to the rounded button and ignoring clicks. There is no shine with reduced motion, none on the owner's "اعمل خطة جديدة" button, and none while the bar is hidden (it is not rendered then).

### 2.8h Homepage, final review for TikTok phone visitors (2026-11-04, local, uncommitted; current state)

Owner's decisions in this review: the first-screen visual is the video itself, smaller and whole; the price on the first screen is the fixed purchase bar only; "flights, hotels and tickets are not included" goes in one FAQ question; section order unchanged.
- **First screen (phones):** h1 "خطّط أقل، واستمتع أكثر", the line "خطة سفر يومية حسب أيامك واهتماماتك ومكان سكنك.", the small video title and the whole video (its poster is a still of a real plan, so the product is visible without playing it), and the fixed "اشترِ الآن | ₪39" bar. The video width follows the screen height (`clamp(10.5rem, (100svh - 26rem) * 0.8, 15rem)`), so it fits above the bar. Measured video box and gap to the bar: 179x224 at 360x640, 201x251 at 375x667, 203x254 at 390x670 (about a 390x844 phone inside the TikTok browser), 240x300 at 390x844 and 430x780. From 768 px the layout is side by side.
- **Removed:** "جاوب على الأسئلة مجانًا، والدفع بعد ما تخلّص." from the intro (with the owner's intro line) and from the price section, and "اسحب وشوف تفاصيل خطتك" from the gallery (the dots, arrows and the glimpse of the next scene show it). When payment happens is still stated at the start of the questionnaire ("الأسئلة مجانًا، والدفع بعد ما تخلّص." with the 4 step labels) and in the checkout summary, both unchanged.
- **FAQ:** "الطيران والفنادق والتذاكر مشمولة؟": "لا، سعر الخطة ما بشمل الطيران ولا الفنادق ولا التذاكر…" (EN: "Are flights, hotels and tickets included?").
- **Example:** "شوف مثال" is now an outline button, so the only filled blue button on screen is the purchase bar.
- **Performance (local production build, headless Chrome, emulated phone 390x844 at 3x, 4x CPU slowdown, network throttled to 150 ms RTT / 1.6 Mbps; median of 3 runs):** FCP 1.43 s, LCP 1.80 s, CLS 0.008, 665 KB transferred (fonts 248, scripts 214, images 146, CSS 15, HTML 11). Only the video poster loads before play; the video file loads only when pressed. Limits: served from localhost (no CDN, TLS or real radio latency), Chrome only, not a real phone or the TikTok in-app browser.

**Update 2026-11-04 (design frozen by the owner):** the price section has one more line under the points: "السعر للخطة فقط، ومش شامل الطيران أو الإقامة أو تذاكر الأماكن." (EN "The price is for the plan only. It doesn't include flights, accommodation or tickets for places."). The FAQ question about flights, hotels and tickets stays. Two wording fixes in the journey: the payment-waiting screen no longer says "تأكيد Allpay الموقّع" (now "بنفتح مشترياتك أول ما يوصلنا تأكيد الدفع…"), and on My Plans "إنشاء خطة جديدة" is a secondary button while a paid plan is waiting to be built, so "ابنِ خطتي" is the one main action.

### 2.9 The product video### 2.8c Homepage composition and motion (redesign of 2026-11-03, local, uncommitted)

- **2026-11-03: the page plays a 19.4-second temporary edit**, `public/video/plan-demo-short.mp4`, cut from the existing recording only: the pauses between the four questionnaire steps were shortened (about 0.5 s kept each) and the plan-view part plays at 1.75x with its two still moments shortened. Same frames, same order (the four questions, the "المتابعة للدفع" button, then the plan view), no new or invented footage. The original `public/video/plan-demo.mp4` (35.5 s) is unchanged and kept; the poster is unchanged. Like the original, the recording goes from the payment button straight to a plan view (it never showed the payment or account screens); the page text around it says that payment comes after the questions, and the FAQ explains signing in after payment. Both files are temporary until the owner's final video.

- **Composition (top to bottom):** minimal header (logo + compact menu) / full-width photo of Barcelona from above (`public/images-barcelona/bunkers-del-carmel.jpg`, an existing site photo, decorative, under a navy veil) with the headline "رحلتك لبرشلونة، مرتّبة يوم بيوم" (EN: "Your Barcelona trip, planned day by day") and one line "questions are free, pay after you finish" (owner: "create a new plan at no extra cost"), the **unchanged temporary video** as a card overlapping the bottom edge of the photo, then the offer (three real stops joined by a dashed route), the free example, the price, four FAQs, the minimal footer. The fixed purchase button (ownership-aware, `/planner?new=1`) and the no-cart-icon rule are unchanged.
- **Typography:** Arabic headlines (h1 / h2 inside `.theme-brand`, so the whole journey) use **Noto Kufi Arabic** (variable `--font-noto-kufi`, `font-display` utility); body text, buttons and inputs stay Cairo. Noto Kufi has no Latin glyphs, so English headlines fall back to Cairo. A first attempt with Reem Kufi was rejected: its connected letter forms were hard to read.
- **Imagery:** one photo only; the stops of the offer use the real public-sample photos. No stock images were added. **The hero photo's usage rights are not recorded in the repository: see "Pre-launch items" in `docs/PROJECT_PLAN.md`.**
- **Motion (GSAP 3.15 + ScrollTrigger, loaded with a dynamic import by `components/home/HomeMotion.tsx`, so it is not in the first load):** hero photo settles and drifts a few percent while scrolling (transform only); `data-reveal` blocks (example, price) rise 14px once; the route between the three stops draws itself and its nodes pop in once; the example's stops arrive one after another each time it is opened. The headline and video card rise on load with plain CSS (no flash while JavaScript loads). Everything is inside `gsap.matchMedia("(prefers-reduced-motion: no-preference)")`; without JavaScript or with reduced motion nothing is hidden or moved. No text is split into characters (Arabic letters stay joined).
- **Accessibility (reviewed with the ui-ux-pro-max skill):** visible 2px focus outlines on every tab stop checked, buttons / summaries / pill links at least 44px tall (`HomeButton` has `min-h-11`; the transport toggle in the day view, shared with the saved itinerary, is now 44px tall and 12px text), no visible text under 12px, hero text contrast on the photo (typical background 13 to 14:1 against white; the veil darkens the top and middle of the photo), no horizontal overflow from 320px to 1280px.
- **Third-party licences:** GSAP is free under its "Standard no charge" licence. React Bits (MIT + Commons Clause) was reviewed but **no component was copied**; nothing was needed beyond CSS and GSAP.

### 2.8b Customer-journey consistency (added 2026-11-03, local, uncommitted)

The whole customer journey shares the homepage palette through ONE scoped CSS class, not by editing components: `.theme-brand` (in `app/globals.css`) re-points the teal and slate palette variables to the brand blue and the navy / muted / line neutrals, so every existing component inside it (buttons, inputs, guide cards, sheets, plan cards) is recoloured at once. Pages that opt in by adding it to their `<main>`: homepage, `/planner` (questionnaire, My Plans, owner status), the personalized `/checkout` branch and its owner state, `/checkout/success`, `/checkout/cancelled`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/claim-purchase`, `/account` and the saved itinerary `/smart-planner/barcelona-v2/saved/<id>`. Legacy product pages (Guide, Ready Plans, the legacy cart checkout, custom-plan pages) do not opt in and look as before. Cards in these pages use `rounded-2xl`; the Allpay payment page is external and untouched.

Journey copy (no business-logic change): planner subtitle "جاوب على 4 أسئلة قصيرة وبنبني لك خطة مرتّبة يوم بيوم", tagline "الأسئلة مجانًا، والدفع بعد ما تخلّص" (owners: "الخطط الجديدة بدون دفع إضافي"); the questionnaire's destination step shows Barcelona as the one selectable choice and the other targets as small non-interactive "قريبًا" chips; the last step shows "₪39 مرة واحدة · أكثر من خطة · حتى 30 خطة محفوظة" under the button (non-owners); the personalized checkout summary no longer shows the struck-through ₪59 reference, lists "more than one plan, up to 30 saved plans", and its email hint tells the buyer to use the same email when signing in; My Plans lists a paid plan waiting to be built first, then "إنشاء خطة جديدة", then the saved plans; the account page shows "إنشاء خطة جديدة" to owners; the saved itinerary has a header row with "خططي" (back to My Plans) and "＋ خطة جديدة" (a new questionnaire).

 (status: TEMPORARY placeholder; final replacement is pending and must happen before launch)

**Decision (owner, 2026-11-03):** the current video is temporary and will be replaced by the owner after the website is ready. Do not spend time editing, shortening, re-recording or color-matching it. The video section (heading, reserved 4:5 box, poster, working player) stays as it is, and the final video replacement is a **pre-launch item that does not block continued website design and development**. To replace it, overwrite `public/video/plan-demo.mp4` and `public/video/plan-demo-poster.jpg` (keep the 4:5 ratio, or adjust the reserved box in `app/components/home/HomeVideo.tsx`).

- Source: a headless-Chrome screen recording of the **local** product UI on a 400x500 phone viewport: the free questionnaire steps (destination, days, interests, accommodation "not booked"; nothing submitted, no payment, no account) followed by the itinerary view of a synthetic plan produced locally by the real engine (3 days, culture + food). No customer data, credentials or real accounts appear. It was encoded with an ffmpeg copy kept outside the project (not a dependency).
- It shows the product as it is today: the questionnaire and result pages still use their older teal styling, and the plan view is Arabic. The homepage palette is blue, so the video and the page do not match in color yet. The recording shows the days of the synthetic plan (not the full plan) and one place sheet is not opened in it.
- The temporary recording page and its data were deleted after the recording. To re-record: run the questionnaire at `/planner?new=1`, then render a locally generated synthetic plan, and re-encode to `public/video/plan-demo.mp4` (about 35 s, H.264, no audio) plus a poster frame.
- The notes above describe the temporary video only; they are not a to-do list. Its length (about 35 s), its older teal questionnaire styling and its Arabic plan view are known and accepted for now.

## 3. Known limitations and public-copy problems (confirmed in code)

- ~~The public SEO description mentioned AI~~ Fixed in phase 3 (`app/layout.tsx`, `homepageTranslations.ts` `seo`; still to be released). The browser tab title is still the static Arabic one from `layout.tsx` even in English mode (the `seo` copy is not wired to the document title).
- The post-payment screens say the purchase is ready, but the customer still has to press "ابنِ خطتي".
- ~~Homepage "Available destinations" section~~ Removed from the homepage in phase 3; availability is now one line ("Available now for Barcelona") in the hero and the price section. The questionnaire still lists 10 cities (only Barcelona selectable).
- The Privacy Policy mentions contacting us "by email or WhatsApp" although no WhatsApp channel is published.
- Checkout says the email is used "to send order details", but the app has no email-sending code (Allpay may send a receipt; not verified).
- Questionnaire drafts live in `sessionStorage`: switching browser (for example TikTok to Safari) loses the answers.
- The "visited more than 15 countries" claim is no longer on the homepage (the trust section was removed); the legacy components that carry it are unmounted but still in the repo. Whether it returns anywhere is still an open decision.
- Plan generation runs inside a server action; no `maxDuration` is configured and the duration for 10-day trips was not measured.

## 4. Policy vs implementation (future work, do not change now)

The confirmed policy is **one ₪39 purchase = access to all supported cities, with no per-city charge**.

- Entitlement itself is already destination-independent (section 2.5), so this part matches.
- Differences to review when the work is scoped:
  - Checkout creates a request tied to **one destination chosen before paying**, and that first request builds one plan for that destination.
  - The bundled Guide is granted **only for Barcelona** (`DESTINATION_INCLUDED_GUIDE_SLUG` in `app/lib/planner/personalizedPlanAnswers.ts`, `app/lib/commerce/bundles.ts`). Other cities have no guide.
  - Checkout and "My plans" copy is partly destination-specific ("+ Barcelona Guide", "plan for {destination}").
  - Whether a purchase also covers cities added in the future is **not decided**; nothing in code or copy may promise it.

## 5. Differences between decisions and today's site (future work)

- Decision: one public product. Phase 3 implements this on the homepage and footer (not yet released). Places that still show the old multi-product storefront: unmounted legacy components, `app/lib/content.ts` data used by legacy pages, and the legacy product pages themselves (intentionally kept for buyers and direct links).
- Decision: mobile-first simplicity. Phase 3 was designed and checked at 375/390/430 px in Arabic and English (emulated viewport only; no real iPhone or TikTok browser).

## 6. Open decisions (do not invent answers)

1. Whether the purchase permanently includes every future destination.
2. Whether and how to keep the struck-through ₪59 reference price.
3. Any new questionnaire questions (pace, budget, travelers, etc.).
4. Destination rollout order and who validates the content of each city.
5. WhatsApp contact policy (publish a channel, or remove the mention from the Privacy Policy).
6. The "15 countries" trust claim: keep, change, or remove.
7. How the public site should present the other four products (hide vs keep) while existing buyers keep access.
