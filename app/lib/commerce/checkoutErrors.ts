/**
 * Stable codes for the customer-facing checkout errors.
 *
 * The server does not know the visitor's site language (it lives in the browser), so the checkout
 * actions return one of these codes ALONGSIDE the existing Arabic `error` text. The checkout page shows
 * the message for the code in the current language (t.checkout.errors in homepageTranslations.ts) and
 * only falls back to the Arabic text for an unknown/absent code. A code carries no internal detail:
 * the technical cause is logged server-side and never sent to the customer.
 *
 * Plain types only -- safe to import from both server and client code.
 */
export type CheckoutErrorCode =
  | "invalid_product"
  | "empty_cart"
  | "invalid_email"
  | "no_product_selected"
  | "already_owned"
  | "login_required"
  | "order_create_failed"
  | "order_load_failed"
  | "order_not_found"
  | "order_not_pending"
  | "order_items_failed"
  | "payment_page_failed"
  | "payment_setup_failed";
