// Type definitions for i18next translations
// This file provides type safety for translation keys

// Export a permissive type for use in i18next configuration
// The actual type checking is bypassed via module augmentation
export type TranslationResources = {
  [key: string]: {
    [key: string]: string | TranslationResources;
  };
};

export type Translations = TranslationResources;

// Supported languages
export type SupportedLanguage = "en" | "pt" | "es";

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
};
