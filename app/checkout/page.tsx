import Container from "../components/Container";
import CheckoutClient from "./CheckoutClient";
import { isSellableProductSlug } from "../lib/commerce/catalog";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product } = await searchParams;
  const extraProductSlug = product && isSellableProductSlug(product) ? product : undefined;

  return (
    <main className="py-10">
      <Container className="max-w-lg">
        <CheckoutClient extraProductSlug={extraProductSlug} />
      </Container>
    </main>
  );
}
