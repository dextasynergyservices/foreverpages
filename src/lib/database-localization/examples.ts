/**
 * Database Localization Examples
 *
 * This file contains practical examples of how to use the database localization system.
 * These examples show real-world usage patterns for different scenarios.
 */

import { NextResponse } from "next/server";
import {
  initializeLocalization,
  getLocalizedField,
  setLocalizedField,
  getLocalizedModel,
  getLocalizedModels,
  addTranslations,
  createLocalizedQuery,
  getTranslationCompletion,
  getMissingTranslations,
  withLocalization,
  SupportedLocale,
} from "./index";

// Example 1: Basic Memorial Localization
export function exampleMemorialLocalization() {
  // Sample memorial data
  const memorial = {
    id: "mem_123",
    title: "John's Memorial",
    description: "A loving father and husband",
    content: "John was a wonderful person who touched many lives...",
    createdAt: new Date(),
    translations: {
      title: {
        content: {
          es: "Memorial de John",
          fr: "Mémorial de John",
          ha: "Tunawa na John",
        },
        fallbackLocale: "en",
      },
      description: {
        content: {
          es: "Un padre y esposo amoroso",
          fr: "Un père et mari aimant",
        },
        fallbackLocale: "en",
      },
    },
  };

  // Get localized title in Spanish
  const spanishTitle = getLocalizedField(memorial, "title", "es");
  console.log("Spanish title:", spanishTitle); // "Memorial de John"

  // Get localized title in French with English fallback
  const frenchTitle = getLocalizedField(memorial, "title", "fr", "en");
  console.log("French title:", frenchTitle); // "Mémorial de John"

  // Get localized model
  const localizedMemorial = getLocalizedModel(memorial, "es", "en", ["title", "description"]);
  console.log("Localized memorial:", localizedMemorial);

  return localizedMemorial;
}

// Example 2: Adding Translations
export function exampleAddingTranslations() {
  const memorial = {
    id: "mem_456",
    title: "Sarah's Memorial",
    description: "A beloved mother and grandmother",
    translations: {},
  };

  // Add single translation
  const updatedMemorial = setLocalizedField(memorial, "title", "Memorial de Sarah", "es");
  console.log("Updated memorial:", updatedMemorial);

  // Add multiple translations
  const finalMemorial = addTranslations(updatedMemorial, [
    { field: "title", locale: "fr", content: "Mémorial de Sarah" },
    { field: "title", locale: "ha", content: "Tunawa na Sarah" },
    { field: "description", locale: "es", content: "Una madre y abuela querida" },
    { field: "description", locale: "fr", content: "Une mère et grand-mère bien-aimée" },
  ]);

  console.log("Final memorial with translations:", finalMemorial);
  return finalMemorial;
}

// Example 3: Batch Processing
export function exampleBatchProcessing() {
  const memorials = [
    {
      id: "mem_1",
      title: "Memorial 1",
      translations: {
        title: {
          content: { es: "Memorial 1", fr: "Mémorial 1" },
        },
      },
    },
    {
      id: "mem_2",
      title: "Memorial 2",
      translations: {
        title: {
          content: { es: "Memorial 2" },
        },
      },
    },
  ];

  // Get all localized models
  const localizedMemorials = getLocalizedModels(memorials, "es", "en", ["title"]);
  console.log("Localized memorials:", localizedMemorials);

  return localizedMemorials;
}

// Example 4: Translation Management
export function exampleTranslationManagement() {
  const memorial = {
    id: "mem_789",
    title: "Test Memorial",
    translations: {
      title: {
        content: {
          es: "Memorial de Prueba",
          fr: "Mémorial de Test",
        },
      },
      description: {
        content: {
          es: "Descripción en español",
        },
      },
    },
  };

  // Check translation completion
  const completion = getTranslationCompletion(memorial);
  console.log("Translation completion:", completion + "%");

  // Get missing translations
  const missing = getMissingTranslations(memorial, ["en", "es", "fr", "ha"]);
  console.log("Missing translations:", missing);

  return { completion, missing };
}

// Example 5: Query Builder
export function exampleQueryBuilder() {
  const memorials = [
    {
      id: "mem_1",
      title: "Memorial 1",
      translations: {
        title: {
          content: { es: "Memorial 1", fr: "Mémorial 1" },
        },
      },
    },
  ];

  // Create localized query
  const query = createLocalizedQuery("es", "en");

  // Query single model
  const result = query.forModel(memorials[0], ["title"]);
  console.log("Query result:", result);

  // Query multiple models
  const batchResult = query.forModels(memorials, ["title"]);
  console.log("Batch query result:", batchResult);

  return { result, batchResult };
}

// Example 6: Next.js API Route
export const exampleNextApiRoute = withLocalization(async (req, context) => {
  const { locale, fallbackLocale, service } = context;

  // Simulate getting memorial from database
  const memorial = {
    id: "mem_api_123",
    title: "API Memorial",
    description: "This is an API memorial",
    translations: {
      title: {
        content: {
          es: "Memorial API",
          fr: "Mémorial API",
        },
      },
    },
  };

  // Get localized version
  const localizedMemorial = service.getLocalized(memorial, {
    locale,
    fallbackLocale,
    fields: ["title", "description"],
  });

  return NextResponse.json(localizedMemorial);
});

// Example 7: Next.js API Route with Middleware
export function exampleNextApiRouteWithMiddleware() {
  // This example shows how to use the localization middleware in a Next.js API route
  // The middleware automatically detects the locale from headers and query params

  return withLocalization(async (req, context) => {
    const { locale, fallbackLocale, service } = context;

    // Simulate getting memorial from database
    const memorial = {
      id: "mem_middleware_123",
      title: "Middleware Memorial",
      description: "This memorial uses middleware for localization",
      translations: {
        title: {
          content: {
            es: "Memorial con Middleware",
            fr: "Mémorial avec Middleware",
          },
        },
        description: {
          content: {
            es: "Este memorial usa middleware para localización",
            fr: "Ce mémorial utilise un middleware pour la localisation",
          },
        },
      },
    };

    // Get localized version using the service
    const localizedMemorial = service.getLocalized(memorial, {
      locale,
      fallbackLocale,
      fields: ["title", "description"],
    });

    return NextResponse.json({
      data: localizedMemorial.data,
      locale: localizedMemorial.locale,
      fallbackUsed: localizedMemorial.fallbackUsed,
      missingFields: localizedMemorial.missingFields,
    });
  });
}

// Example 8: Error Handling
export function exampleErrorHandling() {
  try {
    // This will throw an error if locale is invalid
    getLocalizedField({}, "title", "invalid-locale" as SupportedLocale);
  } catch (error: unknown) {
    console.error("Localization error:", error);

    if (error instanceof Error) {
      if (error.name === "UnsupportedLocaleError") {
        console.log("Invalid locale provided");
      } else if (error.name === "MissingTranslationError") {
        console.log("Translation not found");
      }
    }
  }
}

// Example 9: Custom Configuration
export function exampleCustomConfiguration() {
  // Initialize with custom configuration
  initializeLocalization({
    defaultLocale: "en",
    supportedLocales: ["en", "es", "fr", "ha", "ig", "yo"],
    fallbackStrategy: "first-available",
  });

  const memorial = {
    id: "mem_custom",
    title: "Custom Memorial",
    translations: {
      title: {
        content: {
          fr: "Mémorial Personnalisé",
          ha: "Tunawa na Musamman",
        },
      },
    },
  };

  // This will use the first available translation
  const title = getLocalizedField(memorial, "title", "es"); // Will return French title
  console.log("Title with first-available fallback:", title);

  return title;
}

// Example 10: Real-world Memorial Page
export function exampleRealWorldMemorial() {
  const memorial = {
    id: "mem_real_123",
    title: "In Loving Memory of Maria Rodriguez",
    description: "A devoted mother, grandmother, and community leader",
    content: "Maria was a pillar of her community, known for her kindness and generosity...",
    dateOfBirth: "1950-03-15",
    dateOfDeath: "2024-01-10",
    location: "San Antonio, TX",
    translations: {
      title: {
        content: {
          es: "En Memoria de María Rodríguez",
          fr: "En Mémoire de María Rodríguez",
        },
      },
      description: {
        content: {
          es: "Una madre devota, abuela y líder comunitaria",
          fr: "Une mère dévouée, grand-mère et leader communautaire",
        },
      },
      content: {
        content: {
          es: "María fue un pilar de su comunidad, conocida por su bondad y generosidad...",
          fr: "María était un pilier de sa communauté, connue pour sa gentillesse et sa générosité...",
        },
      },
    },
  };

  // Get fully localized memorial for Spanish
  const localizedMemorial = getLocalizedModel(memorial, "es", "en", [
    "title",
    "description",
    "content",
  ]);

  console.log("Localized memorial for Spanish:", localizedMemorial);
  return localizedMemorial;
}

// Run examples (for testing)
export function runAllExamples() {
  console.log("=== Database Localization Examples ===\n");

  console.log("1. Basic Memorial Localization:");
  exampleMemorialLocalization();

  console.log("\n2. Adding Translations:");
  exampleAddingTranslations();

  console.log("\n3. Batch Processing:");
  exampleBatchProcessing();

  console.log("\n4. Translation Management:");
  exampleTranslationManagement();

  console.log("\n5. Query Builder:");
  exampleQueryBuilder();

  console.log("\n6. Next.js API Route with Middleware:");
  exampleNextApiRouteWithMiddleware();

  console.log("\n7. Error Handling:");
  exampleErrorHandling();

  console.log("\n8. Custom Configuration:");
  exampleCustomConfiguration();

  console.log("\n9. Real-world Memorial:");
  exampleRealWorldMemorial();

  console.log("\n=== Examples Complete ===");
}
