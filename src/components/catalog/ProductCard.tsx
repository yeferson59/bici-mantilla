import { formatPrice } from '../../lib/price';
import type { Product } from '../../lib/types';
import { addToCart } from '../../stores/cart';
import Illustration from '../Illustration';

/**
 * A product as a price tag hanging from the pegboard. Featured products get the yellow tag.
 * Place it inside an `li` so the tags of a grid hang at slightly different angles.
 * `highlightFeatured={false}` keeps the tag white, for lists where every product is featured.
 */
export default function ProductCard({
  product,
  note,
  highlightFeatured = true,
}: {
  product: Product;
  note?: string;
  highlightFeatured?: boolean;
}) {
  const href = `/producto/${product.id}`;
  const featured = highlightFeatured && !!product.featured;
  const sizes = product.sizes ?? [];
  const mustChooseSize = sizes.length > 1;

  return (
    <div class="tag-hook">
      <article class={`tag flex flex-col px-4 pb-4 pt-9 sm:px-5 sm:pb-5 ${featured ? 'tag-featured' : ''}`}>
        <a href={href} tabIndex={-1} aria-hidden="true" class="grid aspect-[2/1] place-items-center">
          <Illustration icon={product.icon} className="h-[82%]" />
        </a>

        <p class={`mt-3 text-sm ${featured ? 'text-olive' : 'text-steel'}`}>
          {product.brand}
          {featured && <span class="sr-only">. Destacado</span>}
        </p>
        <h3 class="mt-0.5 font-semibold leading-snug">
          <a href={href} class="hover:underline hover:underline-offset-[0.2em]">
            {product.name}
          </a>
        </h3>
        {note && <p class={`mt-2 text-sm ${featured ? 'text-olive' : 'text-steel'}`}>{note}</p>}

        <div class="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-3 pt-4">
          <p class="price text-[1.6rem] sm:text-[1.9rem]">{formatPrice(product.price)}</p>
          {mustChooseSize ? (
            <a href={href} class="button button-sm button-quiet">
              Elegir talla
            </a>
          ) : (
            <button
              type="button"
              class="button button-sm"
              onClick={() => addToCart(product.id, sizes[0])}
              aria-label={`Agregar ${product.name} al pedido`}
            >
              Agregar
            </button>
          )}
        </div>
      </article>
    </div>
  );
}
