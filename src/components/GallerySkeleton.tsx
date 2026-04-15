import ProjectCardSkeleton from "@/components/ProjectCardSkeleton";

interface GallerySkeletonProps {
  count?: number;
}

/**
 * Skeleton grid that mirrors the exact layout of ProjectsGallery.
 * Shown during initial load (no localStorage cache) to provide visual
 * continuity and prevent layout shift when real data arrives.
 */
const GallerySkeleton = ({ count = 6 }: GallerySkeletonProps) => (
  <section
    id="projects"
    tabIndex={-1}
    className="py-20 px-6"
    data-testid="gallery-skeleton"
    aria-hidden="true"
  >
    <div className="max-w-7xl mx-auto">
      {/* Section Header skeleton */}
      <div className="text-center mb-8 sm:mb-12 px-4">
        <div className="h-8 w-64 rounded bg-muted mx-auto mb-3 sm:mb-4 animate-pulse" />
        <div className="h-4 w-96 max-w-full rounded bg-muted mx-auto animate-pulse" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="h-10 w-full sm:max-w-md rounded-md bg-muted animate-pulse" />
        <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-16 sm:w-20 rounded-full bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </section>
);

export default GallerySkeleton;
