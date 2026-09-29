import { redirect } from "next/navigation";
import Link from "next/link";
import Container from "../../components/Container";
import Button from "../../components/Button";
import { createClient } from "../../../utils/supabase/server";
import { getUserOrder } from "../../lib/orders";
import { getUserEntitlements } from "../../lib/entitlements";
import SuccessRefresh from "./SuccessRefresh";

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

  return (
    <main className="py-10">
      <Container className="max-w-lg">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <p className="text-4xl">{paid ? "✅" : "⏳"}</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">{paid ? "تم تأكيد الدفع" : "جاري تأكيد الدفع"}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {paid
              ? "المنتجات صارت متاحة على حسابك بعد التحقق من الدفع."
              : "ما منفعّل المنتج إلا بعد وصول تأكيد Allpay الموقّع. إذا خلصت الدفع، انتظر لحظات أو افتح حسابك."}
          </p>
          {orderId && (
            <p dir="ltr" className="mt-3 text-xs text-slate-400">
              {orderId.slice(0, 8).toUpperCase()}
            </p>
          )}
          {!paid && <SuccessRefresh />}
          <div className="mt-6 flex flex-col gap-2.5">
            <Button href="/account">حسابي</Button>
            <Link href="/" className="text-sm font-semibold text-teal-700 hover:text-teal-800">
              الرئيسية
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
