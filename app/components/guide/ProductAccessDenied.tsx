import Container from "../Container";
import Button from "../Button";

/**
 * Shared "not purchased yet" screen for any single protected product (the Barcelona
 * Guide, the Barcelona Ready Plan, and future products). Kept generic and parameterized
 * so each product's own page supplies its own name/contact subject — no product-specific
 * copy lives here.
 */
export default function ProductAccessDenied({
  productName,
  mailSubject,
  productSlug,
}: {
  productName: string;
  mailSubject: string;
  productSlug?: string;
}) {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center py-12">
      <Container className="max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <p className="text-4xl">🔒</p>
          <h1 className="mt-3 text-xl font-bold text-slate-900">هذا المنتج مش موجود ضمن مشترياتك</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{productName} متاح للحسابات اللي اشترته.</p>

          <div className="mt-6 flex flex-col gap-2.5">
            {productSlug && <Button href={`/checkout?product=${encodeURIComponent(productSlug)}`}>إتمام الشراء</Button>}
            <Button href="/account" variant={productSlug ? "secondary" : "primary"}>
              العودة لحسابي
            </Button>
            <Button href={`mailto:travelsmarter501@gmail.com?subject=${encodeURIComponent(mailSubject)}`} variant="secondary">
              تواصل معنا للشراء
            </Button>
          </div>
        </div>
      </Container>
    </main>
  );
}
