import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Project } from "@/types/project";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";

interface ProjectCardProps {
  project: Project;
  index: number;
  onClick: () => void;
}

const ProjectCard = ({ project, index, onClick }: ProjectCardProps) => {
  const prefersReducedMotion = useReducedMotion();

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
        delay: prefersReducedMotion ? 0 : index * 0.1,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      whileHover={
        prefersReducedMotion ? {} : { y: -8, transition: { duration: 0.2 } }
      }
      className="h-full"
    >
      <Card
        onClick={onClick}
        className="h-full cursor-pointer transition-shadow duration-300 hover:shadow-xl border-border/50 bg-card/80 backdrop-blur-sm group"
        tabIndex={0}
        role="button"
        aria-label={`View details for ${project.title}`}
        onKeyDown={(e) => e.key === "Enter" && onClick()}
      >
        <CardHeader className="pb-3">
          {/* Logo placeholder */}
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <span className="text-xl font-bold text-primary">
              {project.title.charAt(0)}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold text-card-foreground line-clamp-1">
              {project.title}
            </h3>
            <StatusBadge state={project.status.state} />
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {project.description}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs bg-secondary/50"
              >
                {tag}
              </Badge>
            ))}
            {project.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs bg-secondary/50">
                +{project.tags.length - 3}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {project.status.usage === "widely-used"
                ? "Widely Used"
                : project.status.usage === "used"
                  ? "In Use"
                  : "Experimental"}
            </span>
            <span>
              Updated{" "}
              {new Date(
                project.timestamps.last_updated_at,
              ).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProjectCard;
