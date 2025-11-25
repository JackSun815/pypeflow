import { useState, useMemo, useRef } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Book, 
  Users, 
  User, 
  Briefcase,
  BarChart2,
  Calendar,
  Settings,
  Mail,
  Clock,
  TrendingUp,
  Shield,
  History,
  Building,
  ArrowLeft,
  Phone,
  Play,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';

type Section = 'manager' | 'sdr' | 'client';

// Video paths - add imports here as you create videos
// SDR Dashboard videos
import sdrDashboard1 from '../demo-video/sdr/sdr-dashboard-1.mp4';
import sdrDashboard2 from '../demo-video/sdr/sdr-dashboard-2.mp4';
import sdrDashboard3 from '../demo-video/sdr/sdr-dashboard-3.mp4';
import sdrDashboard4 from '../demo-video/sdr/sdr-dashboard-4.mp4';
import sdrDashboard5 from '../demo-video/sdr/sdr-dashboard-5.mp4';
import sdrDashboard6 from '../demo-video/sdr/sdr-dashboard-6.mp4';
import importMeetings from '../demo-video/sdr/import-meetings.mp4';
import sdrCalendar1 from '../demo-video/sdr/sdr-calendar-1.mp4';
import sdrMeetingHistory1 from '../demo-video/sdr/sdr-meetinghistory-1.mp4';
import sdrCommissions1 from '../demo-video/sdr/sdr-commissions-1.mp4';

const videoPaths: Record<string, string> = {
  // Manager videos
  'manager-overview': '', // Add: import from '../demo-video/manager/overview.webm'
  'manager-team-management': '',
  'manager-analytics': '',
  'manager-meetings': '',
  'manager-clients': '',
  'manager-users': '',
  'manager-history': '',
  'manager-icp': '',
  // SDR videos
  'sdr-dashboard': '',
  'sdr-goals': '',
  'sdr-meetings': '',
  'sdr-analytics': '',
  'sdr-commissions': '',
  'sdr-history': '',
  // Client videos
  'client-overview': '',
  'client-meetings': '',
  'client-calendar': '',
  'client-linkedin': '',
  'client-cold-calling': '',
  'client-analytics': '',
};

// Helper function to get video path
function getVideoPath(section: Section, subsection: string): string | null {
  const key = `${section}-${subsection}`;
  const path = videoPaths[key];
  return path || null;
}

// Image paths - add imports here as you create images
const imagePaths: Record<string, string> = {
  // Add image paths here as needed
  // Example: 'manager-overview-dashboard': imagePath
};

// Helper function to get image path
function getImagePath(section: Section, subsection: string, imageName: string): string | null {
  const key = `${section}-${subsection}-${imageName}`;
  const path = imagePaths[key];
  return path || null;
}

// Video Player Component
function VideoPlayer({ src, title }: { src: string; title: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Ensure src is a string (Vite imports return URLs as strings)
  const videoSrc = typeof src === 'string' ? src : String(src);
  
  // Log the video source for debugging
  useMemo(() => {
    console.log('VideoPlayer initialized:', { src: videoSrc, title });
  }, [videoSrc, title]);
  
  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    const error = video.error;
    console.error('Video playback error:', {
      src: videoSrc,
      error: error ? {
        code: error.code,
        message: error.message
      } : null,
      networkState: video.networkState,
      readyState: video.readyState
    });
    setHasError(true);
    setIsLoading(false);
  };
  
  const handleLoadedData = () => {
    setIsLoading(false);
    setHasError(false);
    console.log('Video loaded successfully:', videoSrc);
  };
  
  return (
    <div className="my-8 rounded-lg overflow-hidden shadow-lg border border-gray-200 bg-black p-0">
      <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
        {hasError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center p-4">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
              <p className="text-white text-sm font-medium">Unable to load video</p>
              <p className="text-gray-400 text-xs mt-1">{title}</p>
              <p className="text-gray-500 text-xs mt-2 break-all">Path: {videoSrc.substring(0, 100)}...</p>
            </div>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-white text-xs">Loading video...</p>
                </div>
              </div>
            )}
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              preload="auto"
              playsInline
              className="w-full h-full"
              style={{ display: 'block', objectFit: 'fill', margin: 0, padding: 0 }}
              onPlay={() => {
                setIsPlaying(true);
                setIsLoading(false);
              }}
              onPause={() => setIsPlaying(false)}
              onError={handleError}
              onLoadedData={handleLoadedData}
              onCanPlay={() => setIsLoading(false)}
            >
              <source src={videoSrc} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {!isPlaying && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
                <div className="text-center">
                  <Play className="w-16 h-16 text-white mx-auto mb-2 opacity-80" />
                  <p className="text-white text-sm font-medium">{title}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Image Display Component
function ImageDisplay({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <div className="my-8">
      <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200">
        <img src={src} alt={alt} className="w-full h-auto" />
      </div>
      {caption && (
        <p className="text-sm text-gray-500 mt-2 text-center italic">{caption}</p>
      )}
    </div>
  );
}

export default function Documentation() {
  const [activeSection, setActiveSection] = useState<Section>('manager');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['manager']));
  const [activeSubsection, setActiveSubsection] = useState<string>('overview');

  const toggleSection = (section: Section) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
    if (newExpanded.has(section)) {
      setActiveSection(section);
    }
  };

  const sidebarItems = {
    manager: [
      { id: 'overview', title: 'Overview', icon: BarChart2 },
      { id: 'team-management', title: 'Team Management', icon: Users },
      { id: 'analytics', title: 'Analytics & Reports', icon: TrendingUp },
      { id: 'meetings', title: 'Team\'s Meetings', icon: Calendar },
      { id: 'clients', title: 'Client Management', icon: Building },
      { id: 'users', title: 'User Management', icon: Settings },
      { id: 'history', title: 'Meeting History', icon: History },
      { id: 'icp', title: 'ICP Check', icon: Shield },
    ],
    sdr: [
      { id: 'dashboard', title: 'Dashboard Overview', icon: Calendar },
      { id: 'calendar', title: 'Calendar View', icon: Calendar },
      { id: 'history', title: 'Meeting History', icon: History },
      { id: 'commissions', title: 'Commissions', icon: DollarSign },
    ],
    client: [
      { id: 'overview', title: 'Overview', icon: BarChart2 },
      { id: 'meetings', title: 'Meetings', icon: Calendar },
      { id: 'calendar', title: 'Calendar View', icon: Clock },
      { id: 'linkedin', title: 'LinkedIn Integration', icon: Mail },
      { id: 'cold-calling', title: 'Cold Calling', icon: Phone },
      { id: 'analytics', title: 'Analytics', icon: TrendingUp },
    ],
  };

  const content = {
    manager: {
      overview: {
        title: 'Manager Dashboard Overview',
        description: 'Get complete visibility into your SDR team\'s performance, client assignments, and meeting activity.',
        sections: [
          {
            title: 'Centralized Command Center',
            content: 'The Manager Dashboard provides a comprehensive view of your entire SDR operation. Monitor team performance, track goals, manage client assignments, and oversee all meetings from a single, unified interface.',
            features: [
              'Real-time team performance metrics',
              'Individual SDR progress tracking',
              'Client assignment management',
              'Meeting oversight and coordination',
              'Customizable analytics and visualizations',
            ],
          },
          {
            title: 'Key Metrics at a Glance',
            content: 'Your dashboard displays critical KPIs including total meetings set, held meetings, pending confirmations, and no-show rates. Track progress against monthly targets with visual progress indicators.',
          },
          {
            title: 'Getting Started',
            content: 'Upon logging in, you\'ll see the Overview tab with team-wide metrics, individual SDR performance cards, and client assignment summaries. Use the navigation tabs to access specific features.',
          },
        ],
      },
      'team-management': {
        title: 'Team Management',
        description: 'Manage your SDR team, assign clients, set targets, and track individual performance.',
        sections: [
          {
            title: 'SDR Performance Tracking',
            content: 'Monitor each SDR\'s performance with detailed metrics including meetings set, held meetings, confirmation rates, and goal completion. View individual progress cards that show real-time status against monthly targets.',
          },
          {
            title: 'Client Assignment',
            content: 'Efficiently assign clients to SDRs and track assignment metrics. View which clients are assigned to which SDRs, monitor performance per assignment, and manage client relationships.',
          },
          {
            title: 'Goal Setting',
            content: 'Set monthly targets for each SDR including meetings set goals and meetings held goals. Track progress in real-time with visual progress bars and percentage completion indicators.',
          },
        ],
      },
      analytics: {
        title: 'Analytics & Reports',
        description: 'Comprehensive analytics and exportable reports for data-driven decision making.',
        sections: [
          {
            title: 'Performance Visualizations',
            content: 'Access customizable charts and graphs including cumulative performance trends, monthly performance comparisons, meeting status distributions, SDR performance breakdowns, and client progress visualizations.',
          },
          {
            title: 'Chart Visibility Controls',
            content: 'Toggle chart visibility from the dropdown menu to focus on specific metrics. Customize your dashboard view to highlight the data most relevant to your needs.',
          },
          {
            title: 'Data Export',
            content: 'Export meeting data, performance reports, and analytics to CSV format for further analysis or sharing with stakeholders. Access the export feature from the dropdown menu.',
          },
        ],
      },
      meetings: {
        title: 'Team\'s Meetings',
        description: 'Oversee all team meetings with calendar views, meeting lists, and status management.',
        sections: [
          {
            title: 'Calendar View',
            content: 'View all team meetings in multiple formats: month, week, day, or agenda view. Filter by SDR or client to focus on specific meetings. Navigate between dates easily with intuitive controls.',
          },
          {
            title: 'Meeting Lists',
            content: 'Organized meeting lists by status: Pending, Confirmed, Held, No-Show, and Past Due. Each list shows meeting details including date, time, SDR, client, and contact information.',
          },
          {
            title: 'Meeting Management',
            content: 'Update meeting statuses, confirm meetings, mark as held or no-show, and track meeting outcomes. All changes are reflected in real-time across the dashboard.',
          },
        ],
      },
      clients: {
        title: 'Client Management',
        description: 'Manage client relationships, assignments, and performance tracking.',
        sections: [
          {
            title: 'Client Overview',
            content: 'View all clients with their assigned SDRs, monthly targets, and current performance metrics. See at a glance which clients are active and which have been deactivated.',
          },
          {
            title: 'Client Assignment',
            content: 'Assign or reassign clients to SDRs. Track assignment history and monitor performance metrics for each client-SDR relationship.',
          },
          {
            title: 'Client Performance',
            content: 'Monitor client-specific metrics including meetings set, held, pending, and no-show rates. Track progress against monthly targets for each client.',
          },
        ],
      },
      users: {
        title: 'User Management',
        description: 'Manage team members, roles, and permissions.',
        sections: [
          {
            title: 'User Roles',
            content: 'Manage three types of users: Managers, SDRs, and Clients. Each role has specific permissions and access levels tailored to their responsibilities.',
          },
          {
            title: 'SDR Management',
            content: 'Add, edit, or deactivate SDR accounts. Assign clients, set targets, and manage individual SDR profiles and settings.',
          },
          {
            title: 'Manager Management',
            content: 'Manage manager accounts and permissions. Control access levels and administrative capabilities.',
          },
        ],
      },
      history: {
        title: 'Meeting History',
        description: 'Access historical meeting data and track trends over time.',
        sections: [
          {
            title: 'Historical View',
            content: 'Navigate to previous months to review past meetings, performance metrics, and outcomes. Track trends and patterns over time.',
          },
          {
            title: 'Meeting Records',
            content: 'View complete meeting history including dates, statuses, outcomes, and associated SDRs and clients. Filter and search through historical data.',
          },
          {
            title: 'Performance Trends',
            content: 'Analyze performance trends over time to identify patterns, improvements, or areas needing attention.',
          },
        ],
      },
      icp: {
        title: 'ICP Check',
        description: 'Verify Ideal Customer Profile qualifications for meetings and prospects.',
        sections: [
          {
            title: 'ICP Verification',
            content: 'Check whether meetings and prospects meet your Ideal Customer Profile criteria. Track ICP qualification status and notes.',
          },
          {
            title: 'ICP Criteria',
            content: 'Define and manage ICP criteria to ensure your team focuses on the right prospects and clients.',
          },
        ],
      },
    },
    sdr: {
      dashboard: {
        title: 'SDR Dashboard Overview',
        description: 'Your personal command center for managing meetings, tracking goals, and monitoring performance.',
        sections: [
          {
            title: 'Dashboard Tab',
            content: 'The Dashboard tab is your main workspace, providing a comprehensive view of your performance metrics, client assignments, and meeting activity. All data updates in real-time as you book and manage meetings.',
          },
          {
            title: 'Meeting Cards - Monthly Targets',
            content: 'At the top of your dashboard, you\'ll see key metric cards displaying your monthly set target and monthly held target. These targets are assigned by your manager and update monthly based on your client assignments. Click on either card to see a detailed breakdown by client, showing how your targets are distributed across all your assigned clients.',
            videoPath: sdrDashboard1,
          },
          {
            title: 'Meeting Cards - Actual Performance',
            content: 'The "Meetings Set" and "Meetings Held" cards show your actual performance for the current month. These reflect the real meetings you\'ve booked and completed. Click on either card to view all meetings in that category with detailed information. The cards also display your progress percentage toward your monthly targets, giving you instant visibility into whether you\'re on track.',
            features: [
              'Filter: Narrow down meetings by client name to focus on specific accounts',
              'Sort By: Organize meetings by date, client name, or contact name for easier navigation',
              'Order: Choose ascending (oldest first) or descending (newest first) order',
              'Group By: Group meetings by client to see all meetings for each account together, or leave ungrouped for a chronological view',
            ],
          },
          {
            title: 'Pending and No-Show Meetings',
            content: 'The "Pending" card shows all meetings scheduled for this month that are awaiting confirmation. The "No Shows" card displays meetings where the prospect didn\'t attend. Both cards are clickable to view detailed meeting lists with the same filtering, sorting, and grouping options available.',
            videoPath: sdrDashboard2,
          },
          {
            title: 'Client Cards',
            content: 'Each client assignment appears as a dedicated card on your dashboard. Each card displays the client name, actual set / target set ratio, actual held / target held ratio for the current month, number of pending meetings, and a visual progress indicator. You can click to toggle between viewing "Set" and "Held" progress.',
          },
          {
            title: 'Client Card Details',
            content: 'Clicking on any client card opens a detailed view showing all meetings for that specific client, organized into three sections: Meetings Set, Meetings Held, and Pending. You can preview the meeting info by clicking on a meeting, and expand it to see full details including contact information, notes, and status.',
            videoPath: sdrDashboard3,
          },
          {
            title: 'Add Meeting Button',
            content: 'The "Add Meeting" button allows you to book new meetings directly from your dashboard. When clicked, it opens a form with the following fields:',
            features: [
              'Meeting Booked Date: Automatically defaults to the current day (optional)',
              'Meeting Date: The scheduled date for the meeting (required)',
              'Meeting Time: The scheduled time (required)',
              'Contact Full Name: The prospect\'s full name (required)',
              'Contact Email: Email address (optional)',
              'Contact Phone: Phone number (optional)',
              'Title: The prospect\'s job title (optional)',
              'Company: Company name (optional)',
              'LinkedIn Page: LinkedIn profile URL (optional)',
              'Prospect\'s Timezone: Select from EST (Eastern), CST (Central), MST (Mountain), PST (Pacific), MST (Arizona), AKST (Alaska), or HST (Hawaii) (required)',
              'Notes: Additional information about the meeting or prospect (optional)',
            ],
            videoPath: sdrDashboard4,
          },
          {
            title: 'Batch Import Meetings',
            content: 'In addition to adding meetings one at a time, you can import multiple meetings at once using the batch import feature. Import meetings from a spreadsheet (CSV format) to quickly add multiple meetings. This is especially useful when you have a list of meetings to book from a spreadsheet or exported data.',
            videoPath: importMeetings,
          },
          {
            title: 'Meeting Cards Section',
            content: 'Below the metric cards, you\'ll find organized meeting lists grouped by status. When you book a new meeting, it automatically appears in the "Pending" section. The dashboard organizes meetings into the following sections:',
            features: [
              'Pending: Meetings awaiting confirmation from the prospect',
              'Confirmed: Meetings that have been confirmed by the prospect',
              'Past Due Pending: When the meeting date and time has passed, it automatically moves into this section, awaiting for the SDR to confirm it was held, or it was a no show',
              'Held: Meetings that have been successfully completed',
              'No Shows: Meetings where the prospect didn\'t attend',
              'No Longer Interested: This is when a prospect tells you to stop contacting, but no show meetings can still be rescheduled',
              'Not ICP Qualified: When the meeting is booked, but doesn\'t match the client prospect criteria (company size, industry, etc.)',
            ],
            additionalContent: 'Pending meetings that have meeting time within 24 hours will need a confirmation, and will be flashing yellow. To change meeting status, click pencil button, select the correct meeting status dropdown, then click save. To delete a meeting, click the trash can button. Another option to change status is to drag and drop from the meeting card preview.',
            videoPath: sdrDashboard5,
          },
          {
            title: 'Performance Visualizations',
            content: 'The dashboard includes three interactive charts that help you visualize your performance. You can toggle each chart on or off using the dropdown menu in the name card at the top:',
            features: [
              'Monthly Performance: Shows your progress toward monthly goals over time',
              'Meeting Status Distribution: A pie chart showing the breakdown of your meetings by status',
              'Client Performance: Compares your performance across different client assignments',
            ],
            videoPath: sdrDashboard6,
          },
        ],
      },
      calendar: {
        title: 'Calendar View',
        description: 'View and manage all your meetings in a visual calendar format with multiple view options.',
        sections: [
          {
            title: 'Calendar Views',
            content: 'The Calendar tab provides four different ways to view your meetings: Month, Week, Day, and Agenda views. Each view offers a different perspective on your meeting schedule, allowing you to see your meetings in the format that works best for your workflow.',
            videoPath: sdrCalendar1,
            features: [
              'Month View: See all meetings for the entire month in a traditional calendar grid',
              'Week View: Focus on a single week with detailed time slots',
              'Day View: View a single day with hourly breakdown',
              'Agenda View: List view showing all meetings in chronological order',
            ],
          },
          {
            title: 'Color-Coded Meetings',
            content: 'Meeting cards are color-coded by status to help you quickly identify meeting types at a glance. This visual coding makes it easy to see which meetings are pending, confirmed, held, or no-shows without having to read the details.',
            features: [
              'Pending: Yellow/orange color',
              'Confirmed: Blue color',
              'Held: Green color',
              'No Show: Red color',
            ],
          },
          {
            title: 'Meeting Preview and Details',
            content: 'In any calendar view, you can click on a meeting to see expanded meeting information. The preview shows key details, and you can expand it further to view complete meeting information including contact details, company, LinkedIn profile, notes, and timezone.',
          },
        ],
      },
      commissions: {
        title: 'Commissions',
        description: 'Track your commission earnings and calculate potential compensation based on your performance.',
        sections: [
          {
            title: 'Commission Types',
            content: 'Your manager sets how your commission is calculated. The system supports two commission types. This documentation covers the Per Meeting commission type, which is demonstrated in the video.',
            videoPath: sdrCommissions1,
            features: [
              'Per Meeting: You receive a base amount per meeting booked, and an additional amount per meeting held. When you exceed your monthly held goal, meetings beyond the goal earn the full rate (base + additional)',
              'Goal Based: You earn bonuses based on achieving specific percentage milestones of your monthly held goal (e.g., 100%, 110%, 120% of goal)',
            ],
          },
          {
            title: 'Per Meeting Commission Overview',
            content: 'For per-meeting commissions, you can see your held goal for the current month, your current progress toward that goal, and your current commission based on meetings held. The display shows both the goal and your actual progress, making it easy to understand how close you are to your commission targets.',
          },
          {
            title: 'Commission Calculator',
            content: 'Use the commission calculator to see how much commission you would earn based on a hypothetical number of meetings. Enter any number of meetings to calculate the projected commission at that level. This helps you plan and understand the financial impact of your performance, allowing you to set personal goals and track your progress.',
          },
          {
            title: 'Commission History',
            content: 'Click "Show History" to view your commission earnings for the past 12 months. Each month shows your held goal, actual held meetings, goal progress percentage, and commission earned. This historical view helps you track trends, identify your best performing months, and understand your commission patterns over time.',
          },
        ],
      },
      history: {
        title: 'Meeting History',
        description: 'Review your all-time performance and historical meeting data with advanced filtering options.',
        sections: [
          {
            title: 'All-Time Performance Statistics',
            content: 'At the top of the Meeting History page, you\'ll see comprehensive all-time statistics that give you an overview of your overall performance:',
            features: [
              'Total Meetings Booked: All meetings you\'ve ever created',
              'Total Meetings Held: All meetings that have been successfully completed',
              'Total No Shows: All meetings where the prospect didn\'t attend',
              'Total Pending: Currently pending meetings across all time',
              'Held Rate: Percentage of booked meetings that resulted in held meetings (Held / (Held + No Shows))',
              'No Show Rate: Percentage of booked meetings that resulted in no-shows (No Shows / (Held + No Shows))',
            ],
          },
          {
            title: 'Monthly Performance Breakdown',
            content: 'Below the all-time stats, you can view performance broken down by month. Use the month dropdown selector to view historical data for any past month. The page displays monthly targets, actual performance, and progress percentages for the selected month, giving you detailed insights into your performance trends over time.',
            videoPath: sdrMeetingHistory1,
          },
          {
            title: 'Status Filtering',
            content: 'Filter meetings by status to focus on specific types. This helps you analyze different aspects of your meeting performance:',
            features: [
              'All: Shows all meetings for the selected month',
              'Booked: Shows all meetings that were booked in the selected month (regardless of current status)',
              'Held: Shows only meetings that were held in the selected month',
              'No-Show: Shows only no-show meetings',
              'Pending: Shows only pending meetings',
            ],
          },
          {
            title: 'Advanced Filtering and Organization',
            content: 'The Meeting History page includes powerful filtering, sorting, and grouping functions to help you find and analyze specific meetings:',
            features: [
              'Filter: Narrow down by client name to focus on specific accounts',
              'Sort By: Organize by date, client, or contact name for easier navigation',
              'Order: Choose ascending (oldest first) or descending (newest first) order',
              'Group By: Group by client to see all meetings for each account together, or view ungrouped for a chronological view',
            ],
          },
          {
            title: 'Export Functionality',
            content: 'Export your meeting history to CSV format for further analysis or reporting. You can select which columns to include in the export (client, contact, email, phone, date, status, notes) and download the data for use in spreadsheets or other tools.',
          },
        ],
      },
    },
    client: {
      overview: {
        title: 'Client Dashboard Overview',
        description: 'Access your dedicated SDR dashboard and manage meetings seamlessly.',
        sections: [
          {
            title: 'Secure Access',
            content: 'Access your personalized dashboard through a secure, token-based link. No login required - simply click the link provided by your SDR team.',
            features: [
              'Secure token-based access',
              'No account creation needed',
              'Direct SDR communication',
              'Meeting scheduling and management',
              'Real-time status updates',
            ],
          },
          {
            title: 'Your Dedicated SDR',
            content: 'See your assigned SDR\'s information including name, email, and contact details. Communicate directly and coordinate meetings easily.',
          },
          {
            title: 'Meeting Overview',
            content: 'View all your scheduled meetings, upcoming appointments, and meeting history in one convenient location.',
          },
        ],
      },
      meetings: {
        title: 'Meetings',
        description: 'Schedule and manage meetings with your SDR team.',
        sections: [
          {
            title: 'Meeting Scheduling',
            content: 'Schedule meetings directly through the dashboard. Select dates, times, and provide contact information. The system handles timezone conversions automatically.',
          },
          {
            title: 'Meeting Status',
            content: 'Track meeting status in real-time. See which meetings are pending, confirmed, or have been held. Receive updates automatically as status changes.',
          },
          {
            title: 'Meeting Details',
            content: 'View complete meeting information including date, time, SDR contact details, and any notes or special instructions.',
          },
        ],
      },
      calendar: {
        title: 'Calendar View',
        description: 'Visual calendar interface for viewing and managing meetings.',
        sections: [
          {
            title: 'Multiple View Options',
            content: 'Switch between month, week, day, and agenda views to see your meetings in the format that works best for you.',
          },
          {
            title: 'Interactive Calendar',
            content: 'Click on dates to view meetings, navigate between months, and see your meeting schedule at a glance.',
          },
        ],
      },
      linkedin: {
        title: 'LinkedIn Integration',
        description: 'Manage LinkedIn accounts and outreach campaigns.',
        sections: [
          {
            title: 'LinkedIn Account Management',
            content: 'Connect and manage LinkedIn accounts used for outreach. Track LinkedIn-based campaigns and performance.',
          },
          {
            title: 'Outreach Campaigns',
            content: 'Monitor LinkedIn outreach campaigns, connection requests, and engagement metrics.',
          },
        ],
      },
      'cold-calling': {
        title: 'Cold Calling',
        description: 'View SDR assignment, progress tracking, and manage cold calling talk tracks.',
        sections: [
          {
            title: 'SDR Assignment',
            content: 'See which SDR is assigned to your account and their contact information for cold calling coordination.',
          },
          {
            title: 'Progress Tracking',
            content: 'Track progress on cold calling campaigns and outreach efforts.',
          },
          {
            title: 'Talk Tracks',
            content: 'Access and manage cold calling talk tracks and scripts.',
          },
        ],
      },
      analytics: {
        title: 'Analytics',
        description: 'View performance metrics and meeting statistics.',
        sections: [
          {
            title: 'Meeting Statistics',
            content: 'View statistics about your meetings including total scheduled, held, and no-show rates.',
          },
          {
            title: 'Performance Metrics',
            content: 'Track performance metrics related to your meetings and engagement with the SDR team.',
          },
        ],
      },
    },
  };

  const getCurrentContent = () => {
    const sectionContent = content[activeSection];
    if (!sectionContent) return null;
    return sectionContent[activeSubsection as keyof typeof sectionContent];
  };

  const currentContent = getCurrentContent();
  
  // Get video path for current subsection - check content object first, then videoPaths
  const videoPath = useMemo(() => {
    if (currentContent && 'videoPath' in currentContent && (currentContent as any).videoPath) {
      return (currentContent as any).videoPath as string;
    }
    return getVideoPath(activeSection, activeSubsection);
  }, [activeSection, activeSubsection, currentContent]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Home</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-2">
                <Book className="w-6 h-6 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-900">Documentation</h1>
              </div>
            </div>
            <Link
              to="/login"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-24">
              <div className="space-y-2">
                {/* Manager Section */}
                <div>
                  <button
                    onClick={() => toggleSection('manager')}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                      <span>Manager</span>
                    </div>
                    {expandedSections.has('manager') ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {expandedSections.has('manager') && (
                    <div className="ml-6 mt-1 space-y-1">
                      {sidebarItems.manager.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveSection('manager');
                            setActiveSubsection(item.id);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                            activeSection === 'manager' && activeSubsection === item.id
                              ? 'bg-indigo-50 text-indigo-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* SDR Section */}
                <div>
                  <button
                    onClick={() => toggleSection('sdr')}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span>SDR</span>
                    </div>
                    {expandedSections.has('sdr') ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {expandedSections.has('sdr') && (
                    <div className="ml-6 mt-1 space-y-1">
                      {sidebarItems.sdr.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveSection('sdr');
                            setActiveSubsection(item.id);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                            activeSection === 'sdr' && activeSubsection === item.id
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Client Section */}
                <div>
                  <button
                    onClick={() => toggleSection('client')}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-purple-600" />
                      <span>Client</span>
                    </div>
                    {expandedSections.has('client') ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {expandedSections.has('client') && (
                    <div className="ml-6 mt-1 space-y-1">
                      {sidebarItems.client.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveSection('client');
                            setActiveSubsection(item.id);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                            activeSection === 'client' && activeSubsection === item.id
                              ? 'bg-purple-50 text-purple-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {currentContent ? (
              <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="mb-8">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">{(currentContent as any).title}</h1>
                  <p className="text-xl text-gray-600">{(currentContent as any).description}</p>
                </div>

                {/* Video Section - Show if video exists */}
                {videoPath && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Play className="w-5 h-5 text-blue-600" />
                      <h2 className="text-2xl font-semibold text-gray-900">Video Demo</h2>
                    </div>
                    <VideoPlayer src={videoPath} title={(currentContent as any).title} />
                  </div>
                )}

                <div className="prose prose-lg max-w-none">
                  {(currentContent as any).sections.map((section: any, index: number) => (
                    <div key={index} className="mb-8">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-4">{section.title}</h2>
                      <p className="text-gray-700 mb-4 leading-relaxed">{section.content}</p>
                      {section.features && (
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                          {section.features.map((feature: string, idx: number) => (
                            <li key={idx}>{feature}</li>
                          ))}
                        </ul>
                      )}
                      {/* Support for video in sections */}
                      {section.videoPath && (
                        <div className="my-6">
                          <VideoPlayer src={typeof section.videoPath === 'string' ? section.videoPath : section.videoPath} title={section.title} />
                        </div>
                      )}
                      {/* Support for additionalContent in sections */}
                      {section.additionalContent && (
                        <p className="text-gray-700 mb-4 leading-relaxed mt-4">{section.additionalContent}</p>
                      )}
                      {/* Support for images in sections */}
                      {section.images && section.images.map((img: any, imgIdx: number) => {
                        const imgPath = getImagePath(activeSection, activeSubsection, img.name);
                        return imgPath ? (
                          <ImageDisplay
                            key={imgIdx}
                            src={imgPath}
                            alt={img.alt || section.title}
                            caption={img.caption}
                          />
                        ) : null;
                      })}
                    </div>
                  ))}
                </div>
              </article>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <p className="text-gray-500">Select a section from the sidebar to view documentation.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

