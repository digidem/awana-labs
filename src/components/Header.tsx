import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Github } from "lucide-react";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "./LanguageSwitcher";

interface HeaderProps {
  className?: string;
}

// Logo fade animation thresholds (in pixels from viewport top)
const LOGO_FADE_START = 150;
const LOGO_FULL_OPACITY = 50;

const Header = ({ className }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoOpacity, setLogoOpacity] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const heroTitleRef = useRef<HTMLHeadingElement | null>(null);

  const calculateLogoOpacity = useCallback(() => {
    if (!heroTitleRef.current) return 0;

    const currentTop = heroTitleRef.current.getBoundingClientRect().top;

    if (currentTop <= LOGO_FULL_OPACITY) {
      return 1;
    } else if (currentTop <= LOGO_FADE_START) {
      const progress =
        (LOGO_FADE_START - currentTop) / (LOGO_FADE_START - LOGO_FULL_OPACITY);
      return Math.max(0, Math.min(1, progress));
    }
    return 0;
  }, []);

  useEffect(() => {
    // Cache the hero title element reference
    heroTitleRef.current =
      document.getElementById("hero")?.querySelector("h1") || null;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
      setLogoOpacity(calculateLogoOpacity());
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial call
    return () => window.removeEventListener("scroll", handleScroll);
  }, [calculateLogoOpacity]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsMobileMenuOpen(false);
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
            animate={{
              opacity: logoOpacity,
              x: logoOpacity === 0 ? 100 : 0,
            }}
            transition={{
              opacity: { duration: 0.3 },
              x: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
            }}
            className="flex items-center gap-2"
            style={{ pointerEvents: logoOpacity === 0 ? "none" : "auto" }}
          >
            <button
              onClick={scrollToTop}
              className="text-xl md:text-2xl font-bold text-primary hover:text-primary/80 transition-colors"
              aria-label="Scroll to top"
            >
              🧪 Awana Labs
            </button>
          </motion.div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* GitHub Link */}
            <motion.a
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              href="https://github.com/awanadigital"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center justify-center p-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Visit GitHub repository"
            >
              <Github className="h-5 w-5" />
            </motion.a>

            {/* Language Switcher */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <LanguageSwitcher variant="default" />
            </motion.div>

            {/* Mobile Menu Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-foreground hover:bg-accent transition-colors"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden pb-4 overflow-hidden"
            >
              <div className="flex flex-col gap-1 pt-2 border-t border-border/50">
                <a
                  href="https://github.com/awanadigital"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-lg text-left text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-accent transition-all flex items-center gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Header;
