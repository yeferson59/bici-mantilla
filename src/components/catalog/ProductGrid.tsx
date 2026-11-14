import type { Product } from '../../lib/types';
import ProductCard from './ProductCard';

/** Grid of hanging tags, to use as an island from Astro pages. Put it on a `.wall`. */
export default function ProductGrid({
  products,
  highlightFeatured = true,
}: {
  products: Product[];
  highlightFeatured?: boolean;
}) {
  return (
    <ul class="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] sm:gap-x-6 sm:gap-y-8">
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} highlightFeatured={highlightFeatured} />
        </li>
      ))}
    </ul>
  );
}
