'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const REVEAL_ATTR = 'data-scroll-reveal';

function inViewport(element: Element, offset = 0.15) {
  const rect = element.getBoundingClientRect();
  const threshold = window.innerHeight * (1 - offset);
  return rect.top <= threshold;
}

export function ScrollRevealManager() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;

    if (process.env.NEXT_PUBLIC_SCROLL_REVEAL !== 'true') {
      root.removeAttribute(REVEAL_ATTR);
      return;
    }

    if (pathname.startsWith('/admin') || pathname.startsWith('/edit')) {
      root.removeAttribute(REVEAL_ATTR);
      return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sections = Array.from(document.querySelectorAll('section'));
    if (sections.length === 0) return;

    sections.forEach((section) => {
      const children = Array.from(section.children);
      children.forEach((child, index) => {
        if (child.tagName.toLowerCase() === 'section') return;
        if (!(child instanceof HTMLElement)) return;
        child.setAttribute('data-sr-child', 'true');
        child.style.setProperty('--sr-delay', `${Math.min(index * 80, 400)}ms`);
      });
    });

    if (reduceMotion) {
      sections.forEach((section) => section.classList.add('is-visible'));
      root.removeAttribute(REVEAL_ATTR);
      return;
    }

    sections.forEach((section) => {
      if (inViewport(section)) {
        section.classList.add('is-visible');
      }
    });

    root.setAttribute(REVEAL_ATTR, 'true');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    );

    sections.forEach((section) => {
      if (section.classList.contains('is-visible')) return;
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
