import { useEffect, useRef } from 'react';

type RevealOptions = {
  once?: boolean;
  threshold?: number;
  rootMargin?: string;
};

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(options: RevealOptions = {}) {
  const {
    once = true,
    threshold = 0.16,
    rootMargin = '0px 0px -8% 0px',
  } = options;

  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      node.classList.add('is-revealed');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove('is-revealed');
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, threshold, rootMargin]);

  return ref;
}

export function bindScrollReveal(root: ParentNode = document, selector = '[data-reveal]') {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(selector));

  if (reduceMotion) {
    nodes.forEach((node) => node.classList.add('is-revealed'));
    return () => undefined;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: '0px 0px -6% 0px' }
  );

  nodes.forEach((node) => {
    if (!node.classList.contains('is-revealed')) observer.observe(node);
  });

  return () => observer.disconnect();
}
