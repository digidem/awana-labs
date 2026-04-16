import { lazy, Suspense, useState } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/hooks/useLanguage";
import useDocumentMeta from "@/hooks/useDocumentMeta";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));

const AppContent = () => {
  useDocumentMeta();

  return (
    <TooltipProvider>
      <Sonner />
      <HashRouter>
        <Suspense
          fallback={
            <div className="min-h-screen bg-background">
              <div className="h-16 md:h-20" />
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center px-6">
                  <div className="h-8 w-48 rounded bg-muted/50 mx-auto mb-4 animate-pulse" />
                  <div className="h-4 w-64 rounded bg-muted/30 mx-auto animate-pulse" />
                </div>
              </div>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </TooltipProvider>
  );
};

const App = () => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: false,
            retry: 2,
          },
        },
      }),
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
