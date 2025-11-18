import { useEffect, RefObject } from 'react';

export function useEdgeLockScroll(scrollRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    // Clamp scroll position to stay 1px inside boundaries
    const clampScrollPosition = () => {
      const scrollTop = scrollElement.scrollTop;
      const scrollHeight = scrollElement.scrollHeight;
      const clientHeight = scrollElement.clientHeight;
      const maxScroll = scrollHeight - clientHeight;

      // If content is too short to scroll, add a filler
      if (maxScroll <= 0) {
        if (!scrollElement.querySelector('.scroll-filler')) {
          const filler = document.createElement('div');
          filler.className = 'scroll-filler';
          filler.style.height = '1px';
          filler.style.width = '1px';
          filler.style.visibility = 'hidden';
          scrollElement.appendChild(filler);
        }
        return;
      }

      // Clamp to [1, maxScroll - 1] to prevent hitting boundaries
      if (scrollTop <= 0) {
        scrollElement.scrollTop = 1;
      } else if (scrollTop >= maxScroll) {
        scrollElement.scrollTop = maxScroll - 1;
      }
    };

    const handleTouchStart = () => {
      clampScrollPosition();
    };

    const handleScroll = () => {
      clampScrollPosition();
    };

    // Initial clamp
    clampScrollPosition();

    scrollElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener('touchstart', handleTouchStart);
      scrollElement.removeEventListener('scroll', handleScroll);
      
      // Clean up filler
      const filler = scrollElement.querySelector('.scroll-filler');
      if (filler) {
        filler.remove();
      }
    };
  }, [scrollRef]);
}
