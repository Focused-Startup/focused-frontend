import { useRef, useState } from 'react';

interface UseScrollHeaderProps {
  scrollThreshold?: number;
  headerThreshold?: number;
}

export function useScrollHeader({ 
  scrollThreshold = 10, 
  headerThreshold = 50 
}: UseScrollHeaderProps = {}) {
  const lastScrollY = useRef(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;

    // Don't hide header when near the top
    if (currentScrollY < headerThreshold) {
      if (!isHeaderVisible) {
        setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
      return;
    }

    const scrollDifference = currentScrollY - lastScrollY.current;

    // Only update if scroll difference is significant enough
    if (Math.abs(scrollDifference) > scrollThreshold) {
      const shouldShowHeader = scrollDifference < 0; // Scrolling up
      
      if (shouldShowHeader !== isHeaderVisible) {
        setIsHeaderVisible(shouldShowHeader);
      }
      
      lastScrollY.current = currentScrollY;
    }
  };

  return {
    isHeaderVisible,
    handleScroll,
    scrollEventThrottle: 16,
  };
}
