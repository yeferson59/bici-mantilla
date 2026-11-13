/**
 * Shop details. Everything that changes from one business to another lives here.
 * Fields set to `null` are not known yet: the site hides that section until they are filled in.
 */
export const shop = {
  name: "Bicicletería Mantilla",
  description:
    "Bicicletas, repuestos, accesorios y taller. Arma tu pedido en la web y lo cerramos por WhatsApp.",

  /** Number with country code, no + or spaces (Colombia = 57). */
  whatsapp: "573144109244",
  displayPhone: "314 410 9244",

  /** Set the full profile URL once you have it; without a URL only the name is shown. */
  socials: [
    {
      network: "Facebook",
      name: "Bicicleteria Mantilla",
      url: "https://www.facebook.com/profile.php?id=100064051634413",
    },
    {
      network: "Instagram",
      name: "Bicicleteria Mantilla",
      url: "https://www.instagram.com/bicicleteria_mantilla",
    },
  ],

  address: null as string | null,
  city: null as string | null,
  /** Google Maps link to the shop. */
  mapUrl: null as string | null,
  /** Example: [{ days: 'Lunes a sábado', hours: '8:00 a. m. – 6:30 p. m.' }] */
  openingHours: [] as { days: string; hours: string }[],

  /** While the catalog is a sample, the site says so in the footer. */
  sampleCatalog: true,
};

export type Shop = typeof shop;
