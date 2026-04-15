import { lazy, Suspense } from "react";
import Hero from "@/components/Hero";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import GallerySkeleton from "@/components/GallerySkeleton";
import { useProjectsWithError } from "@/hooks/useProjects";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const ProjectsGallery = lazy(() => import("@/components/ProjectsGallery"));

const Index = () => {
  const { t } = useTranslation();
  const { projects, isLoading, isError, errorType, refetch } =
    useProjectsWithError();

  // When placeholder data exists but fetch fails, show cached data instead of error.
  // The existing fetchProjects() already falls back to cache on error (api.ts:298-315).
  if (isError && projects.length === 0) {
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
          : errorType === "rate-limit"
            ? {
                title: t("index.rateLimitTitle"),
                description: t("index.rateLimitDescription"),
              }
            : {
                title: t("index.errorTitle"),
                description: t("index.errorDescription"),
              };

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            {errorCopy.title}
          </h1>
          <p className="text-muted-foreground mb-6">
            {errorCopy.description}
          </p>
          <Button onClick={() => void refetch()} variant="default">
            {t("common.retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <a
        href="#projects"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:shadow-lg"
      >
        {t("accessibility.skipToContent")}
      </a>
      <Header />
      <Hero />
      {isError && projects.length > 0 && (
        <div className="max-w-7xl mx-auto px-6" role="alert">
          <div className="bg-muted/60 border border-border rounded-md px-4 py-2 text-sm text-muted-foreground flex items-center justify-between">
            <span>{t("index.staleDataWarning")}</span>
            <button
              type="button"
              onClick={() => void refetch()}
              className="text-primary hover:underline text-sm font-medium ml-4"
            >
              {t("common.retry")}
            </button>
          </div>
        </div>
      )}
      {isLoading ? (
        <GallerySkeleton count={6} />
      ) : (
        <Suspense fallback={<GallerySkeleton count={6} />}>
          <ProjectsGallery projects={projects} />
        </Suspense>
      )}
      <Footer />
      <ScrollToTop />
    </main>
  );
};

export default Index;
