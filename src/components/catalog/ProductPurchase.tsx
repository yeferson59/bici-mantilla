import { useState } from 'preact/hooks';
import type { Product } from '../../lib/types';
import { inquiryMessage, whatsAppLink } from '../../lib/whatsapp';
import { addToCart } from '../../stores/cart';

/** Size, quantity and add button on a product page. */
export default function ProductPurchase({ product }: { product: Product }) {
  const sizes = product.sizes ?? [];
  const [size, setSize] = useState<string | undefined>(sizes.length === 1 ? sizes[0] : undefined);
  const [quantity, setQuantity] = useState(1);
  const [missingSize, setMissingSize] = useState(false);

  const onAdd = () => {
    if (sizes.length && !size) {
      setMissingSize(true);
      return;
    }
    addToCart(product.id, size, quantity);
  };

  return (
    <div>
      {sizes.length > 0 && (
        <fieldset>
          <legend class="field-label">Talla</legend>
          <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Talla">
            {sizes.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={size === t}
                class="chip min-w-12 justify-center"
                onClick={() => {
                  setSize(t);
                  setMissingSize(false);
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <p class={`mt-2 text-sm ${missingSize ? 'font-semibold text-red' : 'text-steel'}`} role={missingSize ? 'alert' : undefined}>
            {missingSize ? (
              'Elige una talla para agregarla al pedido.'
            ) : product.category === 'bikes' ? (
              <>
                ¿No sabes cuál es la tuya?{' '}
                <a href="/encuentra-tu-bici" class="link">
                  Calcula tu talla
                </a>
              </>
            ) : null}
          </p>
        </fieldset>
      )}

      <div class="mt-5 flex flex-wrap items-center gap-4">
        <div class="flex items-center border border-rule bg-card">
          <button
            type="button"
            class="size-12 text-xl hover:bg-paper"
            onClick={() => setQuantity((n) => Math.max(1, n - 1))}
            aria-label="Una unidad menos"
          >
            −
          </button>
          <span class="w-10 text-center font-semibold" aria-live="polite" aria-label={`Cantidad: ${quantity}`}>
            {quantity}
          </span>
          <button
            type="button"
            class="size-12 text-xl hover:bg-paper"
            onClick={() => setQuantity((n) => Math.min(20, n + 1))}
            aria-label="Una unidad más"
          >
            +
          </button>
        </div>
        <button type="button" class="button" onClick={onAdd}>
          Agregar al pedido
        </button>
      </div>

      <p class="mt-5 text-steel">
        ¿Tienes dudas?{' '}
        <a href={whatsAppLink(inquiryMessage(product.name))} target="_blank" rel="noopener" class="link">
          Pregunta por este producto en WhatsApp
        </a>
      </p>
    </div>
  );
}
