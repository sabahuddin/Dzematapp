import { useEffect, RefObject } from 'react';

export function useEdgeLockScroll(scrollRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    let lastTouchY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const deltaY = lastTouchY - touchY;
      
      const scrollTop = scrollElement.scrollTop;
      const scrollHeight = scrollElement.scrollHeight;
      const clientHeight = scrollElement.clientHeight;
      const maxScroll = scrollHeight - clientHeight;

      // Scrolling down and at bottom
      if (deltaY > 0 && scrollTop >= maxScroll) {
        e.preventDefault();
      }
      
      // Scrolling up and at top
      if (deltaY < 0 && scrollTop <= 0) {
        e.preventDefault();
      }

      lastTouchY = touchY;
    };

    scrollElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollElement.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      scrollElement.removeEventListener('touchstart', handleTouchStart);
      scrollElement.removeEventListener('touchmove', handleTouchMove);
    };
  }, [scrollRef]);
}
