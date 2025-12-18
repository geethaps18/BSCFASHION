export interface Template {
  id: string;
  name: string;
  description: string;
}

export const templates: Template[] = [
  {
    id: "business",
    name: "Business Website",
    description: "Perfect for shops & companies",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    description: "Show your work & profile",
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Sell products online",
  },
];
