export const SUPPORTED_LANGUAGES = ["en", "pt", "es"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
];

export const DEFAULT_LANGUAGE: Language = SUPPORTED_LANGUAGES[0];

export const isLanguage = (value: string): value is Language => {
  return SUPPORTED_LANGUAGES.includes(value as Language);
};

export const getLanguageOption = (code: string): LanguageOption => {
  return (
    LANGUAGE_OPTIONS.find((lang) => lang.code === code) || LANGUAGE_OPTIONS[0]
  );
};
