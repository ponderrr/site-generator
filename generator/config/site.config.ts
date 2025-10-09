export const siteConfig = {
  name: "Northshore Exterior Upkeep",
  phone: "(985) 662-8005",
  email: "northshoreexteriorupkeep@gmail.com",
  serviceArea: "Serving Baton Rouge → Slidell",
  serviceAreaCities: ["Baton Rouge", "Slidell", "Covington", "Mandeville", "Hammond"],
  ratingLabel: "4.9 on Google",
  valueProps: [
    { icon: "✅", label: "Licensed & Insured" },
    { icon: "🌿", label: "Eco-friendly detergents" },
    { icon: "⚡", label: "Fast turnaround" }
  ],
  ctas: {
    primary: "Get a Free Quote",
    secondary: "Call Now"
  },
  social: {
    facebook: "",
    instagram: "",
    google: ""
  },
  hero: {
    image: "/images/pressure-wash-hero.jpg",
    badge: {
      text: "Avg. turnaround: 48 hrs",
      subtext: "Quotes in minutes"
    }
  }
};

export type SiteConfig = typeof siteConfig;




