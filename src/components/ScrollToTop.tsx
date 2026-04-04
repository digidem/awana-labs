import { useState, useEffect, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { useTranslation } from "react-i18next";

const SCROLL_THRESHOLD = 400;

const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  const handleScroll = useCallback(() => {
    setVisible(window.scrollY > SCROLL_THRESHOLD);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label={t("accessibility.scrollToTop")}
      className="fixed bottom-6 right-6 z-40 rounded-full p-3 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all opacity-0 translate-y-4 pointer-events-none data-[visible=true]:opacity-100 data-[visible=true]:translate-y-0 data-[visible=true]:pointer-events-auto"
      data-visible={visible}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
};

export default ScrollToTop;
