export type HeroSection = {
  type: "hero";
  title: string;
  subtitle?: string;
};

export type ProductsSection = {
  type: "products";
  source: "bscfashion" | "seller";
};

export type FooterSection = {
  type: "footer";
};

export type SiteSection =
  | HeroSection
  | ProductsSection
  | FooterSection;
