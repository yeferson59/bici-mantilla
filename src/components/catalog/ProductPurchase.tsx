import { useState } from 'react';
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
          <legend className="field-label">Talla</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Talla">
            {sizes.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={size === t}
                className="chip min-w-12 justify-center"
                onClick={() => {
                  setSize(t);
                  setMissingSize(false);
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <p className={`mt-2 text-sm ${missingSize ? 'text-yellow' : 'text-fog'}`} role={missingSize ? 'alert' : undefined}>
            {missingSize ? (
              'Elige una talla para agregarla al pedido.'
            ) : product.category === 'bikes' ? (
              <>
                ¿No sabes cuál es la tuya?{' '}
                <a href="/encuentra-tu-bici" className="link">
                  Calcula tu talla
                </a>
              </>
            ) : null}
          </p>
        </fieldset>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <div className="flex items-center bg-carbon-800">
          <button
            type="button"
            className="size-12 text-xl hover:bg-carbon-700"
            onClick={() => setQuantity((n) => Math.max(1, n - 1))}
            aria-label="Una unidad menos"
          >
            −
          </button>
          <span className="w-10 text-center font-semibold" aria-live="polite" aria-label={`Cantidad: ${quantity}`}>
            {quantity}
          </span>
          <button
            type="button"
            className="size-12 text-xl hover:bg-carbon-700"
            onClick={() => setQuantity((n) => Math.min(20, n + 1))}
            aria-label="Una unidad más"
          >
            +
          </button>
        </div>
        <button type="button" className="button" onClick={onAdd}>
          Agregar al pedido
        </button>
      </div>

      <p className="mt-5 text-fog">
        ¿Tienes dudas?{' '}
        <a href={whatsAppLink(inquiryMessage(product.name))} target="_blank" rel="noopener" className="link">
          Pregunta por este producto en WhatsApp
        </a>
      </p>
    </div>
  );
}
