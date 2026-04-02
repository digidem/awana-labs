import { useCallback, useRef } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Project } from "@/types/project";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import ProjectLogo from "@/components/ProjectLogo";
import { formatRelativeTime } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  onClick: (trigger: HTMLButtonElement) => void;
  /** Called when the user signals intent to open this card (hover/focus/touch). */
  onPrefetch?: () => void;
}

const ProjectCard = ({ project, onClick, onPrefetch }: ProjectCardProps) => {
  const { t, i18n } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const hasPrefetchedRef = useRef(false);

  const handlePrefetch = useCallback(() => {
    if (hasPrefetchedRef.current) return;
    hasPrefetchedRef.current = true;
    onPrefetch?.();
  }, [onPrefetch]);
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const updatedDate = project.repoMetadata?.pushed_at ?? project.timestamps.last_updated_at;
  const lastUpdatedLabel = formatRelativeTime(updatedDate, locale);

  const cardVariants: Variants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 30,
      scale: prefersReducedMotion ? 1 : 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <motion.button
      type="button"
      onClick={(event) => onClick(event.currentTarget)}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      onTouchStart={handlePrefetch}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      whileHover={
        prefersReducedMotion ? {} : { y: -8, transition: { duration: 0.2 } }
      }
      className="h-full w-full rounded-lg border border-border/50 bg-card/80 text-left text-card-foreground shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group"
      aria-label={t("aria.viewDetails", { title: project.title })}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 mb-4">
          <ProjectLogo
            logo={project.media?.logo ?? ""}
            title={project.title}
            className="group-hover:bg-primary/20 transition-colors"
            iconSize={24}
          />
          <StatusBadge state={project.status.state} usage={project.status.usage} />
        </div>

        <h3 className="text-lg font-semibold text-card-foreground line-clamp-1">
          {project.title}
        </h3>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs bg-secondary/50">
              {tag}
            </Badge>
          ))}
          {project.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs bg-secondary/50">
              +{project.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-end text-xs text-muted-foreground bg-muted/40 rounded-md px-2 py-1">
          <span>
            {t("projects.updated")} {lastUpdatedLabel}
          </span>
        </div>
      </CardContent>
    </motion.button>
  );
};

export default ProjectCard;
