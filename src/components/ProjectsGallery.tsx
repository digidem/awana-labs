import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Project } from "@/types/project";
import { Input } from "@/components/ui/input";
import { sortProjects } from "@/lib/sort-projects";
import ProjectCard from "./ProjectCard";
import ProjectModal from "./ProjectModal";

/** Maximum number of unique hosts to dynamically preconnect to. */
const MAX_PRECONNECT_HOSTS = 5;
const preconnectedHosts = new Set<string>();

/**
 * Dynamically inject a `<link rel="preconnect">` for the given URL's origin.
 * Covers non-GitHub image hosts that aren't hardcoded in index.html.
 */
function preconnectOrigin(url: string): void {
  try {
    const { origin } = new URL(url);
    if (!origin || origin === "null" || preconnectedHosts.has(origin)) return;
    if (preconnectedHosts.size >= MAX_PRECONNECT_HOSTS) return;
    if (document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) {
      preconnectedHosts.add(origin);
      return;
    }
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = origin;
    document.head.appendChild(link);
    preconnectedHosts.add(origin);
  } catch {
    // Invalid URL — ignore
  }
}

interface ProjectsGalleryProps {
  projects: Project[];
}

type StatusFilter = "all" | "active" | "paused" | "archived";

const ProjectsGallery = ({ projects }: ProjectsGalleryProps) => {
  const { t } = useTranslation();

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: t("common.all") },
    { value: "active", label: t("status.active") },
    { value: "paused", label: t("status.paused") },
    { value: "archived", label: t("status.archived") },
  ];
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTrigger, setActiveTrigger] = useState<HTMLButtonElement | null>(
    null,
  );

  /** Track which project images have been prefetched to avoid duplicate work. */
  const prefetchedRef = useRef<Set<string>>(new Set());

  /** Prefetch the first modal image for a project on hover/focus/touch. */
  const handlePrefetch = useCallback((project: Project) => {
    const firstImage = project.media.images[0];
    if (!firstImage || prefetchedRef.current.has(firstImage)) return;
    prefetchedRef.current.add(firstImage);

    preconnectOrigin(firstImage);
    const img = new Image();
    img.src = firstImage;
  }, []);

  const sortedProjects = useMemo(() => sortProjects(projects), [projects]);

  const filteredProjects = useMemo(() => {
    return sortedProjects.filter((project) => {
      // Status filter
      if (statusFilter !== "all" && project.status.state !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          project.title.toLowerCase().includes(query) ||
          project.description.toLowerCase().includes(query) ||
          project.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [sortedProjects, statusFilter, searchQuery]);

  /** Track whether the user has interacted with filters before announcing count. */
  const hasInteracted = useRef(false);
  const liveRegionRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (searchQuery || statusFilter !== "all") {
      hasInteracted.current = true;
    }
    if (hasInteracted.current && liveRegionRef.current) {
      liveRegionRef.current.textContent = t("projects.resultsCount", {
        count: filteredProjects.length,
      });
    }
  }, [searchQuery, statusFilter, filteredProjects.length, t]);

  return (
    <section id="projects" tabIndex={-1} className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12 px-4 animate-fade-up">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            {t("projects.title")}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            {t("projects.subtitle")}
          </p>
        </div>

        {/* Filters */}
        <div
          className="flex flex-col gap-4 mb-8 animate-fade-up"
          style={{ animationDelay: "0.1s" }}
        >
          {/* Search */}
          <div className="relative w-full sm:max-w-md mx-auto sm:mx-0">
            <label htmlFor="project-search" className="sr-only">
              {t("projects.searchLabel")}
            </label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="project-search"
              type="text"
              placeholder={t("projects.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50"
            />
          </div>

          {/* Status Filter Pills */}
          <div
            role="group"
            aria-label={t("projects.statusFilterLabel")}
            className="flex gap-2 flex-wrap justify-center sm:justify-start"
          >
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                aria-pressed={statusFilter === option.value}
                className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  statusFilter === option.value
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary-foreground/30"
                    : "bg-card hover:bg-secondary text-foreground border border-border"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Screen-reader announcement for filtered count */}
        <p
          ref={liveRegionRef}
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        />

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div
            id="projects-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredProjects.map((project, index) => (
              <div
                key={project.id}
                className="animate-card-in"
                style={{
                  animationDelay: `${Math.min(index * 0.1, 0.9)}s`,
                }}
              >
                <ProjectCard
                  project={project}
                  onClick={(trigger) => {
                    setActiveTrigger(trigger);
                    setSelectedProject(project);
                  }}
                  onPrefetch={() => handlePrefetch(project)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 animate-fade-in">
            <p className="text-muted-foreground text-lg">
              {t("projects.noResults")}
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="mt-4 text-primary hover:underline"
            >
              {t("projects.clearFilters")}
            </button>
          </div>
        )}
      </div>

      {/* Project Modal */}
      <ProjectModal
        project={selectedProject}
        isOpen={!!selectedProject}
        triggerElement={activeTrigger}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  );
};

export default ProjectsGallery;
