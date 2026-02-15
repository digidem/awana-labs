import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useTranslation } from "react-i18next";
import TopographicBackground from "./TopographicBackground";
import { ChevronDown } from "lucide-react";

const Hero = () => {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
    },
  };

  const scrollToProjects = () => {
    document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <TopographicBackground />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center px-6 max-w-4xl mx-auto"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium tracking-wide">
            🧪 {t("hero.badge")}
          </span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-5xl md:text-7xl font-bold text-primary mb-6 leading-tight"
        >
          {t("hero.title")}
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-xl md:text-2xl text-muted-foreground mb-4 font-light"
        >
          {t("hero.tagline")}
        </motion.p>

        <motion.p
          variants={itemVariants}
          className="text-base md:text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-12"
        >
          {t("hero.subtitle")}
        </motion.p>

        <motion.button
          variants={itemVariants}
          onClick={scrollToProjects}
          className="group inline-flex flex-col items-center gap-2 text-primary/70 hover:text-primary transition-colors cursor-pointer"
          aria-label={t("aria.scrollToProjects")}
        >
          <span className="text-sm font-medium">{t("hero.cta")}</span>
          <motion.div
            animate={prefersReducedMotion ? {} : { y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </motion.button>
      </motion.div>
    </section>
  );
};

export default Hero;
