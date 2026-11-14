import type { TargetedSubmitEvent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { Service } from '../lib/types';
import { appointmentMessage, whatsAppLink } from '../lib/whatsapp';

const BIKE_TYPES = ['Montaña', 'Ruta', 'Urbana', 'Infantil', 'Eléctrica', 'Otra'];

const longDate = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

export default function WorkshopForm({ services }: { services: Service[] }) {
  const [today, setToday] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const d = new Date();
    setToday(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }, []);

  const onSubmit = (e: TargetedSubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const text = (field: string) => String(data.get(field) ?? '').trim();
    const [year, month, day] = text('date').split('-').map(Number);
    const link = whatsAppLink(
      appointmentMessage({
        name: text('name'),
        bike: text('bike'),
        service: text('service'),
        date: longDate.format(new Date(year, month - 1, day)),
        note: text('note'),
      }),
    );
    window.open(link, '_blank', 'noopener');
    setSent(true);
  };

  return (
    <form onSubmit={onSubmit} class="ticket grid gap-4 px-5 pb-7 pt-6 sm:px-8 sm:pb-9">
      <h2 class="headline headline-m">Pide tu cita</h2>

      <div>
        <label class="field-label" for="appointment-name">
          Tu nombre
        </label>
        <input id="appointment-name" name="name" class="field" required autoComplete="name" />
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="field-label" for="appointment-bike">
            Tipo de bicicleta
          </label>
          <select id="appointment-bike" name="bike" class="field" required>
            <option value="" disabled selected>
              Elige una
            </option>
            {BIKE_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label class="field-label" for="appointment-date">
            Día que te sirve
          </label>
          <input id="appointment-date" name="date" type="date" class="field" required min={today || undefined} />
        </div>
      </div>

      <div>
        <label class="field-label" for="appointment-service">
          Servicio
        </label>
        <select id="appointment-service" name="service" class="field" required>
          <option value="" disabled selected>
            Elige uno
          </option>
          {services.map((s) => (
            <option key={s.id}>{s.name}</option>
          ))}
          <option>No sé, necesito que la revisen</option>
        </select>
      </div>

      <div>
        <label class="field-label" for="appointment-note">
          ¿Qué le pasa a la bici? <span class="font-normal text-steel">(opcional)</span>
        </label>
        <textarea id="appointment-note" name="note" class="field" rows={3} placeholder="Suena al frenar, los cambios saltan…" />
      </div>

      <button type="submit" class="button justify-self-start">
        Pedir cita por WhatsApp
      </button>
      <p class="text-sm text-steel" role="status">
        {sent
          ? 'Se abrió WhatsApp con tu solicitud. Envía el mensaje y te confirmamos la hora.'
          : 'Se abre WhatsApp con la solicitud ya escrita. La cita queda en firme cuando te respondemos.'}
      </p>
    </form>
  );
}
