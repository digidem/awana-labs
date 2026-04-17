import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";

const PAGE_TITLES: Record<string, string> = {
  en: "Awana Labs - Open Source Projects",
  pt: "Awana Labs - Projetos Open Source",
  es: "Awana Labs - Proyectos Open Source",
};

const DEFAULT_TITLE = PAGE_TITLES.en;

export const useDocumentMeta = () => {
  const { language } = useLanguage();
  const { t, ready } = useTranslation();

  useEffect(() => {
    if (!ready) return;

    document.title = PAGE_TITLES[language] ?? DEFAULT_TITLE;

    const metaDescription = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (metaDescription) {
      metaDescription.content = t("hero.subtitle");
    }
  }, [language, t, ready]);
};

