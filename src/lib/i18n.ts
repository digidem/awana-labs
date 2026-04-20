import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from "@/types/language";

// Import translation files
import en from "../locales/en/common.json";
import pt from "../locales/pt/common.json";
import es from "../locales/es/common.json";

const resources = {
  en: {
    translation: en,
  },
  pt: {
    translation: pt,
  },
  es: {
    translation: es,
  },
};

// Supported languages for the application
export const supportedLanguages = SUPPORTED_LANGUAGES;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: supportedLanguages,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for SSR compatibility
    },
    detection: {
      // Detection order for language resolution.
      // localStorage/sessionStorage are excluded from *caches* so that the
      // custom LanguageProvider (which uses key "awana-labs-language") is the
      // single source of truth for persisted language preferences.
      order: [
        "querystring",
        "navigator",
        "htmlTag",
      ],
      // Keys or params to lookup language from
      lookupQuerystring: "lng",
      // Do NOT cache — LanguageProvider manages persistence via "awana-labs-language"
      caches: [],
      // Normalize regional codes (e.g. pt-BR → pt) to match supportedLngs
      convertDetectedLanguage: (lng: string) => lng.split("-")[0],
    },
  } as Parameters<typeof i18n.init>[0]);

export default i18n;
