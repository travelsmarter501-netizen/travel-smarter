import Container from "../components/Container";
import CheckoutClient from "./CheckoutClient";
import { isSellableProductSlug } from "../lib/commerce/catalog";
import { getAllpayMode } from "../lib/allpay/config";
import { createClient } from "../../utils/supabase/server";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product } = await searchParams;
  const extraProductSlug = product && isSellableProductSlug(product) ? product : undefined;

  // The "test mode" banner is shown ONLY when the server is actually in test mode, so real
  // customers are never told "no real payment" while being charged. Misconfigured mode -> no banner
  // (checkout itself fails closed in that case).
  let testMode = false;
  try {
    testMode = getAllpayMode() === "test";
  } catch {
    testMode = false;
  }

  // Guests may check out; the form only needs to know whether to ask for an email. This is a UI hint
  // only -- startCartCheckout re-verifies the session on the server and ignores a client-claimed state.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="py-10">
      <Container className="max-w-lg">
        <CheckoutClient extraProductSlug={extraProductSlug} testMode={testMode} signedIn={!!user} />
      </Container>
    </main>
  );
}
