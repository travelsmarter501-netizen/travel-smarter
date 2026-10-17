import Container from "../components/Container";
import { redirect } from "next/navigation";
import CheckoutClient from "./CheckoutClient";
import PersonalizedPlanCheckout from "../components/planner/PersonalizedPlanCheckout";
import PersonalizedPlanStatus from "../components/planner/PersonalizedPlanStatus";
import { getPersonalizedPlanPriceIls, ownsPersonalizedPlan } from "../lib/commerce/personalizedPlan";
import { pendingClaimState } from "../claim-purchase/pendingClaimStatus";
import { isComplimentaryUser } from "../lib/commerce/complimentary";
import { isSellableProductSlug } from "../lib/commerce/catalog";
import { getAllpayMode } from "../lib/allpay/config";
import { createClient } from "../../utils/supabase/server";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ product?: string; plan?: string }> }) {
  const { product, plan } = await searchParams;
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

  // Personalized Plan: a different checkout body (summary of the questionnaire the visitor just finished). The price shown
  // is display only; the order, its stored answers and the charge are all created server-side when the visitor pays.
  if (plan === "personalized") {
    // The Personalized Plan is bought ONCE. Never show a purchase screen to someone who already owns it (decided from the database, not from this tab's
    // draft): they get the way into their unlocked planner. A paid purchase still waiting to be attached to an account goes to the claim page.
    if ((await pendingClaimState(user?.id ?? null)) === "paid") redirect("/claim-purchase");
    if (user && (await ownsPersonalizedPlan(user.id))) return <PersonalizedPlanStatus />;

    return (
      <main className="py-10">
        <Container className="max-w-lg">
          <PersonalizedPlanCheckout
            testMode={testMode}
            signedIn={!!user}
            priceIls={await getPersonalizedPlanPriceIls()}
            // One boolean about THIS session, decided on the server (COMPLIMENTARY_USER_IDS); the list itself never leaves the server.
            complimentary={!!user && isComplimentaryUser(user.id)}
          />
        </Container>
      </main>
    );
  }

  return (
    <main className="py-10">
      <Container className="max-w-lg">
        <CheckoutClient extraProductSlug={extraProductSlug} testMode={testMode} signedIn={!!user} />
      </Container>
    </main>
  );
}
