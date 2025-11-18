import { useEffect, RefObject } from 'react';

export function useEdgeLockScroll(scrollRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    let startY = 0;
    let startScrollTop = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].pageY;
      startScrollTop = scrollElement.scrollTop;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].pageY;
      const deltaY = startY - currentY;
      
      const scrollTop = scrollElement.scrollTop;
      const scrollHeight = scrollElement.scrollHeight;
      const clientHeight = scrollElement.clientHeight;
      const maxScroll = scrollHeight - clientHeight;
      
      const isAtTop = scrollTop <= 0;
      const isAtBottom = scrollTop >= maxScroll;
      
      // Block pull-to-refresh (scrolling up when already at top)
      if (isAtTop && deltaY < 0) {
        e.preventDefault();
        scrollElement.scrollTop = 0;
        return;
      }
      
      // Block over-scroll at bottom
      if (isAtBottom && deltaY > 0) {
        e.preventDefault();
        scrollElement.scrollTop = maxScroll;
        return;
      }
    };

    const handleTouchEnd = () => {
      // Ensure scroll position is locked at boundaries
      const scrollTop = scrollElement.scrollTop;
      const scrollHeight = scrollElement.scrollHeight;
      const clientHeight = scrollElement.clientHeight;
      const maxScroll = scrollHeight - clientHeight;
      
      if (scrollTop < 0) {
        scrollElement.scrollTop = 0;
      } else if (scrollTop > maxScroll) {
        scrollElement.scrollTop = maxScroll;
      }
    };

    scrollElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    scrollElement.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      scrollElement.removeEventListener('touchstart', handleTouchStart);
      scrollElement.removeEventListener('touchmove', handleTouchMove);
      scrollElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [scrollRef]);
}
