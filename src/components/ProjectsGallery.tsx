import { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Project } from "@/types/project";
import { Input } from "@/components/ui/input";
import ProjectCard from "./ProjectCard";
import ProjectModal from "./ProjectModal";

interface ProjectsGalleryProps {
  projects: Project[];
}

type StatusFilter = "all" | "active" | "paused" | "archived";

const ProjectsGallery = ({ projects }: ProjectsGalleryProps) => {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

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

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
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
  }, [projects, statusFilter, searchQuery]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
      },
    },
  };

  return (
    <section id="projects" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-12 px-4"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            {t("projects.title")}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            {t("projects.subtitle")}
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col gap-4 mb-8"
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
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card hover:bg-secondary text-foreground border border-border"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            id="projects-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={(trigger) => {
                  setActiveTrigger(trigger);
                  setSelectedProject(project);
                }}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
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
          </motion.div>
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
