import type { Product } from '../../lib/types';
import ProductCard from './ProductCard';

/** Card grid to use as an island from Astro pages. */
export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul class="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(15.5rem,1fr))] sm:gap-5">
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}
