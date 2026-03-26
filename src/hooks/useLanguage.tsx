import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { Language } from "@/types/language";
import { DEFAULT_LANGUAGE, isLanguage } from "@/types/language";
import i18n from "@/lib/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

const LANGUAGE_STORAGE_KEY = "awana-labs-language";

const getInitialLanguage = (): Language => {
  const detectedLanguage = i18n.resolvedLanguage ?? i18n.language;
  return detectedLanguage && isLanguage(detectedLanguage)
    ? detectedLanguage
    : DEFAULT_LANGUAGE;
};

const getStoredLanguage = (): Language => {
  if (typeof window === "undefined") return getInitialLanguage();

  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && isLanguage(stored)) {
      return stored;
    }
  } catch (e) {
    console.warn("Failed to read language from localStorage:", e);
  }

  return getInitialLanguage();
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
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
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
    if (i18n.resolvedLanguage !== language) {
      void i18n.changeLanguage(language);
    }

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

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
};
