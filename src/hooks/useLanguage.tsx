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

const getCurrentI18nLanguage = (): Language | null => {
  const detectedLanguage = i18n.resolvedLanguage ?? i18n.language;
  return detectedLanguage && isLanguage(detectedLanguage)
    ? detectedLanguage
    : null;
};

const updateDocumentLanguage = (language: Language) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
  }
};

const getInitialLanguage = (): Language => {
  return getCurrentI18nLanguage() ?? DEFAULT_LANGUAGE;
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
    updateDocumentLanguage(newLanguage);
  };

  useEffect(() => {
    if (i18n.resolvedLanguage !== language) {
      void i18n.changeLanguage(language);
    }

    updateDocumentLanguage(language);
  }, [language]);

  // Persist the initial detected language on first visit when storage is empty.
  // Without this, a language detected from ?lng= or navigator.language is never
  // written to localStorage and a page reload loses the choice.
  useEffect(() => {
    try {
      if (localStorage.getItem(LANGUAGE_STORAGE_KEY) === null) {
        storeLanguage(language);
      }
    } catch {
      // localStorage unavailable — ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, []);

  useEffect(() => {
    const handleLanguageChanged = (nextLanguage: string) => {
      const syncedLanguage =
        getCurrentI18nLanguage() ??
        (isLanguage(nextLanguage) ? nextLanguage : null);

      if (!syncedLanguage) {
        return;
      }

      setLanguageState((currentLanguage) =>
        currentLanguage === syncedLanguage ? currentLanguage : syncedLanguage,
      );
      storeLanguage(syncedLanguage);
      updateDocumentLanguage(syncedLanguage);
    };

    i18n.on("languageChanged", handleLanguageChanged);

    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);

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
