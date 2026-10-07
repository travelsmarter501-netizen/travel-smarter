import Link from "next/link";
import Container from "../../components/Container";
import Button from "../../components/Button";

export default function CheckoutCancelledPage() {
  return (
    <main className="py-10">
      <Container className="max-w-lg">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <p className="text-4xl">↩️</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">رجعت بدون إتمام الدفع</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            ما تم خصم شيء ولم يُفتح أي منتج. تقدر ترجع للسلة وتكمّل الدفع متى ما بدك.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Button href="/checkout">العودة لإتمام الشراء</Button>
            <Link href="/" className="text-sm font-semibold text-teal-700 hover:text-teal-800">
              الرئيسية
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
