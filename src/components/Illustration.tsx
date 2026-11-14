import type { ComponentChildren } from 'preact';
import type { Icon } from '../lib/types';

/**
 * Placeholder illustrations for the products, until the real photos arrive.
 * White strokes with a yellow detail, on a 64 × 64 grid.
 */
const A = { stroke: 'var(--color-yellow)' };

const DRAWINGS: Record<Icon, ComponentChildren> = {
  bike: (
    <>
      <circle cx="14" cy="42" r="11" />
      <circle cx="50" cy="42" r="11" />
      <path d="M28 42 24 24 42 24M28 42 43 26M24 24 14 42H28M43 24 50 42" {...A} />
      <path d="M19 22H29M42 24 43 18H49" />
    </>
  ),
  chain: (
    <>
      <circle cx="21" cy="32" r="14" />
      <circle cx="21" cy="32" r="4" />
      <circle cx="50" cy="32" r="6" />
      <path d="M21 18 50 26M21 46 50 38" {...A} />
    </>
  ),
  cassette: (
    <>
      <path d="M14 10V54M21 13V51M28 17V47M35 21V43M42 25V39" />
      <path d="M49 28V36M8 32H56" {...A} />
    </>
  ),
  brake: (
    <>
      <circle cx="30" cy="34" r="21" />
      <circle cx="30" cy="34" r="7" />
      <path d="M30 18V22M30 46V50M14 34H18M42 34H46M19 23 22 26M38 42 41 45M41 23 38 26M22 42 19 45" stroke-width="2" />
      <rect x="40" y="8" width="16" height="13" rx="2" transform="rotate(28 48 14)" {...A} />
    </>
  ),
  tire: (
    <>
      <circle cx="32" cy="32" r="24" />
      <circle cx="32" cy="32" r="16" {...A} />
      <path d="M32 4V9M32 55V60M4 32H9M55 32H60M12 12 16 16M48 48 52 52M52 12 48 16M16 48 12 52" stroke-width="2" />
    </>
  ),
  saddle: (
    <>
      <path d="M8 26Q20 16 42 21L56 24Q60 32 50 32L22 35Q9 36 8 26Z" />
      <path d="M22 35 30 42H40L46 33M35 42V58" {...A} />
    </>
  ),
  handlebar: (
    <>
      <path d="M6 30H58" />
      <path d="M6 30H18M46 30H58" stroke-width="7" {...A} />
      <path d="M32 30V46M26 46H38" />
    </>
  ),
  light: (
    <>
      <rect x="10" y="22" width="26" height="20" rx="4" />
      <path d="M36 26 42 22V42L36 38" />
      <path d="M48 20 56 14M50 32H60M48 44 56 50" {...A} />
    </>
  ),
  lock: (
    <>
      <rect x="16" y="34" width="32" height="20" rx="3" />
      <path d="M22 34V20A10 10 0 0 1 42 20V34" {...A} />
      <path d="M32 41V47" />
    </>
  ),
  pump: (
    <>
      <path d="M22 10H42M32 10V20" {...A} />
      <rect x="28" y="20" width="8" height="32" rx="1" />
      <path d="M20 54H44M36 44Q50 44 48 30" />
      <circle cx="32" cy="34" r="1.5" />
    </>
  ),
  bottle: (
    <>
      <rect x="22" y="22" width="20" height="34" rx="5" />
      <path d="M26 22V15H38V22" />
      <path d="M29 15V8H35V15M22 34H42" {...A} />
    </>
  ),
  tool: (
    <>
      <path d="M16 10V46H38" />
      <path d="M28 10V34H50" {...A} />
      <path d="M12 54H52" stroke-width="2" />
    </>
  ),
  helmet: (
    <>
      <path d="M8 38Q10 14 32 13Q54 13 56 36L46 39Q30 33 8 38Z" />
      <path d="M22 20 18 33M32 17V32M42 20 45 34" stroke-width="2" {...A} />
      <path d="M18 37 26 52H36L42 38" stroke-width="2" />
    </>
  ),
  gloves: (
    <>
      <path d="M20 56V34L14 26Q13 22 17 22L24 28V14Q24 10 27.5 10T31 14V10Q31 6 34.5 6T38 10V14Q38 10 41.5 10T45 14V20Q45 17 48 17T51 21V40Q51 50 44 56Z" />
      <path d="M20 48H46" {...A} />
    </>
  ),
  jersey: (
    <>
      <path d="M22 10 8 18 14 30 20 26V54H44V26L50 30 56 18 42 10Q32 18 22 10Z" />
      <path d="M32 16V54" stroke-width="2" {...A} />
    </>
  ),
  shorts: (
    <>
      <path d="M16 10H48L52 52H36L32 28 28 52H12Z" />
      <path d="M14 44H29M35 44H51" {...A} />
    </>
  ),
};

export default function Illustration({ icon, className }: { icon: Icon; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      class={className}
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {DRAWINGS[icon]}
    </svg>
  );
}
