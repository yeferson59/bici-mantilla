import { useMemo, useState } from 'react';
import { formatPrice } from '../lib/price';
import { comesInSize, sizeFor } from '../lib/sizes';
import { LEVELS, type Level, type Product, type Use } from '../lib/types';
import { whatsAppLink } from '../lib/whatsapp';
import ProductCard from './catalog/ProductCard';

const USE_OPTIONS: { value: Use; title: string; detail: string }[] = [
  { value: 'city', title: 'Moverme por la ciudad', detail: 'Trabajo, mandados y ciclovía' },
  { value: 'mountain', title: 'Salir a la trocha', detail: 'Destapado, montaña y barro' },
  { value: 'road', title: 'Rodar largo en carretera', detail: 'Kilómetros, subidas y grupo' },
  { value: 'kids', title: 'Es para un niño o una niña', detail: 'De la primera bici a la juvenil' },
];

const LEVEL_TEXT: Record<Level, { title: string; detail: string }> = {
  beginner: { title: 'Estoy empezando', detail: 'O vuelvo después de mucho tiempo' },
  intermediate: { title: 'Salgo los fines de semana', detail: 'Ya tengo ritmo y quiero mejorar' },
  advanced: { title: 'Entreno varias veces por semana', detail: 'Busco rendimiento' },
};

const USE_TEXT: Record<Use, string> = {
  city: 'ciudad',
  mountain: 'montaña',
  road: 'ruta',
  kids: 'niños',
};

type Step = 'use' | 'level' | 'height' | 'budget' | 'result';

export default function Quiz({ bikes }: { bikes: Product[] }) {
  const [step, setStep] = useState<Step>('use');
  const [use, setUse] = useState<Use | null>(null);
  const [level, setLevel] = useState<Level>('beginner');
  const [height, setHeight] = useState(170);
  const [budget, setBudget] = useState(0);

  // Kids are not asked about their level.
  const steps: Step[] = use === 'kids' ? ['use', 'height', 'budget'] : ['use', 'level', 'height', 'budget'];
  const index = steps.indexOf(step);

  const candidates = useMemo(() => bikes.filter((b) => use && b.uses?.includes(use)), [bikes, use]);
  const range = useMemo(() => {
    const prices = candidates.map((b) => b.price);
    if (!prices.length) return { min: 0, max: 0 };
    const round = (n: number, f: (x: number) => number) => f(n / 50000) * 50000;
    // Both ends are rounded up: the cheapest bike always fits at the minimum.
    return { min: round(Math.min(...prices), Math.ceil), max: round(Math.max(...prices), Math.ceil) };
  }, [candidates]);

  const chooseUse = (u: Use) => {
    setUse(u);
    setHeight(u === 'kids' ? 120 : 170);
    setStep(u === 'kids' ? 'height' : 'level');
  };

  const size = use ? sizeFor(height, use) : '';

  const result = useMemo(() => {
    if (!use) return { list: [], anyFits: false };
    const withinBudget = candidates.filter((b) => b.price <= budget);
    const anyFits = withinBudget.length > 0;
    const score = (b: Product) => {
      const levelDistance = Math.abs(LEVELS.indexOf(b.level ?? 'beginner') - LEVELS.indexOf(level));
      return (
        (comesInSize(b.sizes, size) ? 3 : 0) +
        (use === 'kids' ? 0 : 2 - levelDistance) +
        // Within budget, the one that makes the most of it; over budget, the one that goes over the least.
        (anyFits ? b.price / budget : -b.price / range.max)
      );
    };
    const list = [...(anyFits ? withinBudget : candidates)].sort((a, b) => score(b) - score(a)).slice(0, 3);
    return { list, anyFits };
  }, [candidates, use, level, size, budget, range.max]);

  const restart = () => {
    setUse(null);
    setLevel('beginner');
    setStep('use');
  };

  const goBack = () => setStep(index > 0 ? steps[index - 1] : 'use');

  const message =
    use &&
    (use === 'kids'
      ? `Hola, hice el quiz de la web. Busco una bici para un niño o una niña que mide ${height} cm (${size}) y mi presupuesto es de ${formatPrice(budget)}. ¿Qué me recomiendan?`
      : `Hola, hice el quiz de la web. Busco una bici de ${USE_TEXT[use]}, mido ${height} cm (talla ${size}) y mi presupuesto es de ${formatPrice(budget)}. ¿Qué me recomiendan?`);

  return (
    <div className="plate p-6 pb-9 sm:p-9 sm:pb-11">
      {step !== 'result' && (
        <div className="mb-7">
          <p className="text-sm text-fog">
            Pregunta {index + 1} de {steps.length}
          </p>
          <div className="mt-2 h-1.5 -skew-x-[24deg] bg-carbon-700" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={index} aria-label="Avance del quiz">
            <div className="h-full bg-yellow transition-[width] duration-300" style={{ width: `${(index / steps.length) * 100}%` }} />
          </div>
        </div>
      )}

      {step === 'use' && (
        <fieldset>
          <legend className="headline headline-m">¿Para qué la quieres?</legend>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {USE_OPTIONS.map((u) => (
              <button key={u.value} type="button" className="bg-carbon-700 p-4 text-left hover:bg-carbon-600" onClick={() => chooseUse(u.value)}>
                <span className="block text-lg font-semibold">{u.title}</span>
                <span className="text-fog">{u.detail}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {step === 'level' && (
        <fieldset>
          <legend className="headline headline-m">¿Qué tanto ruedas?</legend>
          <div className="mt-5 grid gap-3">
            {LEVELS.map((n) => (
              <button
                key={n}
                type="button"
                className="bg-carbon-700 p-4 text-left hover:bg-carbon-600"
                onClick={() => {
                  setLevel(n);
                  setStep('height');
                }}
              >
                <span className="block text-lg font-semibold">{LEVEL_TEXT[n].title}</span>
                <span className="text-fog">{LEVEL_TEXT[n].detail}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {step === 'height' && use && (
        <div>
          <label htmlFor="quiz-height" className="headline headline-m block">
            {use === 'kids' ? '¿Cuánto mide?' : '¿Cuánto mides?'}
          </label>
          <p className="headline mt-5 text-7xl text-yellow">
            {height} <span className="text-3xl text-chalk">cm</span>
          </p>
          <input
            id="quiz-height"
            type="range"
            className="mt-4 w-full accent-yellow"
            min={use === 'kids' ? 90 : 145}
            max={use === 'kids' ? 165 : 200}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
          />
          <p className="mt-3 text-fog" aria-live="polite">
            Con esa estatura la talla es <strong className="text-chalk">{size}</strong>.
          </p>
          <button
            type="button"
            className="button mt-6"
            onClick={() => {
              setBudget(Math.round((range.min + range.max) / 2 / 50000) * 50000);
              setStep('budget');
            }}
          >
            Siguiente
          </button>
        </div>
      )}

      {step === 'budget' && (
        <div>
          <label htmlFor="quiz-budget" className="headline headline-m block">
            ¿Hasta cuánto quieres invertir?
          </label>
          <p className="headline mt-5 text-6xl text-yellow sm:text-7xl">{formatPrice(budget)}</p>
          <input
            id="quiz-budget"
            type="range"
            className="mt-4 w-full accent-yellow"
            min={range.min}
            max={range.max}
            step={50000}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
          />
          <button type="button" className="button mt-6" onClick={() => setStep('result')}>
            Ver mis bicis
          </button>
        </div>
      )}

      {step === 'result' && use && (
        <div aria-live="polite">
          <p className="text-fog">Tu talla</p>
          <p className="headline text-7xl text-yellow">{size}</p>
          <p className="mt-2 max-w-[38rem] text-fog">
            Es una guía según la estatura. El largo de piernas y brazos también cuenta: en la tienda te medimos y la confirmamos.
          </p>

          <h2 className="headline headline-m mt-8">
            {result.anyFits ? 'Estas son para ti' : 'Ninguna entra en ese presupuesto'}
          </h2>
          {!result.anyFits && <p className="mt-2 text-fog">Estas son las que más se acercan.</p>}
          <ul className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-5 [--color-carbon-800:var(--color-carbon-700)]">
            {result.list.map((b) => (
              <li key={b.id}>
                <ProductCard
                  product={b}
                  note={comesInSize(b.sizes, size) ? `Viene en talla ${size}` : `No viene en talla ${size}: pregunta por otras opciones`}
                />
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            {message && (
              <a href={whatsAppLink(message)} target="_blank" rel="noopener" className="button">
                Pedir asesoría por WhatsApp
              </a>
            )}
            <button type="button" className="button button-dark" onClick={restart}>
              Empezar de nuevo
            </button>
          </div>
        </div>
      )}

      {step !== 'use' && step !== 'result' && (
        <button type="button" className="mt-6 block py-1 text-fog underline underline-offset-2 hover:text-chalk" onClick={goBack}>
          Volver a la pregunta anterior
        </button>
      )}
    </div>
  );
}
