import { useMemo, createElement, type SVGProps } from "react";
import { icons } from "lucide-react";

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

/**
 * Resolve a lucide icon name (kebab-case or PascalCase) to the component.
 */
function resolveIcon(name: string): LucideIconComponent | null {
  // Try direct PascalCase lookup first (in case the value is already PascalCase)
  const direct = icons[name as keyof typeof icons];
  if (direct) return direct as LucideIconComponent;

  // Try converting from kebab-case
  const pascal = kebabToPascal(name);
  const resolved = icons[pascal as keyof typeof icons];
  return resolved ? (resolved as LucideIconComponent) : null;
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
 * 2. A lucide-react icon if the logo is an icon name
 * 3. A text fallback (first letter of title) if no logo is set
 */
const ProjectLogo = ({
  logo,
  title,
  className = "",
  iconSize = 24,
}: ProjectLogoProps) => {
  const iconComponent = useMemo(
    () => (logo && !logo.startsWith("http") ? resolveIcon(logo) : null),
    [logo],
  );

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

  // Fallback: first letter of title
  return (
    <div
      className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center ${className}`}
    >
      <span className="text-xl font-bold text-primary">
        {title.charAt(0)}
      </span>
    </div>
  );
};

export default ProjectLogo;
