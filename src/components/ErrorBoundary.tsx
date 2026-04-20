import React from "react";
import { useTranslation } from "react-i18next";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Functional error display component with i18n support.
 * Extracted from the class boundary so translations update reactively
 * without manual i18n.on("languageChanged") + forceUpdate().
 */
function ErrorDisplay({
  onRetry,
}: {
  error: Error | null;
  onRetry: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-destructive mb-4">
          {t("errorBoundary.title")}
        </h1>
        <p className="text-muted-foreground mb-6">
          {t("errorBoundary.description")}
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {t("errorBoundary.retry")}
        </button>
      </div>
    </div>
  );
}

/**
 * Minimal class-based error boundary shell.
 * Only handles getDerivedStateFromError / componentDidCatch — rendering
 * is delegated to the functional ErrorDisplay component for reactive i18n.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Always log in production for observability; include component stack in DEV
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, errorInfo);
    } else {
      console.error("[ErrorBoundary]", error);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorDisplay error={this.state.error} onRetry={this.handleRetry} />
      );
    }

    return this.props.children;
  }
}
