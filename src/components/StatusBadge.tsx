import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { getStatusClasses, getUsageLabel } from "@/lib/status-utils";
import type {
  ProjectStatusState,
  ProjectStatusUsage,
} from "@/lib/status-utils";

export interface StatusBadgeProps {
  /** The status state to display */
  state: ProjectStatusState;
  /** Optional usage status to display as a secondary badge */
  usage?: ProjectStatusUsage;
  /** Badge variant */
  variant?: "default" | "outline" | "secondary";
  /** Optional className for additional styling */
  className?: string;
}

/**
 * StatusBadge component for displaying project status information
 *
 * Displays the primary status state badge, and optionally the usage status
 * as a secondary badge.
 *
 * @example
 * ```tsx
 * <StatusBadge state="active" usage="widely-used" />
 * <StatusBadge state="paused" variant="outline" />
 * ```
 */
export function StatusBadge({
  state,
  usage,
  variant = "outline",
  className = "",
}: StatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge
        variant={variant}
        className={`capitalize ${getStatusClasses(state)}`}
      >
        {t(`status.${state}`)}
      </Badge>
      {usage && <Badge variant="secondary">{getUsageLabel(usage, t)}</Badge>}
    </div>
  );
}

export default StatusBadge;
