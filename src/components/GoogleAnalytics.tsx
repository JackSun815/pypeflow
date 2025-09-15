import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Google Analytics 4 configuration
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-B1DJBPY5Y3';

// Initialize Google Analytics
export const initializeGA = () => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });
};

// Track page views
export const trackPageView = (url: string, title?: string) => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
    page_title: title || document.title,
  });
};

// Track custom events
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', eventName, parameters);
};

// Track blog post engagement
export const trackBlogEngagement = (action: string, postTitle: string, postSlug: string) => {
  trackEvent('blog_engagement', {
    action,
    post_title: postTitle,
    post_slug: postSlug,
    engagement_type: 'blog_content'
  });
};

// Track meeting-related events
export const trackMeetingEvent = (action: string, meetingType?: string, clientName?: string) => {
  trackEvent('meeting_action', {
    action,
    meeting_type: meetingType,
    client_name: clientName,
    engagement_type: 'meeting_management'
  });
};

// Track SDR performance events
export const trackSDREvent = (action: string, sdrName?: string, metric?: string) => {
  trackEvent('sdr_action', {
    action,
    sdr_name: sdrName,
    metric,
    engagement_type: 'sdr_management'
  });
};

// Google Analytics component
export default function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    // Initialize GA on first load
    initializeGA();
  }, []);

  useEffect(() => {
    // Track page views on route changes
    if (GA_MEASUREMENT_ID) {
      trackPageView(location.pathname + location.search);
    }
  }, [location]);

  return null;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
