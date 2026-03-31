import { useState, useEffect, useCallback, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { GithubIcon } from "./GithubIcon";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
// import LanguageSwitcher from "./LanguageSwitcher";

interface HeaderProps {
  className?: string;
}

// Logo fade animation thresholds (in pixels from viewport top)
const LOGO_FADE_START = 150;
const LOGO_FULL_OPACITY = 50;
const LOGO_INTERACTIVE_THRESHOLD = 0.01;

const Header = ({ className }: HeaderProps) => {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLogoInteractive, setIsLogoInteractive] = useState(false);
  const heroTitleRef = useRef<HTMLHeadingElement | null>(null);
  const heroTitleDocumentTopRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const logoOpacity = useMotionValue(0);
  const logoX = useTransform(logoOpacity, [0, 1], [100, 0]);

  const cacheHeroTitlePosition = useCallback(() => {
    heroTitleRef.current =
      document.getElementById("hero")?.querySelector("h1") || null;
    heroTitleDocumentTopRef.current = heroTitleRef.current
      ? heroTitleRef.current.getBoundingClientRect().top + window.scrollY
      : null;
  }, []);

  const calculateLogoOpacity = useCallback(() => {
    if (heroTitleDocumentTopRef.current === null) {
      return 0;
    }

    const currentTop = heroTitleDocumentTopRef.current - window.scrollY;

    if (currentTop <= LOGO_FULL_OPACITY) {
      return 1;
    }

    if (currentTop <= LOGO_FADE_START) {
      const progress =
        (LOGO_FADE_START - currentTop) / (LOGO_FADE_START - LOGO_FULL_OPACITY);
      return Math.max(0, Math.min(1, progress));
    }
    return 0;
  }, []);

  useEffect(() => {
    const updateHeaderState = () => {
      const nextLogoOpacity = calculateLogoOpacity();
      const nextIsScrolled = window.scrollY > 10;
      const nextIsLogoInteractive =
        nextLogoOpacity > LOGO_INTERACTIVE_THRESHOLD;

      logoOpacity.set(nextLogoOpacity);
      setIsScrolled((prev) => (prev === nextIsScrolled ? prev : nextIsScrolled));
      setIsLogoInteractive((prev) =>
        prev === nextIsLogoInteractive ? prev : nextIsLogoInteractive,
      );
      animationFrameRef.current = null;
    };

    const scheduleHeaderUpdate = () => {
      if (animationFrameRef.current !== null) {
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(updateHeaderState);
    };

    const handleResize = () => {
      cacheHeroTitlePosition();
      scheduleHeaderUpdate();
    };

    cacheHeroTitlePosition();
    scheduleHeaderUpdate();

    window.addEventListener("scroll", scheduleHeaderUpdate, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      window.removeEventListener("scroll", scheduleHeaderUpdate);
      window.removeEventListener("resize", handleResize);
    };
  }, [cacheHeroTitlePosition, calculateLogoOpacity, logoOpacity]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-border/50 shadow-sm"
          : "bg-transparent",
        className,
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo/Brand - fades in with slide animation on scroll */}
          <motion.div
            className="flex items-center gap-2"
            style={{
              opacity: logoOpacity,
              x: logoX,
              pointerEvents: isLogoInteractive ? "auto" : "none",
            }}
          >
            <button
              onClick={scrollToTop}
              className="text-lg sm:text-xl md:text-2xl font-bold text-primary hover:text-primary/80 transition-colors truncate max-w-[200px] sm:max-w-none"
            >
              🧪 {t("hero.title")}
            </button>
          </motion.div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* GitHub Link - shown on all screen sizes */}
            <motion.a
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              href="https://github.com/digidem/awana-labs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center p-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-accent transition-colors"
              aria-label={t("aria.visitGithub")}
            >
              <GithubIcon className="h-5 w-5" />
            </motion.a>

            {/* Language Switcher - commented out pending translation strategy
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <LanguageSwitcher variant="default" />
            </motion.div>
            */}

            {/* Mobile Menu Button - commented out for now
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-foreground hover:bg-accent transition-colors"
              aria-label={
                isMobileMenuOpen ? t("aria.closeMenu") : t("aria.openMenu")
              }
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </motion.button>
            */}</div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
