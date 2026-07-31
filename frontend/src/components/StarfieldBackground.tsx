import { useEffect, useMemo, useRef, useState } from 'react';

type Star = {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  tint: 'white' | 'violet' | 'soft';
};

type ShootingStar = {
  id: number;
  top: number;
  left: number;
  duration: number;
  delay: number;
  tone: 'violet' | 'soft';
};

function createStars(count: number, sizeRange: [number, number], layerSeed: number): Star[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = layerSeed * 1000 + index * 17;
    const rand = (offset: number) => {
      const value = Math.sin(seed + offset * 12.9898) * 43758.5453;
      return value - Math.floor(value);
    };

    const tintRoll = rand(3);
    const tint: Star['tint'] = tintRoll > 0.86 ? 'violet' : tintRoll > 0.72 ? 'soft' : 'white';

    return {
      id: seed,
      x: rand(1) * 100,
      y: rand(2) * 100,
      size: sizeRange[0] + rand(4) * (sizeRange[1] - sizeRange[0]),
      opacity: 0.28 + rand(5) * 0.45,
      duration: 3 + rand(6) * 4,
      delay: rand(7) * 8,
      tint,
    };
  });
}

function starColor(tint: Star['tint'], opacity: number) {
  if (tint === 'violet') return `rgba(196, 181, 253, ${opacity})`;
  if (tint === 'soft') return `rgba(169, 155, 232, ${opacity})`;
  return `rgba(216, 212, 232, ${opacity})`;
}

export default function StarfieldBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);

  const farStars = useMemo(() => createStars(isMobile ? 40 : 70, [0.8, 1.4], 1), [isMobile]);
  const midStars = useMemo(() => createStars(isMobile ? 22 : 38, [1.1, 1.8], 2), [isMobile]);
  const nearStars = useMemo(() => createStars(isMobile ? 8 : 14, [1.4, 2.2], 3), [isMobile]);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const widthQuery = window.matchMedia('(max-width: 768px)');

    const syncPreferences = () => {
      setReduceMotion(motionQuery.matches);
      setIsMobile(widthQuery.matches);
    };

    syncPreferences();
    motionQuery.addEventListener('change', syncPreferences);
    widthQuery.addEventListener('change', syncPreferences);

    return () => {
      motionQuery.removeEventListener('change', syncPreferences);
      widthQuery.removeEventListener('change', syncPreferences);
    };
  }, []);

  useEffect(() => {
    if (reduceMotion || isMobile) return;

    const root = rootRef.current;
    if (!root) return;

    let frame = 0;
    const onMove = (event: MouseEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth - 0.5) * 2;
        const y = (event.clientY / window.innerHeight - 0.5) * 2;
        root.style.setProperty('--parallax-x', `${x}`);
        root.style.setProperty('--parallax-y', `${y}`);
      });
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', onMove);
    };
  }, [reduceMotion, isMobile]);

  useEffect(() => {
    if (reduceMotion) {
      setShootingStars([]);
      return;
    }

    let timeoutId = 0;
    let starId = 0;

    const spawn = () => {
      const next: ShootingStar = {
        id: starId++,
        top: 8 + Math.random() * 45,
        left: 10 + Math.random() * 70,
        duration: 0.85 + Math.random() * 0.55,
        delay: 0,
        tone: Math.random() > 0.65 ? 'soft' : 'violet',
      };

      setShootingStars([next]);
      const gap = 12000 + Math.random() * 13000;
      timeoutId = window.setTimeout(spawn, gap);
    };

    timeoutId = window.setTimeout(spawn, 4000 + Math.random() * 6000);
    return () => window.clearTimeout(timeoutId);
  }, [reduceMotion]);

  return (
    <div
      ref={rootRef}
      className={`starfield ${reduceMotion ? 'starfield--static' : ''}`}
      aria-hidden="true"
    >
      <div className="starfield__gradient" />
      <div className="starfield__nebula starfield__nebula--primary" />
      <div className="starfield__nebula starfield__nebula--soft" />
      <div className="starfield__nebula starfield__nebula--deep" />

      <div className="starfield__layer starfield__layer--far">
        {farStars.map((star) => (
          <span
            key={star.id}
            className="starfield__star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              background: starColor(star.tint, star.opacity),
              animationDuration: reduceMotion ? undefined : `${star.duration}s`,
              animationDelay: reduceMotion ? undefined : `${star.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="starfield__layer starfield__layer--mid">
        {midStars.map((star) => (
          <span
            key={star.id}
            className="starfield__star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              background: starColor(star.tint, star.opacity),
              animationDuration: reduceMotion ? undefined : `${star.duration}s`,
              animationDelay: reduceMotion ? undefined : `${star.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="starfield__layer starfield__layer--near">
        {nearStars.map((star) => (
          <span
            key={star.id}
            className="starfield__star starfield__star--near"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              background: starColor(star.tint, Math.min(star.opacity + 0.12, 0.85)),
              animationDuration: reduceMotion ? undefined : `${star.duration}s`,
              animationDelay: reduceMotion ? undefined : `${star.delay}s`,
            }}
          />
        ))}
      </div>

      {!reduceMotion &&
        shootingStars.map((star) => (
          <span
            key={star.id}
            className={`starfield__shooting starfield__shooting--${star.tone}`}
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              animationDuration: `${star.duration}s`,
            }}
          />
        ))}
    </div>
  );
}
