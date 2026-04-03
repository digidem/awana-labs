import { useState, useEffect, useCallback, useRef } from "react";
import { GithubIcon } from "./GithubIcon";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

const LOGO_FADE_START = 150;
const LOGO_FULL_OPACITY = 50;

const Header = ({ className }: HeaderProps) => {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLogoInteractive, setIsLogoInteractive] = useState(false);
  const logoOpacityRef = useRef(0);
  const logoContainerRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement | null>(null);
  const heroTitleDocumentTopRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const cacheHeroTitlePosition = useCallback(() => {
    heroTitleRef.current =
      document.getElementById("hero")?.querySelector("h1") || null;
    heroTitleDocumentTopRef.current = heroTitleRef.current
      ? heroTitleRef.current.getBoundingClientRect().top + window.scrollY
      : null;
  }, []);

  useEffect(() => {
    const updateHeaderState = () => {
      if (heroTitleDocumentTopRef.current === null) {
        logoOpacityRef.current = 0;
        if (logoContainerRef.current) {
          logoContainerRef.current.style.opacity = "0";
          logoContainerRef.current.style.transform = "translateX(100px)";
        }
        setIsLogoInteractive((prev) => (prev ? false : prev));
        setIsScrolled(window.scrollY > 10);
        animationFrameRef.current = null;
        return;
      }

      const currentTop = heroTitleDocumentTopRef.current - window.scrollY;
      let opacity = 0;
      if (currentTop <= LOGO_FULL_OPACITY) {
        opacity = 1;
      } else if (currentTop <= LOGO_FADE_START) {
        opacity = (LOGO_FADE_START - currentTop) / (LOGO_FADE_START - LOGO_FULL_OPACITY);
      }

      logoOpacityRef.current = opacity;
      if (logoContainerRef.current) {
        logoContainerRef.current.style.opacity = String(opacity);
        logoContainerRef.current.style.transform = `translateX(${(1 - opacity) * 100}px)`;
      }

      setIsScrolled((prev) => {
        const next = window.scrollY > 10;
        return prev === next ? prev : next;
      });
      setIsLogoInteractive((prev) => {
        const next = opacity > 0.01;
        return prev === next ? prev : next;
      });
      animationFrameRef.current = null;
    };

    const scheduleUpdate = () => {
      if (animationFrameRef.current !== null) return;
      animationFrameRef.current = window.requestAnimationFrame(updateHeaderState);
    };

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        cacheHeroTitlePosition();
        scheduleUpdate();
      }, 100);
    };

    cacheHeroTitlePosition();
    scheduleUpdate();

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      clearTimeout(resizeTimer);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", handleResize);
    };
  }, [cacheHeroTitlePosition]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <header
      className={cn(
        "header-animate-in fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-border/50 shadow-sm"
          : "bg-transparent",
        className,
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div
            ref={logoContainerRef}
            className="flex items-center gap-2"
            style={{
              opacity: 0,
              transform: "translateX(100px)",
              pointerEvents: isLogoInteractive ? "auto" : "none",
            }}
          >
            <button
              onClick={scrollToTop}
              className="text-lg sm:text-xl md:text-2xl font-bold text-primary hover:text-primary/80 transition-colors truncate max-w-[200px] sm:max-w-none"
            >
              🧪 {t("hero.title")}
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <a
              href="https://github.com/digidem/awana-labs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center p-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-accent transition-colors"
              aria-label={t("aria.visitGithub")}
            >
              <GithubIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
