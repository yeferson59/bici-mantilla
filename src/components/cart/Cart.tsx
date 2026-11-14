import { useStore } from '@nanostores/preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { formatPrice } from '../../lib/price';
import type { Icon } from '../../lib/types';
import { orderMessage, whatsAppLink } from '../../lib/whatsapp';
import { cartLines, changeQuantity, clearCart, isCartOpen, removeFromCart } from '../../stores/cart';
import Illustration from '../Illustration';
import Portal from '../Portal';

export interface ProductSummary {
  id: string;
  name: string;
  price: number;
  icon: Icon;
}

/** Header button and side panel with the order. */
export default function Cart({ products }: { products: ProductSummary[] }) {
  const $lines = useStore(cartLines);
  const open = useStore(isCartOpen);
  // The order lives in the browser: until mount, server and client render the same thing (empty).
  const [mounted, setMounted] = useState(false);
  const openButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => setMounted(true), []);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const rows = mounted
    ? $lines.flatMap((l) => {
        const product = byId.get(l.id);
        return product ? [{ ...l, product }] : [];
      })
    : [];
  const count = rows.reduce((n, r) => n + r.quantity, 0);
  const total = rows.reduce((n, r) => n + r.quantity * r.product.price, 0);

  useEffect(() => {
    if (open) {
      closeButton.current?.focus();
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      if (wasOpen.current) openButton.current?.focus();
    }
    wasOpen.current = open;
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return isCartOpen.set(false);
      if (e.key !== 'Tab' || !panel.current) return;
      // The order is modal: Tab wraps around inside the panel instead of escaping to the page behind.
      const focusables = panel.current.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)');
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;
      const target = !panel.current.contains(current)
        ? first
        : e.shiftKey && current === first
          ? last
          : !e.shiftKey && current === last
            ? first
            : null;
      if (target) {
        e.preventDefault();
        target.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const close = () => isCartOpen.set(false);
  const orderLink = whatsAppLink(
    orderMessage(
      rows.map((r) => ({
        name: r.product.name,
        size: r.size,
        quantity: r.quantity,
        price: r.product.price,
      })),
    ),
  );

  return (
    <>
      <button
        ref={openButton}
        type="button"
        onClick={() => isCartOpen.set(true)}
        class="flex min-h-11 items-center gap-2 px-2 font-semibold underline-offset-[0.35em] hover:underline"
        aria-label={`Abrir tu pedido: ${count} ${count === 1 ? 'producto' : 'productos'}`}
      >
        <svg viewBox="0 0 24 24" class="size-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 4h2.5l2.2 11h10.6L20.5 7H7" />
          <circle cx="9.5" cy="19" r="1.4" />
          <circle cx="16.5" cy="19" r="1.4" />
        </svg>
        <span class="hidden sm:inline">Pedido</span>
        <span
          class={`min-w-7 -skew-x-12 px-1.5 text-center text-sm font-bold ${
            count ? 'bg-ink text-yellow' : 'bg-black/10 text-ink'
          }`}
        >
          <span class="inline-block skew-x-12">{count}</span>
        </span>
      </button>

      {mounted && (
        <Portal>
          <div class="fixed inset-0 z-50" style={{ pointerEvents: open ? 'auto' : 'none' }} inert={!open}>
            <div
              class="drawer-backdrop absolute inset-0 bg-black/60"
              style={{ opacity: open ? 1 : 0 }}
              onClick={close}
            />
            <div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-label="Tu pedido"
              class="drawer absolute inset-y-0 right-0 flex w-[min(100%,26rem)] flex-col bg-card"
              style={{ transform: open ? 'none' : 'translateX(100%)' }}
            >
              <header class="signboard flex items-center justify-between border-b-2 border-ink px-5 py-4">
                <h2 class="headline headline-m">Tu pedido</h2>
                <button ref={closeButton} type="button" onClick={close} class="min-h-11 px-2 font-semibold underline-offset-[0.35em] hover:underline">
                  Cerrar
                </button>
              </header>

              {rows.length === 0 ? (
                <div class="flex flex-1 flex-col items-start gap-5 px-5 py-8">
                  <p class="text-steel">Tu pedido está vacío. Agrega productos desde el catálogo y aparecerán aquí.</p>
                  <a href="/catalogo" class="button">
                    Ver el catálogo
                  </a>
                </div>
              ) : (
                <>
                  <ul class="flex-1 divide-y divide-rule overflow-y-auto px-5">
                    {rows.map((r) => {
                      const name = r.size ? `${r.product.name}, talla ${r.size}` : r.product.name;
                      return (
                      <li key={`${r.id}/${r.size ?? ''}`} class="flex gap-3 py-4">
                        <div class="grid size-16 shrink-0 place-items-center bg-paper">
                          <Illustration icon={r.product.icon} className="size-10" />
                        </div>
                        <div class="min-w-0 flex-1">
                          <p class="font-semibold leading-snug">{r.product.name}</p>
                          {r.size && <p class="text-sm text-steel">Talla {r.size}</p>}
                          <div class="mt-2 flex items-center justify-between gap-2">
                            <div class="flex items-center border border-rule">
                              <button
                                type="button"
                                class="size-9 text-lg hover:bg-paper"
                                onClick={() => changeQuantity(r.id, r.size, -1)}
                                aria-label={`Quitar una unidad de ${name}`}
                              >
                                −
                              </button>
                              <span class="w-8 text-center font-semibold" aria-label={`${r.quantity} unidades`}>
                                {r.quantity}
                              </span>
                              <button
                                type="button"
                                class="size-9 text-lg hover:bg-paper"
                                onClick={() => changeQuantity(r.id, r.size, 1)}
                                aria-label={`Agregar una unidad de ${name}`}
                              >
                                +
                              </button>
                            </div>
                            <p class="price text-xl">{formatPrice(r.product.price * r.quantity)}</p>
                          </div>
                          <button
                            type="button"
                            class="mt-1 py-1 text-sm text-steel underline underline-offset-2 hover:text-ink"
                            onClick={() => removeFromCart(r.id, r.size)}
                            aria-label={`Quitar ${name} del pedido`}
                          >
                            Quitar
                          </button>
                        </div>
                      </li>
                      );
                    })}
                  </ul>

                  <footer class="border-t-2 border-ink px-5 py-5">
                    <div class="flex items-baseline justify-between">
                      <p class="font-semibold">Total</p>
                      <p class="price text-4xl">{formatPrice(total)}</p>
                    </div>
                    <a href={orderLink} target="_blank" rel="noopener" class="button mt-4 w-full">
                      Enviar pedido por WhatsApp
                    </a>
                    <p class="mt-3 text-sm text-steel">
                      Se abre WhatsApp con tu pedido ya escrito. Ahí confirmamos disponibilidad, pago y entrega.
                    </p>
                    <button
                      type="button"
                      class="mt-3 py-1 text-sm text-steel underline underline-offset-2 hover:text-ink"
                      onClick={clearCart}
                    >
                      Vaciar pedido
                    </button>
                  </footer>
                </>
              )}
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
