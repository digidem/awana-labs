import { useEffect, useCallback, useState, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Github,
  BookOpen,
} from "lucide-react";
import { Project } from "@/types/project";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";

interface ProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProjectModal = ({ project, isOpen, onClose }: ProjectModalProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset image index when project changes
  const prevProjectIdRef = useRef<string | undefined>(undefined);
  if (project?.id !== prevProjectIdRef.current) {
    prevProjectIdRef.current = project?.id;
    setCurrentImageIndex(0);
  }

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && project?.media.images.length) {
        setCurrentImageIndex((prev) =>
          prev === 0 ? project.media.images.length - 1 : prev - 1,
        );
      } else if (e.key === "ArrowRight" && project?.media.images.length) {
        setCurrentImageIndex((prev) =>
          prev === project.media.images.length - 1 ? 0 : prev + 1,
        );
      }
    },
    [isOpen, onClose, project],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown, isOpen]);

  const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.95,
      y: prefersReducedMotion ? 0 : 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
    },
    exit: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.95,
      y: prefersReducedMotion ? 0 : 20,
      transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
    },
  };

  if (!project) return null;

  const hasImages = project.media.images.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl bg-card border border-border shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="overflow-y-auto max-h-[90vh]">
              {/* Image Carousel */}
              {hasImages && (
                <div className="relative aspect-video bg-muted">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentImageIndex}
                      src={project.media.images[currentImageIndex]}
                      alt={`${project.title} screenshot ${currentImageIndex + 1}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full object-cover"
                    />
                  </AnimatePresence>

                  {project.media.images.length > 1 && (
                    <>
                      {/* Navigation arrows */}
                      <button
                        onClick={() =>
                          setCurrentImageIndex((prev) =>
                            prev === 0
                              ? project.media.images.length - 1
                              : prev - 1,
                          )
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          setCurrentImageIndex((prev) =>
                            prev === project.media.images.length - 1
                              ? 0
                              : prev + 1,
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      {/* Dots indicator */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {project.media.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentImageIndex
                                ? "bg-primary"
                                : "bg-background/50 hover:bg-background/80"
                            }`}
                            aria-label={`Go to image ${index + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-6 md:p-8">
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-2xl font-bold text-primary">
                      {project.title.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2
                      id="modal-title"
                      className="text-2xl font-bold text-card-foreground mb-2"
                    >
                      {project.title}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge
                        state={project.status.state}
                        usage={project.status.usage}
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {project.description}
                </p>

                {/* Status Notes */}
                {project.status.notes && (
                  <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Status:</span>{" "}
                      {project.status.notes}
                    </p>
                  </div>
                )}

                {/* Tags */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-card-foreground mb-3">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-secondary/50"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Links */}
                <div className="flex flex-wrap gap-3">
                  {project.links.homepage && (
                    <Button asChild variant="default">
                      <a
                        href={project.links.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Homepage
                      </a>
                    </Button>
                  )}
                  {project.links.repository && (
                    <Button asChild variant="outline">
                      <a
                        href={project.links.repository}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Github className="w-4 h-4 mr-2" />
                        Repository
                      </a>
                    </Button>
                  )}
                  {project.links.documentation && (
                    <Button asChild variant="outline">
                      <a
                        href={project.links.documentation}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Docs
                      </a>
                    </Button>
                  )}
                </div>

                {/* Timestamps */}
                <div className="mt-6 pt-6 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>
                    Created:{" "}
                    {new Date(
                      project.timestamps.created_at,
                    ).toLocaleDateString()}
                  </span>
                  <span>
                    Updated:{" "}
                    {new Date(
                      project.timestamps.last_updated_at,
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProjectModal;
