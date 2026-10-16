import { redirect } from "next/navigation";
import Container from "../../components/Container";
import PaymentConfirmed from "../../components/checkout/PaymentConfirmed";
import { createClient } from "../../../utils/supabase/server";
import { getUserOrder } from "../../lib/orders";
import { getUserEntitlements } from "../../lib/entitlements";
import { destinationForPurchase } from "../../lib/commerce/claimDestination";

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ order_id?: string }> }) {
  const { order_id: orderId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = orderId ? `/checkout/success?order_id=${encodeURIComponent(orderId)}` : "/checkout/success";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const order = orderId ? await getUserOrder(orderId) : null;
  const entitlements = await getUserEntitlements();
  const paid = order?.status === "paid" || entitlements.length > 0;

  // What they bought decides where "Open" goes: a Personalized Plan is only half-done at payment (the buyer still builds the plan
  // from /planner); a single product opens its own page; anything else opens the account. Read with the customer's own session,
  // so row-level security limits both queries to an order they own.
  let nextPath = "/account";
  let hasPlan = false;
  if (orderId && order?.status === "paid") {
    const [{ data: items }, { data: planRequest }] = await Promise.all([
      supabase.from("order_items").select("products(slug)").eq("order_id", orderId).returns<{ products: { slug: string } | { slug: string }[] | null }[]>(),
      supabase.from("personalized_plan_requests").select("id").eq("order_id", orderId).maybeSingle<{ id: string }>(),
    ]);
    hasPlan = !!planRequest;
    const slugs = (items ?? []).flatMap((item) => (Array.isArray(item.products) ? item.products.map((p) => p.slug) : item.products ? [item.products.slug] : []));
    nextPath = destinationForPurchase(slugs, hasPlan);
  }

  return (
    <main className="py-10">
      <Container className="max-w-lg">
        <PaymentConfirmed paid={paid} orderId={orderId} nextPath={nextPath} clearDraft={paid && hasPlan} />
      </Container>
    </main>
  );
}
