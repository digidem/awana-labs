import Hero from "@/components/Hero";
import ProjectsGallery from "@/components/ProjectsGallery";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useProjectsWithError } from "@/hooks/useProjects";
import { useTranslation } from "react-i18next";

const Index = () => {
  const { t } = useTranslation();
  const { projects, isLoading, isError, errorType, refetch } =
    useProjectsWithError();

  const errorCopy =
    errorType === "offline"
      ? {
          title: t("index.offlineTitle"),
          description: t("index.offlineDescription"),
        }
      : errorType === "timeout"
        ? {
            title: t("index.timeoutTitle"),
            description: t("index.timeoutDescription"),
          }
        : {
            title: t("index.errorTitle"),
            description: t("index.errorDescription"),
          };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md px-6 text-center">
          <h1 className="animate-pulse text-2xl font-semibold text-primary">
            {t("index.loadingTitle")}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("index.loadingDescription")}
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            {errorCopy.title}
          </h1>
          <p className="text-muted-foreground mb-6">
            {errorCopy.description}
          </p>
          <button
            onClick={() => void refetch()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t("common.retry")}
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
