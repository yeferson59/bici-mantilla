export const CATEGORIES = ['bikes', 'parts', 'accessories', 'apparel'] as const;
export type Category = (typeof CATEGORIES)[number];

export const ZONES = ['drivetrain', 'brakes', 'wheels', 'saddle', 'handlebar', 'lights'] as const;
export type Zone = (typeof ZONES)[number];

export const USES = ['city', 'mountain', 'road', 'kids'] as const;
export type Use = (typeof USES)[number];

export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type Level = (typeof LEVELS)[number];

export const ICONS = [
  'bike',
  'chain',
  'cassette',
  'brake',
  'tire',
  'saddle',
  'handlebar',
  'light',
  'lock',
  'pump',
  'bottle',
  'tool',
  'helmet',
  'gloves',
  'jersey',
  'shorts',
] as const;
export type Icon = (typeof ICONS)[number];

export interface Product {
  id: string;
  name: string;
  category: Category;
  brand: string;
  /** Colombian pesos, no decimals. */
  price: number;
  icon: Icon;
  description: string;
  /** Part of the bike it belongs to (used by the explorable bike). */
  zone?: Zone;
  /** Bikes only: what it is for and who it is for (used by the quiz). */
  uses?: Use[];
  level?: Level;
  sizes?: string[];
  featured?: boolean;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
}

export const CATEGORY_NAME: Record<Category, string> = {
  bikes: 'Bicicletas',
  parts: 'Repuestos',
  accessories: 'Accesorios',
  apparel: 'Ropa y protección',
};

export const ZONE_NAME: Record<Zone, string> = {
  drivetrain: 'Transmisión',
  brakes: 'Frenos',
  wheels: 'Ruedas',
  saddle: 'Sillín',
  handlebar: 'Manubrio',
  lights: 'Luces',
};
