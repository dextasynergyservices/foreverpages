/**
 * Database Localization Middleware
 *
 * Middleware for Next.js API routes to automatically handle database localization.
 */

import { NextRequest, NextResponse } from "next/server";
import { SupportedLocale, DatabaseLocalizationService } from "./types";
import { getLocalizationService, getLocaleFromRequest, isValidLocale } from "./helpers";

// Next.js middleware types
export interface NextLocalizationContext {
  locale: SupportedLocale;
  fallbackLocale?: SupportedLocale;
  service: DatabaseLocalizationService;
}

/**
 * Next.js middleware for API routes
 */
export function withLocalization(
  handler: (
    req: NextRequest,
    context: NextLocalizationContext
  ) => Promise<NextResponse> | NextResponse
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Extract locale from request
      const url = new URL(req.url);
      const searchParams = url.searchParams;

      const query: Record<string, string | string[] | undefined> = {};
      searchParams.forEach((value, key) => {
        query[key] = value;
      });

      const headers: Record<string, string | string[] | undefined> = {};
      req.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const locale = getLocaleFromRequest(headers, query);
      const fallbackLocale =
        searchParams.get("fallbackLocale") && isValidLocale(searchParams.get("fallbackLocale")!)
          ? (searchParams.get("fallbackLocale") as SupportedLocale)
          : undefined;

      const context: NextLocalizationContext = {
        locale,
        fallbackLocale,
        service: getLocalizationService(),
      };

      return await handler(req, context);
    } catch (error) {
      console.error("Localization middleware error:", error);
      return NextResponse.json({ error: "Localization error" }, { status: 500 });
    }
  };
}

/**
 * Utility function to get localized data from Next.js request context
 */
export function getLocalizedDataFromContext<T>(
  context: NextLocalizationContext,
  data: T,
  fields?: string[]
): Partial<T> {
  const { locale, fallbackLocale, service } = context;

  const options = {
    locale,
    fallbackLocale,
    fields,
    includeAllLocales: false,
  };

  const result = service.getLocalized(data, options);
  return result.data;
}

/**
 * Utility function to set localized data using context
 */
export function setLocalizedDataFromContext<T>(
  context: NextLocalizationContext,
  data: T,
  field: string,
  content: string
): T {
  const { locale, service } = context;
  return service.setLocalized(data, field, content, locale);
}

/**
 * Utility function to add translation using context
 */
export function addTranslationFromContext<T>(
  context: NextLocalizationContext,
  data: T,
  field: string,
  content: string
): T {
  const { locale, service } = context;
  return service.addTranslation(data, field, locale, content);
}

/**
 * Response helper for localized API responses
 */
export function createLocalizedResponse<T>(
  context: NextLocalizationContext,
  data: T,
  fields?: string[]
) {
  const { locale, fallbackLocale, service } = context;

  const options = {
    locale,
    fallbackLocale,
    fields,
    includeAllLocales: false,
  };

  const result = service.getLocalized(data, options);

  return {
    data: result.data,
    locale: result.locale,
    fallbackUsed: result.fallbackUsed,
    missingFields: result.missingFields,
  };
}

/**
 * Batch response helper for multiple localized items
 */
export function createLocalizedBatchResponse<T>(
  context: NextLocalizationContext,
  data: T[],
  fields?: string[]
) {
  const { locale, fallbackLocale, service } = context;

  const options = {
    locale,
    fallbackLocale,
    fields,
    includeAllLocales: false,
  };

  const results = service.getMultipleLocalized(data, options);

  return {
    data: results.map((result) => result.data),
    locale: results[0]?.locale || locale,
    fallbackUsed: results.some((result) => result.fallbackUsed),
    missingFields: results.reduce((acc, result) => {
      if (result.missingFields) {
        acc.push(...result.missingFields);
      }
      return acc;
    }, [] as string[]),
  };
}

/**
 * Error handler for localization errors
 */
export function handleLocalizationError(error: unknown) {
  console.error("Localization error:", error);

  if (error instanceof Error) {
    if (error.name === "MissingTranslationError") {
      return NextResponse.json(
        {
          error: "Translation not found",
          message: error.message,
        },
        { status: 404 }
      );
    }

    if (error.name === "UnsupportedLocaleError") {
      return NextResponse.json(
        {
          error: "Unsupported locale",
          message: error.message,
        },
        { status: 400 }
      );
    }
  }

  return NextResponse.json(
    {
      error: "Localization error",
      message: "An unexpected localization error occurred",
    },
    { status: 500 }
  );
}
