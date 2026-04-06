import {
  useEffect,
  useCallback,
  useState,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { GithubIcon } from "./GithubIcon";
import { useTranslation } from "react-i18next";
import { Project } from "@/types/project";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import ProjectLogo from "@/components/ProjectLogo";
import { formatRelativeTime } from "@/lib/utils";

interface ProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  triggerElement?: HTMLElement | null;
  onClose: () => void;
}

type ImageLoadState = "loading" | "loaded" | "error";

const ProjectModal = ({
  project,
  isOpen,
  triggerElement = null,
  onClose,
}: ProjectModalProps) => {
  const { t, i18n } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoadStates, setImageLoadStates] = useState<
    Record<number, ImageLoadState>
  >({});
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousTriggerRef = useRef<HTMLElement | null>(null);
  /** Cache of prefetched Image objects keyed by URL for adjacent carousel images. */
  const prefetchCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const locale = i18n.resolvedLanguage ?? i18n.language;

  useEffect(() => {
    setCurrentImageIndex(0);
    setImageLoadStates({});
  }, [project?.id]);

  useEffect(() => {
    if (isOpen) {
      previousTriggerRef.current =
        triggerElement ?? (document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null);
      document.body.style.overflow = "hidden";
      closeButtonRef.current?.focus();
      return () => {
        document.body.style.overflow = "";
        if (previousTriggerRef.current?.isConnected) {
          previousTriggerRef.current.focus({ preventScroll: true });
        }
      };
    }

    document.body.style.overflow = "";
    if (previousTriggerRef.current?.isConnected) {
      previousTriggerRef.current.focus({ preventScroll: true });
    }
  }, [isOpen, triggerElement]);

  useEffect(() => {
    if (!isOpen || !project?.media.images[currentImageIndex]) {
      return;
    }

    setImageLoadStates((prev) => ({
      ...prev,
      [currentImageIndex]: prev[currentImageIndex] ?? "loading",
    }));
  }, [currentImageIndex, isOpen, project]);

  /**
   * Prefetch and decode adjacent carousel images after the current image loads.
   * This ensures next/previous images are in the browser cache and decoded
   * before the user navigates, making carousel swaps visually instant.
   */
  useEffect(() => {
    const images = project?.media.images;
    if (!isOpen || !images || images.length <= 1) return;

    const currentUrl = images[currentImageIndex];
    if (!currentUrl) return;

    const prefetchAndDecode = (url: string) => {
      if (prefetchCacheRef.current.has(url)) return;

      const img = new Image();
      img.src = url;
      // .decode() may not be available in all environments (e.g., jsdom)
      if (typeof img.decode === "function") {
        img
          .decode()
          .catch(() => {
            // Decode failure is non-critical — browser will still render
          });
      }
      prefetchCacheRef.current.set(url, img);
    };

    const nextIndex = (currentImageIndex + 1) % images.length;
    const prevIndex =
      (currentImageIndex - 1 + images.length) % images.length;

    prefetchAndDecode(images[nextIndex]);
    if (nextIndex !== prevIndex) {
      prefetchAndDecode(images[prevIndex]);
    }
  }, [currentImageIndex, isOpen, project?.media.images]);

  const goToPreviousImage = useCallback(() => {
    if (!project?.media.images.length) {
      return;
    }

    setCurrentImageIndex((prev) =>
      prev === 0 ? project.media.images.length - 1 : prev - 1,
    );
  }, [project]);

  const goToNextImage = useCallback(() => {
    if (!project?.media.images.length) {
      return;
    }

    setCurrentImageIndex((prev) =>
      prev === project.media.images.length - 1 ? 0 : prev + 1,
    );
  }, [project]);

  const modalRef = useRef<HTMLDivElement | null>(null);

  const handleModalKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPreviousImage();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNextImage();
      } else if (event.key === "Tab") {
        // Focus trap: wrap Tab/Shift+Tab within focusable elements
        const modal = modalRef.current;
        if (!modal) return;
        const focusable = modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    },
    [goToNextImage, goToPreviousImage, onClose],
  );

  if (!project) return null;

  const hasImages = project.media.images.length > 0;
  const currentImageState = imageLoadStates[currentImageIndex] ?? "loading";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        onKeyDown={handleModalKeyDown}
        className="animate-modal-in relative z-10 w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-lg sm:rounded-xl bg-card border border-border shadow-2xl mx-2 sm:mx-0"
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
          aria-label={t("projectModal.closeModal")}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto overflow-x-hidden max-h-[90vh]">
          {/* Image Carousel */}
          {hasImages && (
            <div className="relative aspect-video bg-muted">
              {currentImageState !== "error" && (
                <img
                  key={`${project.id}-${currentImageIndex}`}
                  src={project.media.images[currentImageIndex]}
                  alt={t("projectModal.imageAlt", {
                    title: project.title,
                    index: currentImageIndex + 1,
                  })}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  onLoad={() =>
                    setImageLoadStates((prev) => ({
                      ...prev,
                      [currentImageIndex]: "loaded",
                    }))
                  }
                  onError={() =>
                    setImageLoadStates((prev) => ({
                      ...prev,
                      [currentImageIndex]: "error",
                    }))
                  }
                  className="w-full h-full object-cover animate-fade-in"
                />
              )}

              {currentImageState === "loading" && (
                <div
                  className="absolute inset-0 animate-pulse bg-muted"
                  role="status"
                  aria-label={t("projectModal.imageLoading")}
                >
                  {/* Skeleton shimmer overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                </div>
              )}

              {currentImageState === "error" && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted px-6 text-center text-sm text-muted-foreground">
                  {t("projectModal.imageUnavailable")}
                </div>
              )}

              {project.media.images.length > 1 && (
                <>
                  {/* Navigation arrows */}
                  <button
                    onClick={goToPreviousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
                    aria-label={t("projectModal.previousImage")}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={goToNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
                    aria-label={t("projectModal.nextImage")}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Dots indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {project.media.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        aria-current={index === currentImageIndex ? "true" : undefined}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex
                            ? "bg-primary"
                            : "bg-background/50 hover:bg-background/80"
                        }`}
                        aria-label={t("projectModal.goToImage", {
                          index: index + 1,
                        })}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-4 sm:p-6 md:p-8">
            {/* Header */}
            <div className="flex items-start gap-3 sm:gap-4 mb-6">
              <ProjectLogo
                logo={project.media?.logo ?? ""}
                title={project.title}
                className="shrink-0"
                iconSize={28}
              />
              <div className="flex-1 min-w-0">
                <h2
                  id="modal-title"
                  className="text-xl sm:text-2xl font-bold text-card-foreground mb-2"
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
                  <span className="font-medium">
                    {t("projects.statusLabel")}:
                  </span>{" "}
                  {project.status.notes}
                </p>
              </div>
            )}

            {/* Tags */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-card-foreground mb-3">
                {t("projects.tags")}
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
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
              {project.links.homepage && (
                <Button
                  asChild
                  variant="default"
                  className="w-full sm:w-auto"
                >
                  <a
                    href={project.links.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {t("projectModal.homepage")}
                  </a>
                </Button>
              )}
              {project.links.repository && (
                <Button
                  asChild
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <a
                    href={project.links.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GithubIcon className="w-4 h-4 mr-2" />
                    {t("projectModal.repository")}
                  </a>
                </Button>
              )}
              {project.links.documentation && (
                <Button
                  asChild
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <a
                    href={project.links.documentation}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    {t("projectModal.docs")}
                  </a>
                </Button>
              )}
            </div>

            {/* Timestamps */}
            <div className="mt-6 pt-6 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="bg-muted/40 rounded-md px-2 py-1">
                {t("projects.updated")}:{" "}
                {formatRelativeTime(project.repoMetadata?.pushed_at ?? project.timestamps.last_updated_at, locale, t)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
