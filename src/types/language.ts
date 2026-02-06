export type Language = "en" | "es" | "fr" | "pt";

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
];

export const DEFAULT_LANGUAGE: Language = "en";

export const getLanguageOption = (code: Language): LanguageOption => {
  return (
    LANGUAGE_OPTIONS.find((lang) => lang.code === code) || LANGUAGE_OPTIONS[0]
  );
};
