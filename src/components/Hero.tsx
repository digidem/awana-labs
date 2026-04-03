import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";

const TopographicBackground = lazy(() => import("./TopographicBackground"));

const Hero = () => {
  const { t } = useTranslation();

  const scrollToProjects = () => {
    document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <Suspense fallback={<div className="absolute inset-0 pointer-events-none" />}>
        <TopographicBackground />
      </Suspense>

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto hero-stagger">
        <div className="hero-item-1 mb-6">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium tracking-wide">
            🧪 {t("hero.badge")}
          </span>
        </div>

        <h1 className="hero-item-2 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary mb-6 leading-tight">
          {t("hero.title")}
        </h1>

        <p className="hero-item-3 text-lg sm:text-xl md:text-2xl text-muted-foreground mb-4 font-light">
          {t("hero.tagline")}
        </p>

        <p className="hero-item-4 text-sm sm:text-base md:text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-12 px-4">
          {t("hero.subtitle")}
        </p>

        <button
          onClick={scrollToProjects}
          className="hero-item-5 group inline-flex flex-col items-center gap-2 text-primary/70 hover:text-primary transition-colors cursor-pointer"
        >
          <span className="text-sm font-medium">{t("hero.cta")}</span>
          <div className="hero-bounce">
            <ChevronDown className="w-6 h-6" />
          </div>
        </button>
      </div>
    </section>
  );
};

export default Hero;
