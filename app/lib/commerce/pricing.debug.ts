/**
 * Price consistency check. Run from the repository root:
 *
 *     npx tsx app/lib/commerce/pricing.debug.ts
 *
 * The database (public.products.price_ils, set by migrations) is the only price that is ever CHARGED. The website shows prices in several
 * places, all fed from app/lib/commerce/pricing.ts. This script fails (exit 1) if any of these ever drift apart:
 *   - the newest price migration  <->  pricing.ts launch prices
 *   - pricing.ts  <->  the homepage catalog (both languages), Barcelona's destination entry and the four product data files
 *   - and it proves the old "reference" prices cannot reach payment code: none of the order / Allpay / webhook / fulfilment files imports pricing.ts.
 */
import fs from "fs";
import { PRODUCT_PRICES_ILS, type PricedCartId } from "./pricing";
import { CART_ID_TO_PRODUCT_SLUG } from "./catalog";
import { homepageTranslations } from "../homepageTranslations";
import { destinations, productCategories } from "../content";
import { barcelonaGuide } from "../barcelona-guide";
import { barcelonaReadyPlan1Day } from "../barcelona-ready-plan-1day";
import { barcelonaReadyPlan3Day } from "../barcelona-ready-plan-3day";
import { barcelonaReadyPlan } from "../barcelona-ready-plan";

let failures = 0;
const check = (ok: boolean, label: string, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? "  -- " + detail : ""}`);
  if (!ok) failures++;
};

const ids = Object.keys(PRODUCT_PRICES_ILS) as PricedCartId[];

check(ids.length === 5 && ids.every((id) => CART_ID_TO_PRODUCT_SLUG[id]), "pricing.ts covers exactly the five sellable products (every id maps to a real product slug)");
check(ids.every((id) => Number.isInteger(PRODUCT_PRICES_ILS[id].launch) && PRODUCT_PRICES_ILS[id].launch > 0 && PRODUCT_PRICES_ILS[id].reference > PRODUCT_PRICES_ILS[id].launch), "every launch price is a positive whole number below its struck-through reference price");

// ── the newest price migration ──
const migrationsDir = "supabase/migrations";
const newest = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .reverse()
  .find((f) => fs.readFileSync(`${migrationsDir}/${f}`, "utf8").includes("new_price"));
check(!!newest, "a price migration exists", newest ?? "none found");
if (newest) {
  const sql = fs.readFileSync(`${migrationsDir}/${newest}`, "utf8");
  const fromSql = new Map<string, number>([...sql.matchAll(/\('([a-z0-9-]+)',\s*(\d+)\)/g)].map((m) => [m[1], Number(m[2])]));
  for (const id of ids) {
    const slug = CART_ID_TO_PRODUCT_SLUG[id];
    check(fromSql.get(slug) === PRODUCT_PRICES_ILS[id].launch, `migration price for ${slug} equals pricing.ts launch price`, `${fromSql.get(slug)} vs ${PRODUCT_PRICES_ILS[id].launch}`);
  }
}

// ── displayed prices ──
for (const lang of ["ar", "en"] as const) {
  for (const id of ids) {
    const item = homepageTranslations[lang].products.items.find((candidate) => candidate.id === id);
    check(!!item && item.priceILS === PRODUCT_PRICES_ILS[id].launch && item.referencePriceILS === PRODUCT_PRICES_ILS[id].reference, `homepage card (${lang}) ${id}: price and struck-through price match`, `${item?.priceILS}/${item?.referencePriceILS}`);
  }
}
const barcelona = destinations.find((d) => d.slug === "barcelona")!;
check(barcelona.customPlanPrice === PRODUCT_PRICES_ILS["personalized-trip-plan"].launch && barcelona.packagePrice === PRODUCT_PRICES_ILS["barcelona-5day"].launch && barcelona.guidePrice === PRODUCT_PRICES_ILS["barcelona-guide"].launch, "Barcelona's destination entry shows the launch prices");
const category = (id: string) => productCategories.find((c) => c.id === id)!.priceFrom;
check(category("custom-plan") === PRODUCT_PRICES_ILS["personalized-trip-plan"].launch && category("ready-packages") === PRODUCT_PRICES_ILS["barcelona-5day"].launch && category("guides") === PRODUCT_PRICES_ILS["barcelona-guide"].launch, "the three category \"from\" prices match");
check(barcelonaGuide.priceILS === PRODUCT_PRICES_ILS["barcelona-guide"].launch, "guide data file price matches");
check(barcelonaReadyPlan1Day.priceILS === PRODUCT_PRICES_ILS["barcelona-1day"].launch, "1-day data file price matches");
check(barcelonaReadyPlan3Day.priceILS === PRODUCT_PRICES_ILS["barcelona-3day"].launch, "3-day data file price matches");
check(barcelonaReadyPlan.priceILS === PRODUCT_PRICES_ILS["barcelona-5day"].launch, "5-day data file price matches");

// ── the struck-through prices can never reach payment code ──
const paymentFiles = [
  "app/lib/orders.ts",
  "app/checkout/actions.ts",
  "app/checkout/quote.ts",
  "app/lib/allpay/createPayment.ts",
  "app/lib/allpay/config.ts",
  "app/lib/allpay/sign.ts",
  "app/lib/commerce/fulfillPaidOrder.ts",
  "app/lib/commerce/bundles.ts",
  "app/lib/commerce/personalizedPlan.ts",
  "app/planner/actions.ts",
  "app/api/allpay/webhook/route.ts",
];
for (const file of paymentFiles) {
  const text = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  check(text.length > 0 && !/commerce\/pricing|\.\/pricing|PRODUCT_PRICES_ILS|referencePrice|referenceIls/.test(text), `payment path ${file} does not import or mention the display prices`);
}

console.log(failures === 0 ? "\nALL PRICE CONSISTENCY CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
