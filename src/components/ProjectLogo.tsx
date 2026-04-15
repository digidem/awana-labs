import { useState, useEffect, createElement, type SVGProps } from "react";

type LucideIconComponent = React.ComponentType<
  SVGProps<SVGSVGElement> & { size?: number | string }
>;

/**
 * Convert a kebab-case icon name to PascalCase used by lucide-react's icons map.
 * e.g. "map-pin" → "MapPin", "globe" → "Globe"
 */
function kebabToPascal(kebab: string): string {
  return kebab
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

interface ProjectLogoProps {
  /** A URL string, a lucide icon name (kebab-case), or empty string. */
  logo: string;
  /** Title used for the text fallback (first letter). */
  title: string;
  /** Additional CSS classes for the outer container. */
  className?: string;
  /** Size of the icon in pixels when rendering a lucide icon. Default: 24. */
  iconSize?: number;
}

/**
 * Renders a project logo that can be:
 * 1. An `<img>` if the logo is a URL
 * 2. A lucide-react icon if the logo is an icon name (lazy-loaded on demand)
 * 3. A text fallback (first letter of title) if no logo is set
 */
const ProjectLogo = ({
  logo,
  title,
  className = "",
  iconSize = 24,
}: ProjectLogoProps) => {
  const [iconComponent, setIconComponent] =
    useState<LucideIconComponent | null>(null);
  const [iconLoading, setIconLoading] = useState(false);

  useEffect(() => {
    if (!logo || logo.startsWith("http")) {
      setIconComponent(null);
      setIconLoading(false);
      return;
    }

    const pascal = kebabToPascal(logo);
    setIconLoading(true);

    let cancelled = false;
    // Dynamic import keeps the full icons map in a separate chunk
    // that loads only when a project needs a lucide icon for its logo.
    import("@/lib/all-icons")
      .then((mod) => {
        if (cancelled) return;
        const resolved =
          mod.icons[pascal as keyof typeof mod.icons] ??
          mod.icons[logo as keyof typeof mod.icons];
        setIconComponent(() => (resolved as LucideIconComponent) ?? null);
        setIconLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setIconComponent(null);
          setIconLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [logo]);

  // URL-based logo
  if (logo.startsWith("http")) {
    return (
      <div
        className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden ${className}`}
      >
        <img
          src={logo}
          alt={`${title} logo`}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Icon-based logo — use createElement to avoid the react-hooks/static-components rule
  if (iconComponent) {
    return (
      <div
        className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center ${className}`}
      >
        {createElement(iconComponent, {
          size: iconSize,
          className: "text-primary",
        })}
      </div>
    );
  }

  // Loading shimmer while icon chunk loads (prevents FOUC)
  if (iconLoading) {
    return (
      <div
        className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden ${className}`}
      >
        <div className="w-full h-full animate-shimmer bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      </div>
    );
  }

  // Fallback: first letter of title (no logo set, or icon not found)
  return (
    <div
      className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center ${className}`}
    >
      <span className="text-xl font-bold text-primary">{title.charAt(0)}</span>
    </div>
  );
};

export default ProjectLogo;
