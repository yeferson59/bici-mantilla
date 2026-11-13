/**
 * Loads and validates the catalog at build time.
 * If someone edits a JSON file and leaves bad data, the build fails with a clear message
 * instead of publishing a broken page.
 */
import { z } from 'astro/zod';
import rawProducts from '../data/products.json';
import rawServices from '../data/services.json';
import { CATEGORIES, ICONS, LEVELS, USES, ZONES, type Product, type Service } from './types';

const productSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'The id can only contain lowercase letters, numbers and hyphens'),
  name: z.string().min(1),
  category: z.enum(CATEGORIES),
  brand: z.string().min(1),
  price: z.number().int().positive(),
  icon: z.enum(ICONS),
  description: z.string().min(1),
  zone: z.enum(ZONES).optional(),
  uses: z.array(z.enum(USES)).optional(),
  level: z.enum(LEVELS).optional(),
  sizes: z.array(z.string().min(1)).optional(),
  featured: z.boolean().optional(),
});

const serviceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  price: z.number().int().positive(),
  duration: z.string().min(1),
  description: z.string().min(1),
});

function validate<T>(schema: z.ZodType<T>, data: unknown, file: string): T[] {
  const result = z.array(schema).safeParse(data);
  if (!result.success) {
    const detail = result.error.issues
      .map((i) => `  - at ${i.path.join(' → ')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid data in src/data/${file}:\n${detail}`);
  }
  const ids = new Set<string>();
  for (const item of result.data as { id: string }[]) {
    if (ids.has(item.id)) throw new Error(`Duplicate id in src/data/${file}: "${item.id}"`);
    ids.add(item.id);
  }
  return result.data;
}

export const products: Product[] = validate(productSchema, rawProducts, 'products.json');
export const services: Service[] = validate(serviceSchema, rawServices, 'services.json');
