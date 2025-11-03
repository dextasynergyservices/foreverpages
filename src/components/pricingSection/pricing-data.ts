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
    period: "/one-time",
    description: "Perfect for personal memorials",
    button: "Get Started",
    features: {
      photos: "Up to 50 photos",
      template: "5 memorial templates",
      tributeWall: "Tribute wall for guests",
      mobile: "Mobile responsive",
      privacy: "Basic privacy settings",
    },
    popular: false,
  },
  {
    id: "premium",
    name: "Premium Plan",
    price: "120,000",
    period: "/one-time",
    description: "Most popular choice",
    button: "Get Started",
    features: {
      photos: "Unlimited photos",
      template: "15 memorial templates",
      customization: "Full customization",
      support: "Priority support",
      backup: "Cloud backup",
      analytics: "Visitor analytics",
      domain: "Custom domain",
    },
    popular: true,
  },
  {
    id: "family",
    name: "Family Plan",
    price: "200,000",
    period: "/one-time",
    description: "For families & organizations",
    button: "Get Started",
    features: {
      photos: "Unlimited photos & videos",
      template: "All templates included",
      tributeWall: "Advanced tribute wall",
      mobile: "Mobile app access",
      privacy: "Advanced privacy",
      support: "24/7 dedicated support",
      branding: "White-label branding",
    },
    popular: false,
  },
];
