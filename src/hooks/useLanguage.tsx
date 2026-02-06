import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { Language } from "@/types/language";
import { DEFAULT_LANGUAGE } from "@/types/language";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

const LANGUAGE_STORAGE_KEY = "awana-labs-language";

const getStoredLanguage = (): Language => {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;

  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && ["en", "es", "fr", "pt"].includes(stored)) {
      return stored as Language;
    }
  } catch (e) {
    console.warn("Failed to read language from localStorage:", e);
  }

  return DEFAULT_LANGUAGE;
};

const storeLanguage = (language: Language) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (e) {
    console.warn("Failed to write language to localStorage:", e);
  }
};

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export const LanguageProvider = ({
  children,
  defaultLanguage,
}: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>(() =>
    getStoredLanguage(),
  );

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    storeLanguage(newLanguage);

    // Update document lang attribute for accessibility
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLanguage;
    }
  };

  useEffect(() => {
    // Set initial document lang
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
};
