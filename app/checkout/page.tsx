import Container from "../components/Container";
import { redirect } from "next/navigation";
import CheckoutClient from "./CheckoutClient";
import PersonalizedPlanCheckout from "../components/planner/PersonalizedPlanCheckout";
import PersonalizedPlanStatus from "../components/planner/PersonalizedPlanStatus";
import { getPersonalizedPlanPriceIls, getPersonalizedPlanState } from "../lib/commerce/personalizedPlan";
import { pendingClaimState } from "../claim-purchase/pendingClaimStatus";
import { isComplimentaryUser } from "../lib/commerce/complimentary";
import { isSellableProductSlug } from "../lib/commerce/catalog";
import { getAllpayMode } from "../lib/allpay/config";
import { createClient } from "../../utils/supabase/server";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ product?: string; plan?: string; new?: string }> }) {
  const { product, plan, new: explicitNewPlan } = await searchParams;
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
    // Never show a purchase screen for a plan that is already paid. Decided from the database, not from this tab's draft:
    //   - a paid purchase still waiting to be attached to an account -> the claim page;
    //   - a paid plan that is not built yet -> "Build my plan" (no price, no payment button);
    //   - a plan already built -> "Your plan is ready" with "Open my plan" and "Create another plan". Only the explicit new-plan path
    //     (the questionnaire's checkout step, ?new=1) shows the purchase summary again -- a direct visit or an old bookmark never does.
    if ((await pendingClaimState(user?.id ?? null)) === "paid") redirect("/claim-purchase");
    if (user) {
      const planState = await getPersonalizedPlanState(user.id);
      if (planState === "unbuilt") return <PersonalizedPlanStatus state="unbuilt" />;
      if (planState === "generated" && explicitNewPlan !== "1") return <PersonalizedPlanStatus state="generated" />;
    }

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
