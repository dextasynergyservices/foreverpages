// Supported languages
export type SupportedLocale = "en" | "fr" | "es" | "yo" | "ig" | "ha";

// Language configuration
export interface LanguageConfig {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
  direction: "ltr" | "rtl";
}

// Translation key structure - comprehensive structure for all components
export interface TranslationKeys {
  hero: {
    title: string;
    subtitle: string;
    buttons: {
      create: string;
      view: string;
    };
  };
  navbar: {
    logo: string;
    navigation: {
      features: string;
      howItWorks: string;
      support: string;
    };
    buttons: {
      signIn: string;
    };
  };
  features: {
    title: string;
    subtitle: string;
    items: {
      memoryGallery: {
        title: string;
        description: string;
      };
      tributeWall: {
        title: string;
        description: string;
      };
      privacyControls: {
        title: string;
        description: string;
      };
      foreverPreserved: {
        title: string;
        description: string;
      };
    };
  };
  funeralPages: {
    title: string;
    subtitle: string;
    viewMore: string;
    featured: string;
    tributes: string;
    visits: string;
    by: string;
    memorialImage: string;
  };
  howItWorks: {
    title: string;
    subtitle: string;
    steps: {
      create: {
        number: string;
        title: string;
        description: string;
        icon: string;
      };
      addContent: {
        number: string;
        title: string;
        description: string;
        icon: string;
      };
      share: {
        number: string;
        title: string;
        description: string;
        icon: string;
      };
      preserve: {
        number: string;
        title: string;
        description: string;
        icon: string;
      };
    };
    buttons: {
      watchDemo: string;
    };
    modal: {
      title: string;
      description: string;
      placeholder: string;
    };
  };
  testimonials: {
    title: string;
    subtitle: string;
    testimonials: {
      sarah: {
        name: string;
        role: string;
        content: string;
      };
      michael: {
        name: string;
        role: string;
        content: string;
      };
      emily: {
        name: string;
        role: string;
        content: string;
      };
      emanuel: {
        name: string;
        role: string;
        content: string;
      };
      boma: {
        name: string;
        role: string;
        content: string;
      };
      tosin: {
        name: string;
        role: string;
        content: string;
      };
      aish: {
        name: string;
        role: string;
        content: string;
      };
    };
    joinFamilies: {
      title: string;
      description: string;
    };
  };
  pricing: {
    title: string;
    subtitle: string;
    plans: {
      basic: {
        name: string;
        price: string;
        description: string;
        features: string[];
        button: string;
      };
      premium: {
        name: string;
        price: string;
        period: string;
        description: string;
        features: string[];
        button: string;
        badge: string;
      };
      family: {
        name: string;
        price: string;
        period: string;
        description: string;
        features: string[];
        button: string;
      };
    };
    allPlansInclude: {
      title: string;
      description: string;
    };
  };
  cta: {
    title: string;
    subtitle: string;
    buttons: {
      getStarted: string;
      viewSample: string;
    };
    reassurance: string;
  };
  footer: {
    links: {
      privacy: string;
      terms: string;
      support: string;
      contact: string;
    };
    copyright: string;
  };
  common: {
    loading: string;
    error: string;
    retry: string;
    close: string;
    save: string;
    cancel: string;
  };
}

// Language configuration for all supported languages
export const LANGUAGES: LanguageConfig[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    direction: "ltr",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    direction: "ltr",
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    direction: "ltr",
  },
  {
    code: "yo",
    name: "Yoruba",
    nativeName: "Yorùbá",
    flag: "🇳🇬",
    direction: "ltr",
  },
  {
    code: "ig",
    name: "Igbo",
    nativeName: "Igbo",
    flag: "🇳🇬",
    direction: "ltr",
  },
  {
    code: "ha",
    name: "Hausa",
    nativeName: "Hausa",
    flag: "🇳🇬",
    direction: "ltr",
  },
];

// Default locale
export const DEFAULT_LOCALE: SupportedLocale = "en";

// All supported locales
export const SUPPORTED_LOCALES: SupportedLocale[] = LANGUAGES.map((lang) => lang.code);
