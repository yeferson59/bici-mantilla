import { persistentAtom } from '@nanostores/persistent';
import { atom, computed } from 'nanostores';

export interface CartLine {
  id: string;
  size?: string;
  quantity: number;
}

function decode(text: string): CartLine[] {
  try {
    const value = JSON.parse(text);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (l) => l && typeof l.id === 'string' && Number.isInteger(l.quantity) && l.quantity > 0,
    );
  } catch {
    return [];
  }
}

/** The cart is saved in the browser and shared across every page. */
export const cartLines = persistentAtom<CartLine[]>('mantilla:cart', [], {
  encode: JSON.stringify,
  decode,
});

export const isCartOpen = atom(false);

export const itemCount = computed(cartLines, (ls) => ls.reduce((n, l) => n + l.quantity, 0));

const sameLine = (l: CartLine, id: string, size?: string) => l.id === id && l.size === size;

export function addToCart(id: string, size?: string, quantity = 1) {
  const current = cartLines.get();
  const exists = current.some((l) => sameLine(l, id, size));
  cartLines.set(
    exists
      ? current.map((l) => (sameLine(l, id, size) ? { ...l, quantity: l.quantity + quantity } : l))
      : [...current, { id, size, quantity }],
  );
  isCartOpen.set(true);
}

export function changeQuantity(id: string, size: string | undefined, delta: number) {
  cartLines.set(
    cartLines
      .get()
      .map((l) => (sameLine(l, id, size) ? { ...l, quantity: l.quantity + delta } : l))
      .filter((l) => l.quantity > 0),
  );
}

export function removeFromCart(id: string, size?: string) {
  cartLines.set(cartLines.get().filter((l) => !sameLine(l, id, size)));
}

export function clearCart() {
  cartLines.set([]);
}
