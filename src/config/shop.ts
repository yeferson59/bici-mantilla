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

  address: "Calle 8 #5-25",
  city: "Pamplona, Colombia",
  mapUrl: "https://maps.app.goo.gl/URLu2sGa9vLdEVd16",
  openingHours: [{ days: "Lunes a Sábado", hours: "9:00 am - 7:00 pm" }],

  /** While the catalog is a sample, the site says so in the footer. */
  sampleCatalog: true,
};

export type Shop = typeof shop;
