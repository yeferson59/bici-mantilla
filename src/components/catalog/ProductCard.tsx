import type { TargetedPointerEvent } from 'preact';
import { formatPrice } from '../../lib/price';
import type { Product } from '../../lib/types';
import { addToCart } from '../../stores/cart';
import Illustration from '../Illustration';

/** The illustration tilts toward the cursor (mouse only). */
function tilt(e: TargetedPointerEvent<HTMLAnchorElement>) {
  if (e.pointerType !== 'mouse') return;
  const box = e.currentTarget.getBoundingClientRect();
  const x = (e.clientX - box.left) / box.width - 0.5;
  const y = (e.clientY - box.top) / box.height - 0.5;
  e.currentTarget.style.setProperty('--gx', `${(-y * 16).toFixed(1)}deg`);
  e.currentTarget.style.setProperty('--gy', `${(x * 20).toFixed(1)}deg`);
}

function straighten(e: TargetedPointerEvent<HTMLAnchorElement>) {
  e.currentTarget.style.setProperty('--gx', '0deg');
  e.currentTarget.style.setProperty('--gy', '0deg');
}

export default function ProductCard({ product, note }: { product: Product; note?: string }) {
  const href = `/producto/${product.id}`;
  const sizes = product.sizes ?? [];
  const mustChooseSize = sizes.length > 1;

  return (
    <article class="plate flex h-full flex-col">
      <a
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        onPointerMove={tilt}
        onPointerLeave={straighten}
        class="hex-bg relative grid aspect-[4/3] place-items-center bg-carbon-950 [perspective:600px]"
      >
        {product.featured && (
          <span class="stripe absolute left-4 top-4">
            <i />
            <i />
            <i />
          </span>
        )}
        <Illustration
          icon={product.icon}
          className="w-[46%] transition-transform duration-150 ease-out [transform:rotateX(var(--gx,0deg))_rotateY(var(--gy,0deg))]"
        />
      </a>

      <div class="flex flex-1 flex-col p-4 pb-5">
        <p class="text-sm text-fog">{product.brand}</p>
        <h3 class="mt-0.5 font-semibold leading-snug">
          <a href={href} class="hover:text-yellow">
            {product.name}
          </a>
        </h3>
        {note && <p class="mt-2 text-sm text-fog">{note}</p>}

        <div class="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-2 pt-4">
          <p class="headline text-[1.7rem]">{formatPrice(product.price)}</p>
          {mustChooseSize ? (
            <a href={href} class="button button-sm button-dark mr-3">
              Elegir talla
            </a>
          ) : (
            <button
              type="button"
              class="button button-sm mr-3"
              onClick={() => addToCart(product.id, sizes[0])}
              aria-label={`Agregar ${product.name} al pedido`}
            >
              Agregar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
