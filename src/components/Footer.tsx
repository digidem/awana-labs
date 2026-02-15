import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="py-8 sm:py-12 px-4 sm:px-6 border-t border-border bg-card/30"
    >
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-sm sm:text-base text-muted-foreground flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
          <span className="flex items-center gap-1 sm:gap-1.5">
            {t("footer.madeWith")}{" "}
            <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 fill-red-500" />
          </span>
          <span className="flex items-center gap-1 sm:gap-1.5">
            {t("footer.by")}{" "}
            <a
              href="https://awanadigital.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Awana Digital
            </a>
          </span>
        </p>
      </div>
    </motion.footer>
  );
};

export default Footer;
