import Hero from "@/components/Hero";
import ProjectsGallery from "@/components/ProjectsGallery";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useProjectsWithError } from "@/hooks/useProjects";

const Index = () => {
  const { projects, isLoading, isError } = useProjectsWithError();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Failed to load projects
          </h1>
          <p className="text-muted-foreground mb-6">
            Failed to load projects. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
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
