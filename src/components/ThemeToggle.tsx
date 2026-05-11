import { Sun, Moon, Monitor } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";

const CYCLE_ORDER = ["light", "dark", "system"] as const;

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const currentIndex = CYCLE_ORDER.indexOf(theme);
  const nextTheme = CYCLE_ORDER[(currentIndex + 1) % CYCLE_ORDER.length];

  const themeLabel = (value: string) => {
    switch (value) {
      case "light":
        return t("aria.themeLight");
      case "dark":
        return t("aria.themeDark");
      case "system":
        return t("aria.themeSystem");
      default:
        return value;
    }
  };

  const Icon =
    theme === "system" ? Monitor : resolvedTheme === "dark" ? Moon : Sun;

  return (
    <button
      onClick={() => setTheme(nextTheme)}
      className="inline-flex items-center justify-center p-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-accent transition-colors"
      role="switch"
      aria-checked={resolvedTheme === "dark"}
      aria-label={t("accessibility.themeToggle", {
        current: themeLabel(theme),
        next: themeLabel(nextTheme),
      })}
    >
      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
    </button>
  );
}
