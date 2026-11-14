import { useEffect, useMemo, useState } from 'preact/hooks';
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
      <div class="flex flex-wrap gap-2" role="group" aria-label="Categoría">
        <button type="button" class="chip" aria-pressed={!category} onClick={() => setCategory(null)}>
          Todo
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" class="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
            {CATEGORY_NAME[c]}
          </button>
        ))}
      </div>

      <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label class="field-label" for="filter-search">
            Buscar
          </label>
          <input
            id="filter-search"
            type="search"
            class="field"
            placeholder="Cadena, casco, rin 29…"
            value={search}
            onInput={(e) => setSearch(e.currentTarget.value)}
          />
        </div>
        <div>
          <label class="field-label" for="filter-brand">
            Marca
          </label>
          <select id="filter-brand" class="field" value={brand} onChange={(e) => setBrand(e.currentTarget.value)}>
            <option value="">Todas</option>
            {brands.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label class="field-label" for="filter-price">
            Precio hasta <span class="price text-xl">{formatPrice(priceLimit)}</span>
          </label>
          <input
            id="filter-price"
            type="range"
            class="mt-3 w-full accent-ink"
            min={50000}
            max={maxPrice}
            step={50000}
            value={priceLimit}
            onInput={(e) => setPriceLimit(Number(e.currentTarget.value))}
          />
        </div>
        <div>
          <label class="field-label" for="filter-sort">
            Ordenar
          </label>
          <select id="filter-sort" class="field" value={sortOrder} onChange={(e) => setSortOrder(e.currentTarget.value as SortOrder)}>
            <option value="featured">Destacados primero</option>
            <option value="lowest">Menor precio</option>
            <option value="highest">Mayor precio</option>
          </select>
        </div>
      </div>

      <div class="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-steel" aria-live="polite">
        <p>
          {visible.length} {visible.length === 1 ? 'producto' : 'productos'}
        </p>
        {zone && (
          <button type="button" class="chip min-h-9 py-0 text-sm" aria-pressed="true" onClick={() => setZone(null)}>
            {ZONE_NAME[zone]} ✕<span class="sr-only"> (quitar este filtro)</span>
          </button>
        )}
        {hasFilters && (
          <button type="button" class="link" onClick={clearFilters}>
            Quitar filtros
          </button>
        )}
      </div>

      <h2 class="sr-only">Productos</h2>
      <div class="wall mt-5 px-3 pb-8 pt-5 sm:px-8 sm:pb-12 sm:pt-8">
        {visible.length ? (
          <ul class="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] sm:gap-x-6 sm:gap-y-8">
            {visible.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        ) : (
          <div class="ticket max-w-[34rem] p-7">
            <p class="headline headline-m">Ningún producto coincide con esos filtros.</p>
            <p class="mt-3 text-steel">Prueba con otra palabra o sube el precio máximo.</p>
            <button type="button" class="button mt-5" onClick={clearFilters}>
              Quitar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
