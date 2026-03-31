import { Check, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/hooks/useLanguage";
import { LANGUAGE_OPTIONS, getLanguageOption } from "@/types/language";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "default" | "compact" | "icon-only";
}

const LanguageSwitcher = ({
  className,
  variant = "default",
}: LanguageSwitcherProps) => {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const currentLang = getLanguageOption(language);

  const getTriggerContent = () => {
    switch (variant) {
      case "icon-only":
        return <Languages className="h-5 w-5" />;
      case "compact":
        return (
          <span className="flex items-center gap-2">
            <span className="text-lg">{currentLang.flag}</span>
            <span className="hidden md:inline">
              {currentLang.code.toUpperCase()}
            </span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-2">
            <span className="text-lg">{currentLang.flag}</span>
            <span className="hidden sm:inline">{currentLang.nativeName}</span>
          </span>
        );
    }
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
          "border border-transparent hover:border-border/50",
          "shadow-sm hover:shadow",
          "bg-background/50 backdrop-blur-sm",
          className,
        )}
        aria-label={
          variant === "icon-only"
            ? t("aria.selectLanguage")
            : `${t("aria.selectLanguage")} (${
                variant === "compact"
                  ? currentLang.code.toUpperCase()
                  : currentLang.nativeName
              })`
        }
      >
        {getTriggerContent()}
        {variant !== "icon-only" && (
          <Languages className="h-4 w-4 opacity-50" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[200px] bg-popover/95 backdrop-blur-sm shadow-lg"
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.code}
            onClick={() => setLanguage(option.code)}
            className="flex items-center justify-between cursor-pointer group"
            aria-label={t("aria.switchLanguage", {
              language: option.nativeName,
            })}
          >
            <span className="flex items-center gap-3">
              <span className="text-xl" aria-hidden="true">
                {option.flag}
              </span>
              <div className="flex flex-col">
                <span className="font-medium">{option.nativeName}</span>
                <span className="text-xs text-muted-foreground">
                  {option.name}
                </span>
              </div>
            </span>
            {option.code === language && (
              <Check
                className="h-4 w-4 text-primary"
                aria-hidden="true"
              />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
