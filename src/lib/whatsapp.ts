import { shop } from '../config/shop';
import { formatPrice } from './price';

export function whatsAppLink(message: string): string {
  return `https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(message)}`;
}

export interface OrderLine {
  name: string;
  size?: string;
  quantity: number;
  price: number;
}

export function orderMessage(lines: OrderLine[]): string {
  const rows = lines.map((l) => {
    const size = l.size ? ` (talla ${l.size})` : '';
    return `• ${l.quantity} × ${l.name}${size}: ${formatPrice(l.price * l.quantity)}`;
  });
  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  return [
    `Hola ${shop.name}, quiero hacer este pedido:`,
    '',
    ...rows,
    '',
    `Total: ${formatPrice(total)}`,
  ].join('\n');
}

export function inquiryMessage(productName: string): string {
  return `Hola ${shop.name}, quiero saber más sobre: ${productName}`;
}

export interface AppointmentData {
  name: string;
  bike: string;
  service: string;
  date: string;
  note?: string;
}

export function appointmentMessage(d: AppointmentData): string {
  const rows = [
    `Hola ${shop.name}, quiero pedir una cita en el taller.`,
    '',
    `Nombre: ${d.name}`,
    `Bicicleta: ${d.bike}`,
    `Servicio: ${d.service}`,
    `Fecha que me sirve: ${d.date}`,
  ];
  if (d.note?.trim()) rows.push(`Nota: ${d.note.trim()}`);
  return rows.join('\n');
}
