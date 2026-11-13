import { useEffect, useMemo, useState } from 'react';
import { formatPrice } from '../../lib/price';
import { CATEGORIES, CATEGORY_NAME, ZONE_NAME, ZONES, type Category, type Product, type Zone } from '../../lib/types';
import ProductCard from './ProductCard';

type SortOrder = 'featured' | 'lowest' | 'highest';

const stripAccents = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export default function Catalog({ products }: { products: Product[] }) {
  const maxPrice = useMemo(() => Math.max(...products.map((p) => p.price)), [products]);
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand))].sort((a, b) => a.localeCompare(b, 'es')), [products]);

  const [category, setCategory] = useState<Category | null>(null);
  const [zone, setZone] = useState<Zone | null>(null);
  const [brand, setBrand] = useState('');
  const [search, setSearch] = useState('');
  const [priceLimit, setPriceLimit] = useState(maxPrice);
  const [sortOrder, setSortOrder] = useState<SortOrder>('featured');
  const [ready, setReady] = useState(false);

  // Filters can be opened from a link: /catalogo?category=parts&zone=brakes
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const c = q.get('category');
    const z = q.get('zone');
    if (c && (CATEGORIES as readonly string[]).includes(c)) setCategory(c as Category);
    if (z && (ZONES as readonly string[]).includes(z)) setZone(z as Zone);
    if (q.get('q')) setSearch(q.get('q')!);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams();
    if (category) q.set('category', category);
    if (zone) q.set('zone', zone);
    if (search.trim()) q.set('q', search.trim());
    const query = q.toString();
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
  }, [ready, category, zone, search]);

  const visible = useMemo(() => {
    const needle = stripAccents(search.trim());
    const list = products.filter(
      (p) =>
        (!category || p.category === category) &&
        (!zone || p.zone === zone) &&
        (!brand || p.brand === brand) &&
        p.price <= priceLimit &&
        (!needle || stripAccents(`${p.name} ${p.brand} ${p.description}`).includes(needle)),
    );
    if (sortOrder === 'lowest') return [...list].sort((a, b) => a.price - b.price);
    if (sortOrder === 'highest') return [...list].sort((a, b) => b.price - a.price);
    return [...list].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
  }, [products, category, zone, brand, search, priceLimit, sortOrder]);

  const hasFilters = !!(category || zone || brand || search.trim() || priceLimit < maxPrice);
  const clearFilters = () => {
    setCategory(null);
    setZone(null);
    setBrand('');
    setSearch('');
    setPriceLimit(maxPrice);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Categoría">
        <button type="button" className="chip" aria-pressed={!category} onClick={() => setCategory(null)}>
          Todo
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
            {CATEGORY_NAME[c]}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="field-label" htmlFor="filter-search">
            Buscar
          </label>
          <input
            id="filter-search"
            type="search"
            className="field"
            placeholder="Cadena, casco, rin 29…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="filter-brand">
            Marca
          </label>
          <select id="filter-brand" className="field" value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">Todas</option>
            {brands.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="filter-price">
            Precio hasta <span className="text-yellow">{formatPrice(priceLimit)}</span>
          </label>
          <input
            id="filter-price"
            type="range"
            className="mt-3 w-full accent-yellow"
            min={50000}
            max={maxPrice}
            step={50000}
            value={priceLimit}
            onChange={(e) => setPriceLimit(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="filter-sort">
            Ordenar
          </label>
          <select id="filter-sort" className="field" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)}>
            <option value="featured">Destacados primero</option>
            <option value="lowest">Menor precio</option>
            <option value="highest">Mayor precio</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-fog" aria-live="polite">
        <p>
          {visible.length} {visible.length === 1 ? 'producto' : 'productos'}
        </p>
        {zone && (
          <button type="button" className="chip min-h-9 py-0 text-sm" aria-pressed="true" onClick={() => setZone(null)}>
            {ZONE_NAME[zone]} ✕<span className="sr-only"> (quitar este filtro)</span>
          </button>
        )}
        {hasFilters && (
          <button type="button" className="link" onClick={clearFilters}>
            Quitar filtros
          </button>
        )}
      </div>

      <h2 className="sr-only">Productos</h2>
      {visible.length ? (
        <ul className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(15.5rem,1fr))] gap-5">
          {visible.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="plate mt-5 p-8">
          <p className="headline headline-m">Ningún producto coincide con esos filtros.</p>
          <p className="mt-3 text-fog">Prueba con otra palabra o sube el precio máximo.</p>
          <button type="button" className="button mt-5" onClick={clearFilters}>
            Quitar filtros
          </button>
        </div>
      )}
    </div>
  );
}
