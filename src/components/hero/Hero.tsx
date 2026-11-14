import { useEffect, useRef, useState } from 'preact/hooks';
import BikeSVG from '../BikeSVG';
import type { HeroScene, Region } from './scene';
import { clamp, smoothstep, TIMING } from './timing';

/** Scroll range each act covers, and the color of its segment in the progress bar. */
const ACTS = [
  { until: TIMING.walkEnd, color: 'var(--color-red)' },
  { until: TIMING.seated, color: 'var(--color-chalk)' },
  { until: 1, color: 'var(--color-yellow)' },
];

function opacities(p: number) {
  return [
    1 - smoothstep(0.27, 0.35, p),
    smoothstep(0.36, 0.42, p) * (1 - smoothstep(0.58, 0.64, p)),
    smoothstep(0.66, 0.74, p),
  ];
}

/** On wide screens the text goes on the left; on portrait screens, on top. */
function freeRegion(width: number, height: number): Region {
  return width >= 960 && width / height >= 1.2 ? { x: 0.34, y: 0 } : { x: 0, y: 0.36 };
}

export default function Hero() {
  const section = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const actRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barRefs = useRef<(HTMLElement | null)[]>([]);
  const hint = useRef<HTMLParagraphElement>(null);
  const [no3d, setNo3d] = useState(false);

  useEffect(() => {
    const root = section.current!;
    const canvas = canvasRef.current!;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let scene: HeroScene | null = null;
    let frameId = 0;
    let cancelled = false;
    let visible = true;
    const cleanup: (() => void)[] = [];

    const measure = () => {
      const { width, height } = canvas.getBoundingClientRect();
      scene?.resize(Math.max(1, width), Math.max(1, height), freeRegion(width, height));
    };

    const scrollProgress = () => {
      const box = root.getBoundingClientRect();
      const travel = box.height - window.innerHeight;
      return travel > 0 ? clamp(-box.top / travel) : 0;
    };

    const paintText = (p: number) => {
      opacities(p).forEach((o, i) => {
        const el = actRefs.current[i];
        if (!el) return;
        el.style.opacity = String(o);
        el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
        el.style.transform = `translateX(${(o - 1) * 28}px)`;
      });
      let from = 0;
      ACTS.forEach((act, i) => {
        const fill = clamp((p - from) / (act.until - from));
        const bar = barRefs.current[i];
        if (bar) bar.style.transform = `scaleX(${fill})`;
        from = act.until;
      });
      if (hint.current) hint.current.style.opacity = String(1 - smoothstep(0.01, 0.05, p));
    };

    import('./scene')
      .then(({ createScene }) => {
        if (cancelled) return;
        try {
          scene = createScene(canvas);
        } catch {
          setNo3d(true); // no WebGL: the drawn bike stays
          return;
        }

        if (reducedMotion) {
          // Reduced motion: a single still of the sprint, no scroll animation.
          measure();
          scene.update(0.93, 0);
          const onResize = () => {
            measure();
            scene?.update(0.93, 0);
          };
          window.addEventListener('resize', onResize);
          cleanup.push(() => window.removeEventListener('resize', onResize));
          return;
        }

        root.classList.add('hero--active');
        measure();

        let p = scrollProgress();
        let last = performance.now();
        let slowFrames = 0;
        let measuredFrames = 0;

        const loop = (now: number) => {
          frameId = requestAnimationFrame(loop);
          const dt = Math.min(0.1, (now - last) / 1000);
          last = now;
          if (!visible) return;
          // Progress chases the scroll with a bit of inertia so the motion is not jerky.
          p += (scrollProgress() - p) * (1 - Math.exp(-dt * 7));
          paintText(p);
          scene!.update(p, dt);

          // If the device can't keep up during the first frames, lower the resolution.
          if (measuredFrames < 90) {
            measuredFrames++;
            if (dt > 0.034) slowFrames++;
            if (measuredFrames === 90 && slowFrames > 45) scene!.lowerQuality();
          }
        };
        frameId = requestAnimationFrame(loop);

        const resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(canvas);
        const visibilityObserver = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
        });
        visibilityObserver.observe(root);
        cleanup.push(
          () => resizeObserver.disconnect(),
          () => visibilityObserver.disconnect(),
        );
      })
      .catch(() => setNo3d(true));

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      cleanup.forEach((f) => f());
      root.classList.remove('hero--active');
      scene?.dispose();
    };
  }, []);

  return (
    <section ref={section} class="hero hex-bg bg-carbon-900" aria-label="Presentación">
      <div class="hero-sticky">
        {no3d ? (
          <div class="absolute inset-x-0 bottom-0 flex justify-end px-5 pb-10 opacity-60" aria-hidden="true">
            <BikeSVG className="w-[min(100%,44rem)]" />
          </div>
        ) : (
          <canvas ref={canvasRef} class="hero-canvas" aria-hidden="true" />
        )}

        <div class="hero-text wrapper">
          <div class="act" data-act="1" ref={(el) => void (actRefs.current[0] = el)}>
            <h1 class="headline headline-xl">Todo empieza a pie.</h1>
            <p class="mt-5 max-w-[26rem] text-lg text-fog">
              Y termina encima de la bici correcta. Bicicletas, repuestos, accesorios y taller en un solo lugar.
            </p>
          </div>

          <div class="act" data-act="2" ref={(el) => void (actRefs.current[1] = el)}>
            <p class="headline headline-xl">Súbete.</p>
            <p class="mt-5 max-w-[26rem] text-lg text-fog">
              Te ayudamos a elegir la talla y te la entregamos ajustada, lista para rodar.
            </p>
          </div>

          <div class="act" data-act="3" ref={(el) => void (actRefs.current[2] = el)}>
            <p class="headline headline-xl animated-only">Arranca.</p>
            <p class="animated-only mt-5 max-w-[26rem] text-lg text-fog">
              Arma tu pedido aquí y lo cerramos por WhatsApp.
            </p>
            <div class="mt-7 flex flex-wrap gap-3">
              <a href="/catalogo" class="button">
                Ver el catálogo
              </a>
              <a href="/encuentra-tu-bici" class="button button-dark">
                Encuentra tu bici
              </a>
            </div>
          </div>
        </div>

        <p ref={hint} class="hero-hint wrapper text-sm text-fog" aria-hidden="true">
          Baja para verla arrancar
        </p>

        <div class="hero-progress wrapper" aria-hidden="true">
          {ACTS.map((act, i) => {
            const from = i === 0 ? 0 : ACTS[i - 1].until;
            return (
              <span key={i} style={{ flexGrow: act.until - from }}>
                <i ref={(el) => void (barRefs.current[i] = el)} style={{ background: act.color }} />
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
