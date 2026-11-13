import { useStore } from '@nanostores/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatPrice } from '../../lib/price';
import type { Icon } from '../../lib/types';
import { orderMessage, whatsAppLink } from '../../lib/whatsapp';
import { cartLines, changeQuantity, clearCart, isCartOpen, removeFromCart } from '../../stores/cart';
import Illustration from '../Illustration';

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
  const panel = useRef<HTMLElement>(null);
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
        className="flex min-h-11 items-center gap-2 px-2 font-semibold hover:text-yellow"
        aria-label={`Abrir tu pedido: ${count} ${count === 1 ? 'producto' : 'productos'}`}
      >
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 4h2.5l2.2 11h10.6L20.5 7H7" />
          <circle cx="9.5" cy="19" r="1.4" />
          <circle cx="16.5" cy="19" r="1.4" />
        </svg>
        <span className="hidden sm:inline">Pedido</span>
        <span
          className={`min-w-7 -skew-x-12 px-1.5 text-center text-sm font-bold ${
            count ? 'bg-yellow text-carbon-950' : 'bg-carbon-700 text-fog'
          }`}
        >
          <span className="inline-block skew-x-12">{count}</span>
        </span>
      </button>

      {mounted &&
        createPortal(
          <div className="fixed inset-0 z-50" style={{ pointerEvents: open ? 'auto' : 'none' }} inert={!open}>
            <div
              className="drawer-backdrop absolute inset-0 bg-black/60"
              style={{ opacity: open ? 1 : 0 }}
              onClick={close}
            />
            <aside
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-label="Tu pedido"
              className="drawer absolute inset-y-0 right-0 flex w-[min(100%,26rem)] flex-col bg-carbon-900"
              style={{ transform: open ? 'none' : 'translateX(100%)' }}
            >
              <header className="flex items-center justify-between border-b border-carbon-700 px-5 py-4">
                <h2 className="headline headline-m">Tu pedido</h2>
                <button ref={closeButton} type="button" onClick={close} className="min-h-11 px-2 font-semibold hover:text-yellow">
                  Cerrar
                </button>
              </header>

              {rows.length === 0 ? (
                <div className="flex flex-1 flex-col items-start gap-5 px-5 py-8">
                  <p className="text-fog">Tu pedido está vacío. Agrega productos desde el catálogo y aparecerán aquí.</p>
                  <a href="/catalogo" className="button">
                    Ver el catálogo
                  </a>
                </div>
              ) : (
                <>
                  <ul className="flex-1 divide-y divide-carbon-700 overflow-y-auto px-5">
                    {rows.map((r) => {
                      const name = r.size ? `${r.product.name}, talla ${r.size}` : r.product.name;
                      return (
                      <li key={`${r.id}/${r.size ?? ''}`} className="flex gap-3 py-4">
                        <div className="grid size-16 shrink-0 place-items-center bg-carbon-950">
                          <Illustration icon={r.product.icon} className="size-10" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold leading-snug">{r.product.name}</p>
                          {r.size && <p className="text-sm text-fog">Talla {r.size}</p>}
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="flex items-center bg-carbon-800">
                              <button
                                type="button"
                                className="size-9 text-lg hover:bg-carbon-700"
                                onClick={() => changeQuantity(r.id, r.size, -1)}
                                aria-label={`Quitar una unidad de ${name}`}
                              >
                                −
                              </button>
                              <span className="w-8 text-center font-semibold" aria-label={`${r.quantity} unidades`}>
                                {r.quantity}
                              </span>
                              <button
                                type="button"
                                className="size-9 text-lg hover:bg-carbon-700"
                                onClick={() => changeQuantity(r.id, r.size, 1)}
                                aria-label={`Agregar una unidad de ${name}`}
                              >
                                +
                              </button>
                            </div>
                            <p className="font-semibold">{formatPrice(r.product.price * r.quantity)}</p>
                          </div>
                          <button
                            type="button"
                            className="mt-1 py-1 text-sm text-fog underline underline-offset-2 hover:text-chalk"
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

                  <footer className="border-t border-carbon-700 px-5 py-5">
                    <div className="flex items-baseline justify-between">
                      <p className="text-fog">Total</p>
                      <p className="headline text-3xl">{formatPrice(total)}</p>
                    </div>
                    <a href={orderLink} target="_blank" rel="noopener" className="button mt-4 w-full">
                      Enviar pedido por WhatsApp
                    </a>
                    <p className="mt-3 text-sm text-fog">
                      Se abre WhatsApp con tu pedido ya escrito. Ahí confirmamos disponibilidad, pago y entrega.
                    </p>
                    <button
                      type="button"
                      className="mt-3 py-1 text-sm text-fog underline underline-offset-2 hover:text-chalk"
                      onClick={clearCart}
                    >
                      Vaciar pedido
                    </button>
                  </footer>
                </>
              )}
            </aside>
          </div>,
          document.body,
        )}
    </>
  );
}
