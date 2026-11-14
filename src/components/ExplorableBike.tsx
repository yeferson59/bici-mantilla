import { useState } from 'preact/hooks';
import { formatPrice } from '../lib/price';
import { ZONE_NAME, type Product, type Zone } from '../lib/types';
import { addToCart } from '../stores/cart';
import BikeSVG from './BikeSVG';
import Illustration from './Illustration';

/** Position of each hotspot over the drawing, as a percentage of width and height. */
const HOTSPOTS: { zone: Zone; x: number; y: number }[] = [
  { zone: 'drivetrain', x: 44.6, y: 70.3 },
  { zone: 'brakes', x: 77.9, y: 66.1 },
  { zone: 'wheels', x: 8.8, y: 46.1 },
  { zone: 'saddle', x: 33.9, y: 13.3 },
  { zone: 'handlebar', x: 72.1, y: 12.2 },
  { zone: 'lights', x: 72.1, y: 33.3 },
];

const BLURB: Record<Zone, string> = {
  drivetrain: 'Cadena, pacha y plato. Si los cambios saltan o la cadena suena, empieza por aquí.',
  brakes: 'Pastillas, discos y líquido. Si la palanca llega hasta el puño, toca revisarlos.',
  wheels: 'Llantas, neumáticos y rines: lo único de la bici que toca el suelo.',
  saddle: 'Sillines y tijas. La diferencia entre disfrutar la salida y contar los kilómetros.',
  handlebar: 'Manubrios, puños y potencias. Donde se decide el control y descansan las manos.',
  lights: 'Delanteras y traseras, para ver el camino y para que te vean.',
};

export default function ExplorableBike({ products }: { products: Product[] }) {
  const [zone, setZone] = useState<Zone>('drivetrain');
  const inZone = products.filter((p) => p.zone === zone);

  return (
    <div class="grid items-start gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
      <div class="ticket relative px-3 py-6 sm:px-8 sm:py-10">
        <div class="relative">
        <BikeSVG active={zone} className="block w-full" />
        {HOTSPOTS.map((hotspot) => (
          <button
            key={hotspot.zone}
            type="button"
            class="hotspot"
            style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
            aria-pressed={zone === hotspot.zone}
            aria-label={`Ver repuestos de ${ZONE_NAME[hotspot.zone].toLowerCase()}`}
            onClick={() => setZone(hotspot.zone)}
          />
        ))}
        </div>
      </div>

      <div class="lg:pt-2" aria-live="polite">
        <h3 class="headline headline-l">{ZONE_NAME[zone]}</h3>
        <p class="mt-3 max-w-[30rem] text-steel">{BLURB[zone]}</p>

        <ul class="mt-6 divide-y divide-rule border-y-2 border-ink">
          {inZone.map((p) => (
            <li key={p.id} class="flex items-center gap-3 py-3">
              <Illustration icon={p.icon} className="size-11 shrink-0" />
              <div class="min-w-0 flex-1">
                <a href={`/producto/${p.id}`} class="font-semibold leading-snug underline-offset-[0.2em] hover:underline">
                  {p.name}
                </a>
                <p class="price text-lg">{formatPrice(p.price)}</p>
              </div>
              <button
                type="button"
                class="button button-sm"
                onClick={() => addToCart(p.id, p.sizes?.[0])}
                aria-label={`Agregar ${p.name} al pedido`}
              >
                Agregar
              </button>
            </li>
          ))}
          {inZone.length === 0 && <li class="py-4 text-steel">Todavía no hay productos de esta zona en el catálogo.</li>}
        </ul>

        <a href={`/catalogo?zone=${zone}`} class="link mt-5 inline-block font-semibold">
          Ver todo lo de {ZONE_NAME[zone].toLowerCase()} en el catálogo
        </a>
      </div>
    </div>
  );
}
