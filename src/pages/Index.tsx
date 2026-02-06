import { useState, useEffect } from "react";
import Hero from "@/components/Hero";
import ProjectsGallery from "@/components/ProjectsGallery";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Project, ProjectsData } from "@/types/project";

const Index = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}projects.json`,
        );
        const data: ProjectsData = await response.json();
        setProjects(data.projects);
      } catch (error) {
        console.error("Failed to load projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <ProjectsGallery projects={projects} />
      <Footer />
    </main>
  );
};

export default Index;
