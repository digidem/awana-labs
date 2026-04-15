import { useEffect, useRef, useState } from "react";

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

const PRIMARY_CONTOURS = [
  { d: "M-100,400 Q150,200 400,350 T800,300 T1300,400", duration: 2, delay: 0 },
  {
    d: "M-100,420 Q160,230 420,370 T820,320 T1300,420",
    duration: 2,
    delay: 0.1,
  },
  {
    d: "M-100,440 Q170,260 440,390 T840,340 T1300,440",
    duration: 2,
    delay: 0.2,
  },
  { d: "M100,380 Q300,280 500,360 T900,330", duration: 1.8, delay: 0.3 },
  { d: "M100,400 Q310,300 520,380 T920,350", duration: 1.8, delay: 0.4 },
  { d: "M250,370 Q400,320 550,370 T750,350", duration: 1.5, delay: 0.5 },
  { d: "M280,365 Q420,330 570,365 T730,350", duration: 1.5, delay: 0.6 },
  { d: "M600,500 Q800,400 1000,480 T1300,500", duration: 2, delay: 0.7 },
  { d: "M620,520 Q820,420 1020,500 T1300,520", duration: 2, delay: 0.8 },
  { d: "M700,540 Q850,460 1000,520", duration: 1.5, delay: 0.9 },
  { d: "M200,150 Q400,80 600,140 T1000,120", duration: 2, delay: 1 },
  { d: "M180,170 Q380,100 580,160 T980,140", duration: 2, delay: 1.1 },
  {
    d: "M-50,650 Q200,600 450,660 T900,620 T1250,680",
    duration: 2.2,
    delay: 1.2,
  },
  {
    d: "M-50,680 Q210,630 470,690 T920,650 T1250,710",
    duration: 2.2,
    delay: 1.3,
  },
] as const;

const SECONDARY_CONTOURS = [
  { d: "M0,250 Q300,150 600,240 T1200,200", duration: 3, delay: 1.5 },
  { d: "M0,550 Q350,480 700,560 T1200,520", duration: 3, delay: 1.7 },
] as const;

const ContourPath = ({
  d,
  duration,
  delay,
}: {
  d: string;
  duration: number;
  delay: number;
}) => {
  const ref = useRef<SVGPathElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const length = el.getTotalLength?.() ?? 1000;
    el.style.setProperty("--path-length", String(length));
    el.style.setProperty("--anim-duration", `${duration}s`);
    el.style.setProperty("--anim-delay", `${delay}s`);
  }, [duration, delay]);
  return <path ref={ref} d={d} className="topo-path" />;
};

const StaticTopographicBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute h-full w-full opacity-10"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <g
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          className="text-primary"
        >
          {PRIMARY_CONTOURS.map((path) => (
            <path key={path.d} d={path.d} />
          ))}
        </g>
      </svg>

      <svg
        className="absolute h-full w-full opacity-5"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <g
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
          className="text-primary"
        >
          {SECONDARY_CONTOURS.map((path) => (
            <path key={path.d} d={path.d} />
          ))}
        </g>
      </svg>
    </div>
  );
};

function useScrollParallax(
  layer1: React.RefObject<SVGSVGElement | null>,
  layer2: React.RefObject<SVGSVGElement | null>,
) {
  useEffect(() => {
    let rafId: number;
    const onScroll = () => {
      rafId = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (layer1.current) {
          const y1 = Math.min(y * (100 / 500), 100);
          const opacity = 0.15 - Math.min(y / 400, 1) * 0.1;
          layer1.current.style.setProperty("--scroll-y", `${y1}px`);
          layer1.current.style.setProperty("--scroll-opacity", String(opacity));
        }
        if (layer2.current) {
          const y2 = Math.min(y * (50 / 500), 50);
          layer2.current.style.setProperty("--scroll-y", `${y2}px`);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [layer1, layer2]);
}

const AnimatedTopographicBackground = () => {
  const layer1Ref = useRef<SVGSVGElement>(null);
  const layer2Ref = useRef<SVGSVGElement>(null);
  useScrollParallax(layer1Ref, layer2Ref);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        ref={layer1Ref}
        className="topo-parallax-layer absolute h-full w-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <g
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          className="text-primary"
        >
          {PRIMARY_CONTOURS.map((path) => (
            <ContourPath
              key={path.d}
              d={path.d}
              duration={path.duration}
              delay={path.delay}
            />
          ))}
        </g>
      </svg>

      <svg
        ref={layer2Ref}
        className="topo-parallax-layer absolute h-full w-full opacity-10"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <g
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
          className="text-primary"
        >
          {SECONDARY_CONTOURS.map((path) => (
            <ContourPath
              key={path.d}
              d={path.d}
              duration={path.duration}
              delay={path.delay}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

const TopographicBackground = () => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <StaticTopographicBackground />;
  }

  return <AnimatedTopographicBackground />;
};

export default TopographicBackground;
