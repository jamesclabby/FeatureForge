import { useEffect } from 'react';

/**
 * Custom hook for performance monitoring
 * Tracks Web Vitals and custom performance metrics
 */
export function usePerformance() {
  useEffect(() => {
    // Only run in production or when explicitly enabled
    if (process.env.NODE_ENV !== 'production' && !process.env.REACT_APP_ENABLE_PERFORMANCE_MONITORING) {
      return;
    }

    // Track page load time
    const trackPageLoad = () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        console.log(`Page load time: ${loadTime}ms`);
        
        // You can send this to an analytics service
        // analytics.track('page_load_time', { duration: loadTime });
      }
    };

    // Track component render times
    const trackRenderTime = (name, startTime) => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      console.log(`${name} render time: ${renderTime}ms`);
      
      // You can send this to an analytics service
      // analytics.track('component_render_time', { component: name, duration: renderTime });
    };

    // Import web-vitals dynamically to avoid affecting bundle size
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // Track Core Web Vitals
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    }).catch(() => {
      // web-vitals not available, skip monitoring
    });

    // Track page load when component mounts
    if (document.readyState === 'complete') {
      trackPageLoad();
    } else {
      window.addEventListener('load', trackPageLoad);
      return () => window.removeEventListener('load', trackPageLoad);
    }
  }, []);

  // Return utility functions for manual tracking
  return {
    trackEvent: (eventName, data) => {
      console.log(`Custom event: ${eventName}`, data);
      // You can send this to an analytics service
      // analytics.track(eventName, data);
    },
    trackError: (error, context) => {
      console.error('Tracked error:', error, context);
      // You can send this to an error tracking service
      // errorTracking.captureException(error, context);
    }
  };
}

/**
 * Higher-order component for automatic performance tracking
 */
export function withPerformanceTracking(WrappedComponent, componentName) {
  return function PerformanceTrackedComponent(props) {
    useEffect(() => {
      const startTime = performance.now();
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} initial render: ${renderTime}ms`);
      }
    }, []);

    return <WrappedComponent {...props} />;
  };
}

export default usePerformance; 