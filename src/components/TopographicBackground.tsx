import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

const PRIMARY_CONTOURS = [
  { d: "M-100,400 Q150,200 400,350 T800,300 T1300,400", duration: 2, delay: 0 },
  { d: "M-100,420 Q160,230 420,370 T820,320 T1300,420", duration: 2, delay: 0.1 },
  { d: "M-100,440 Q170,260 440,390 T840,340 T1300,440", duration: 2, delay: 0.2 },
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
  return (
    <motion.path
      d={d}
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration, delay, ease: "easeInOut" }}
    />
  );
};

const StaticTopographicBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute h-full w-full opacity-10"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <g stroke="currentColor" strokeWidth="1" fill="none" className="text-primary">
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
        <g stroke="currentColor" strokeWidth="0.5" fill="none" className="text-primary">
          {SECONDARY_CONTOURS.map((path) => (
            <path key={path.d} d={path.d} />
          ))}
        </g>
      </svg>
    </div>
  );
};

const AnimatedTopographicBackground = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 100]);
  const y2 = useTransform(scrollY, [0, 500], [0, 50]);
  const opacity = useTransform(scrollY, [0, 400], [0.15, 0.05]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.svg
        style={{ y: y1, opacity }}
        className="absolute h-full w-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <g stroke="currentColor" strokeWidth="1" fill="none" className="text-primary">
          {PRIMARY_CONTOURS.map((path) => (
            <ContourPath
              key={path.d}
              d={path.d}
              duration={path.duration}
              delay={path.delay}
            />
          ))}
        </g>
      </motion.svg>

      <motion.svg
        style={{ y: y2 }}
        className="absolute h-full w-full opacity-10"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <g stroke="currentColor" strokeWidth="0.5" fill="none" className="text-primary">
          {SECONDARY_CONTOURS.map((path) => (
            <ContourPath
              key={path.d}
              d={path.d}
              duration={path.duration}
              delay={path.delay}
            />
          ))}
        </g>
      </motion.svg>
    </div>
  );
};

const TopographicBackground = () => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <StaticTopographicBackground />;
  }

  return (
    <AnimatedTopographicBackground />
  );
};

export default TopographicBackground;
