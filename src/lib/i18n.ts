import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
} from "@/types/language";

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
      // Detection order for language resolution
      order: [
        "querystring",
        "cookie",
        "localStorage",
        "sessionStorage",
        "navigator",
        "htmlTag",
      ],
      // Keys or params to lookup language from
      lookupQuerystring: "lng",
      lookupCookie: "i18next",
      lookupLocalStorage: "i18nextLng",
      lookupSessionStorage: "i18nextLng",
      // Cache user language selection
      caches: ["localStorage", "cookie"],
      // Only detect languages in supportedLngs
      checkWhitelist: true,
    },
  } as Parameters<typeof i18n.init>[0]);

// Export a typed t function that accepts any string key
export const t = i18n.t.bind(i18n);

export default i18n;
