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
      className="py-12 px-6 border-t border-border bg-card/30"
    >
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-muted-foreground flex items-center justify-center gap-1.5">
          {t("footer.madeWith")}{" "}
          <Heart className="w-4 h-4 text-red-500 fill-red-500" />{" "}
          {t("footer.by")}{" "}
          <a
            href="https://awanadigital.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Awana Digital
          </a>
        </p>
      </div>
    </motion.footer>
  );
};

export default Footer;
