import type { Zone } from '../lib/types';

interface Props {
  /** Zone highlighted in yellow. */
  active?: Zone | null;
  className?: string;
}

/**
 * Side-view bike drawn in lines. Each group of parts carries its zone
 * so the explorable bike can highlight it.
 */
export default function BikeSVG({ active, className }: Props) {
  const zone = (z: Zone) => `bike-zone${active === z ? ' active' : ''}`;
  return (
    <svg viewBox="0 0 560 360" className={className} role="img" aria-label="Bicicleta vista de perfil">
      <g className={zone('wheels')}>
        <circle cx="121" cy="238" r="102" strokeWidth="6" />
        <circle cx="436" cy="238" r="102" strokeWidth="6" />
        <circle cx="121" cy="238" r="90" strokeWidth="1.5" />
        <circle cx="436" cy="238" r="90" strokeWidth="1.5" />
        <g strokeWidth="1.2">
          <path d="M121 148V328M31 238H211M57 174 185 302M185 174 57 302" />
          <path d="M436 148V328M346 238H526M372 174 500 302M500 174 372 302" />
        </g>
      </g>

      <g className="bike-stroke">
        <path d="M250 253 199 100 374 80M250 253 385 108M199 100 121 238H250M386 112 436 238" />
        <path d="M376 76 387 112" strokeWidth="9" />
      </g>

      <g className={zone('brakes')}>
        <circle cx="436" cy="238" r="26" />
        <circle cx="121" cy="238" r="26" />
        <rect x="410" y="204" width="13" height="18" rx="2" transform="rotate(-18 416 213)" />
        <rect x="131" y="205" width="13" height="18" rx="2" transform="rotate(24 137 214)" />
      </g>

      <g className={zone('drivetrain')}>
        <circle cx="250" cy="253" r="28" />
        <circle cx="121" cy="238" r="12" />
        <path d="M250 225 121 226M250 281 121 250" strokeWidth="2.5" />
        <path d="M250 253 292 282M250 253 208 224" strokeWidth="6" />
        <path d="M280 282H304M196 224H220" strokeWidth="7" />
      </g>

      <g className={zone('saddle')}>
        <path d="M199 100 191 58" />
        <path d="M158 50Q170 42 200 46L226 49Q230 57 219 57L172 59Q159 59 158 50Z" />
      </g>

      <g className={zone('handlebar')}>
        <path d="M376 76 370 54 398 48" />
        <path d="M392 49 420 44" strokeWidth="9" />
      </g>

      <g className={zone('lights')}>
        <rect x="392" y="112" width="24" height="14" rx="3" />
        <path d="M424 112 436 106M426 119H440M424 126 436 132" strokeWidth="2.5" />
        <rect x="174" y="72" width="13" height="12" rx="2" />
        <path d="M168 72 160 67M166 78H157M168 84 160 89" strokeWidth="2.5" />
      </g>
    </svg>
  );
}
