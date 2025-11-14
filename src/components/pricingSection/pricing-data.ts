export interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  button: string;
  features: Record<string, string>;
  popular: boolean;
}

export const plans: Plan[] = [
  {
    id: "basic",
    name: "Basic Plan",
    price: "50,000",
    period: "/days",
    description: "Perfect for personal memorials",
    button: "Get Started",
    features: {
      pages: "Custom memorial pages",
      photos: "50+ photos",
      videos: "5+ videos",
      prints: "Up to 30 Cards & 30 Programmes printed",
      rsvp: "RSVP management",
    },
    popular: false,
  },
  {
    id: "premium",
    name: "Premium Plan",
    price: "120,000",
    period: "/days",
    description: "Most popular choice",
    button: "Get Started",
    features: {
      pages: "Custom memorial pages",
      photos: "50+ photos",
      videos: "5+ videos",
      prints: "Up to 30 Cards & 30 Programmes printed",
      rsvp: "RSVP management",
    },
    popular: true,
  },
  {
    id: "family",
    name: "Family Plan",
    price: "200,000",
    period: "/days",
    description: "For families & organizations",
    button: "Get Started",
    features: {
      pages: "Custom memorial pages",
      photos: "50+ photos",
      videos: "5+ videos",
      prints: "Up to 30 Cards & 30 Programmes printed",
      rsvp: "RSVP management",
    },
    popular: false,
  },
];
