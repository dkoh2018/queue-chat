import { useEffect } from 'react';

export const useMobileKeyboardHandling = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let initialViewportHeight = window.innerHeight;

    const updateViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    const handleViewportChange = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;

      updateViewportHeight();

      if (heightDifference > 150) {
        document.body.style.setProperty('--keyboard-height', `${heightDifference}px`);
        document.body.classList.add('keyboard-visible');
      } else {
        document.body.style.removeProperty('--keyboard-height');
        document.body.classList.remove('keyboard-visible');
      }
    };

    const handleResize = () => {
      if (window.innerHeight > initialViewportHeight * 0.75) {
        initialViewportHeight = window.innerHeight;
      }
      handleViewportChange();
    };

    const handleVisualViewportChange = () => {
      if ('visualViewport' in window) {
        const viewport = window.visualViewport as VisualViewport;
        const offsetTop = viewport.offsetTop;
        
        if (offsetTop > 0) {
          document.body.style.setProperty('--viewport-offset', `${offsetTop}px`);
          document.body.classList.add('keyboard-visible');
        } else {
          document.body.style.removeProperty('--viewport-offset');
          document.body.classList.remove('keyboard-visible');
        }
      }
    };

    updateViewportHeight();

    window.addEventListener('resize', handleResize, { passive: true });

    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', handleVisualViewportChange, { passive: true });
      window.visualViewport?.addEventListener('scroll', handleVisualViewportChange, { passive: true });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if ('visualViewport' in window) {
        window.visualViewport?.removeEventListener('resize', handleVisualViewportChange);
        window.visualViewport?.removeEventListener('scroll', handleVisualViewportChange);
      }
      document.body.classList.remove('keyboard-visible');
      document.body.style.removeProperty('--keyboard-height');
      document.body.style.removeProperty('--viewport-offset');
    };
  }, []);
};
