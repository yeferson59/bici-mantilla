import type { Use } from './types';

/**
 * Rough size guide based on height in centimeters.
 * It is a starting point: leg and arm length also matter,
 * which is why the site invites people to confirm the size in the shop.
 */
export function sizeFor(heightCm: number, use: Use): string {
  if (use === 'kids') {
    if (heightCm < 110) return 'Rin 12';
    if (heightCm < 122) return 'Rin 16';
    if (heightCm < 136) return 'Rin 20';
    if (heightCm < 152) return 'Rin 24';
    return 'XS';
  }
  if (heightCm < 157) return 'XS';
  if (heightCm < 168) return 'S';
  if (heightCm < 178) return 'M';
  if (heightCm < 188) return 'L';
  return 'XL';
}

/** A one-size bike fits any adult height. */
export function comesInSize(sizes: string[] | undefined, size: string): boolean {
  if (!sizes?.length) return true;
  return sizes.includes(size) || sizes.includes('Única');
}
