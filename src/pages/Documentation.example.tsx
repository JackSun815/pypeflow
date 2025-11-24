/**
 * EXAMPLE: How to add videos and images to documentation
 * 
 * This file shows examples of how to structure your content with videos and images.
 * Copy these patterns into the actual Documentation.tsx file.
 */

// ============================================
// STEP 1: Import your videos at the top of Documentation.tsx
// ============================================

// Manager videos
import managerOverviewVideo from '../demo-video/manager/overview.webm';
import managerTeamManagementVideo from '../demo-video/manager/team-management.webm';
import managerAnalyticsVideo from '../demo-video/manager/analytics.webm';

// SDR videos
import sdrDashboardVideo from '../demo-video/sdr/dashboard.webm';
import sdrGoalsVideo from '../demo-video/sdr/goals.webm';

// Client videos
import clientOverviewVideo from '../demo-video/client/overview.webm';

// ============================================
// STEP 2: Add video paths to videoPaths object
// ============================================

const videoPaths: Record<string, string> = {
  // Manager videos
  'manager-overview': managerOverviewVideo,
  'manager-team-management': managerTeamManagementVideo,
  'manager-analytics': managerAnalyticsVideo,
  'manager-meetings': '', // Add when you create the video
  'manager-clients': '',
  'manager-users': '',
  'manager-history': '',
  'manager-icp': '',
  
  // SDR videos
  'sdr-dashboard': sdrDashboardVideo,
  'sdr-goals': sdrGoalsVideo,
  'sdr-meetings': '',
  'sdr-analytics': '',
  'sdr-commissions': '',
  'sdr-history': '',
  
  // Client videos
  'client-overview': clientOverviewVideo,
  'client-meetings': '',
  'client-calendar': '',
  'client-linkedin': '',
  'client-cold-calling': '',
  'client-analytics': '',
};

// ============================================
// STEP 3: Import your images
// ============================================

import managerOverviewDashboardImg from '../demo-images/manager/overview/dashboard-screenshot.png';
import managerOverviewMetricsImg from '../demo-images/manager/overview/metrics-overview.png';
import sdrDashboardGoalsImg from '../demo-images/sdr/dashboard/goal-tracking.png';

// ============================================
// STEP 4: Add image paths to imagePaths object
// ============================================

const imagePaths: Record<string, string> = {
  'manager-overview-dashboard': managerOverviewDashboardImg,
  'manager-overview-metrics': managerOverviewMetricsImg,
  'sdr-dashboard-goals': sdrDashboardGoalsImg,
  // Add more as needed
};

// ============================================
// STEP 5: Add images to content sections
// ============================================

const content = {
  manager: {
    overview: {
      title: 'Manager Dashboard Overview',
      description: 'Get complete visibility into your SDR team\'s performance.',
      sections: [
        {
          title: 'Centralized Command Center',
          content: 'The Manager Dashboard provides a comprehensive view...',
          // Add images array to any section
          images: [
            {
              name: 'dashboard', // This will look for: manager-overview-dashboard in imagePaths
              alt: 'Manager Dashboard Screenshot',
              caption: 'The main dashboard showing team performance metrics'
            },
            {
              name: 'metrics',
              alt: 'Metrics Overview',
              caption: 'Key performance indicators at a glance'
            }
          ]
        },
        {
          title: 'Key Metrics at a Glance',
          content: 'Your dashboard displays critical KPIs...',
          // This section has no images
        }
      ],
    },
    // ... other sections
  },
  // ... other roles
};

// ============================================
// NOTES:
// ============================================
// 
// 1. Video naming: Must match subsection ID
//    - Section: 'manager', Subsection: 'overview'
//    - File: src/demo-video/manager/overview.webm
//    - Key: 'manager-overview'
//
// 2. Image naming: Use descriptive names
//    - Section: 'manager', Subsection: 'overview', Image: 'dashboard'
//    - File: src/demo-images/manager/overview/dashboard-screenshot.png
//    - Key: 'manager-overview-dashboard'
//
// 3. Videos are automatically displayed at the top of each documentation page
//    if they exist in videoPaths
//
// 4. Images are displayed inline within sections where you add them to the
//    images array
//
// 5. If a video/image doesn't exist, it simply won't be displayed (no errors)

