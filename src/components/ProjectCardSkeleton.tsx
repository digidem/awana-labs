import { CardHeader, CardContent } from "@/components/ui/card";

/**
 * Skeleton card that mirrors the exact layout of ProjectCard.
 * Used during initial load to prevent layout shift when real data arrives.
 */
const ProjectCardSkeleton = () => (
  <div
    className="h-full w-full rounded-lg border border-border/50 bg-card/80 shadow-sm"
    aria-hidden="true"
  >
    <CardHeader className="pb-3">
      <div className="flex items-center gap-3 mb-4">
        {/* Logo placeholder — matches ProjectLogo dimensions (w-12 h-12) */}
        <div className="w-12 h-12 rounded-lg bg-muted animate-pulse" />
        {/* Status pill placeholder */}
        <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
      </div>
      {/* Title placeholder */}
      <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
    </CardHeader>

    <CardContent className="pt-0">
      {/* Description lines */}
      <div className="h-3 w-full rounded bg-muted animate-pulse mb-2" />
      <div className="h-3 w-full rounded bg-muted animate-pulse mb-2" />
      <div className="h-3 w-2/3 rounded bg-muted animate-pulse mb-4" />

      {/* Tags */}
      <div className="flex gap-1.5 mb-4">
        <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
        <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
        <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
      </div>

      {/* Footer bar */}
      <div className="h-6 w-full rounded-md bg-muted/40 animate-pulse" />
    </CardContent>
  </div>
);

export default ProjectCardSkeleton;
