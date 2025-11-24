import { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Book, 
  Users, 
  User, 
  Briefcase,
  BarChart2,
  Calendar,
  Target,
  Settings,
  Mail,
  Clock,
  CheckCircle,
  TrendingUp,
  Shield,
  History,
  Building,
  ArrowLeft,
  Phone,
  Play
} from 'lucide-react';
import { Link } from 'react-router-dom';

type Section = 'manager' | 'sdr' | 'client';

// Video paths - add imports here as you create videos
// Example: import managerOverviewVideo from '../demo-video/manager/overview.webm';
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
  
  return (
    <div className="my-8 rounded-lg overflow-hidden shadow-lg border border-gray-200 bg-black">
      <div className="relative" style={{ aspectRatio: '16/9' }}>
        <video
          src={src}
          controls
          className="w-full h-full object-contain"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center">
              <Play className="w-16 h-16 text-white mx-auto mb-2 opacity-80" />
              <p className="text-white text-sm font-medium">{title}</p>
            </div>
          </div>
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
      { id: 'dashboard', title: 'Dashboard Overview', icon: BarChart2 },
      { id: 'goals', title: 'Goal Tracking', icon: Target },
      { id: 'meetings', title: 'Meeting Management', icon: Calendar },
      { id: 'calendar', title: 'Calendar View', icon: Clock },
      { id: 'analytics', title: 'Performance Analytics', icon: TrendingUp },
      { id: 'commissions', title: 'Commissions', icon: CheckCircle },
      { id: 'history', title: 'Meeting History', icon: History },
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
        videoPath: 'sdr-dashboard-1.webm',
        sections: [
          {
            title: 'Dashboard Tab - Overview',
            content: 'The Dashboard tab is your main workspace, providing a comprehensive view of your performance metrics, client assignments, and meeting activity. All data updates in real-time as you book and manage meetings.',
          },
          {
            title: 'Meeting Cards - Monthly Targets',
            content: 'At the top of your dashboard, you\'ll see key metric cards displaying your monthly set target and monthly held target. These targets are assigned by your manager and update monthly based on your client assignments. Click on either card to see a detailed breakdown by client, showing how your targets are distributed across all your assigned clients.',
            videoPath: 'sdr-dashboard-1.webm',
          },
          {
            title: 'Meeting Cards - Actual Performance',
            content: 'The "Meetings Set" and "Meetings Held" cards show your actual performance for the current month. These reflect the real meetings you\'ve booked and completed. Click on either card to view all meetings in that category with detailed information. The cards also display your progress percentage toward your monthly targets, giving you instant visibility into whether you\'re on track.',
            videoPath: 'sdr-dashboard-2.webm',
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
            videoPath: 'sdr-dashboard-3.webm',
          },
          {
            title: 'Client Cards',
            content: 'Each client assignment appears as a dedicated card on your dashboard. Each card displays:',
            features: [
              'Client name',
              'Actual set / Target set ratio (e.g., "15 / 18")',
              'Actual held / Target held ratio (e.g., "12 / 15")',
              'Number of pending meetings',
              'Visual progress indicator that you can toggle between "Set" and "Held" progress',
            ],
          },
          {
            title: 'Client Card Details',
            content: 'Clicking on any client card opens a detailed view showing all meetings for that specific client, organized into three sections:',
            features: [
              'Meetings Set: All meetings you\'ve booked for this client this month',
              'Meetings Held: All meetings that have been completed for this client',
              'Pending Meetings: Meetings awaiting confirmation or completion',
            ],
            videoPath: 'sdr-dashboard-4.webm',
            additionalContent: 'Each meeting in these sections can be previewed by clicking on it, and you can expand the meeting card to see full details including contact information, notes, and status.',
          },
          {
            title: 'Add Meeting Button',
            content: 'The "Add Meeting" button allows you to book new meetings directly from your dashboard. When clicked, it opens a form with the following fields:',
            features: [
              'Meeting Booked Date: Automatically defaults to today\'s date (optional)',
              'Meeting Date: The scheduled date for the meeting (required)',
              'Meeting Time: The scheduled time (required)',
              'Contact Full Name: The prospect\'s full name (required)',
              'Contact Email: Email address (optional)',
              'Contact Phone: Phone number (optional)',
              'Title: The prospect\'s job title (optional)',
              'Company: Company name (optional)',
              'LinkedIn Page: LinkedIn profile URL (optional)',
              'Prospect\'s Timezone: Select from EST, CST, MST, PST, MST (Arizona), AKST, or HST (required)',
              'Notes: Additional information about the meeting or prospect (optional)',
            ],
            videoPath: 'sdr-dashboard-5.webm',
          },
          {
            title: 'Meeting Cards Section',
            content: 'Below the metric cards, you\'ll find organized meeting lists grouped by status. When you book a new meeting, it automatically appears in the "Pending" section. The dashboard organizes meetings into the following sections:',
            features: [
              'Pending: Meetings awaiting confirmation from the prospect',
              'Confirmed: Meetings that have been confirmed by the prospect',
              'Past Due Pending: Meetings where the scheduled date and time have passed but haven\'t been marked as held or no-show yet. These require your action to update the status',
              'Held: Meetings that have been successfully completed',
              'No Shows: Meetings where the prospect didn\'t attend',
              'No Longer Interested: Meetings where the prospect has requested to stop contact, but no-show meetings can still be rescheduled',
              'Not ICP Qualified: Meetings that were booked but don\'t match the client\'s Ideal Customer Profile criteria (company size, industry, etc.)',
            ],
            videoPath: 'sdr-dashboard-6.webm',
            additionalContent: 'Pending meetings with a scheduled time within 24 hours will flash yellow, alerting you that confirmation is needed. To change a meeting\'s status, click the pencil (edit) button on the meeting card, select the correct status from the dropdown, and click save. You can also delete meetings using the trash can button. Alternatively, you can drag and drop meeting cards between sections to quickly update their status.',
          },
          {
            title: 'Performance Visualizations',
            content: 'The dashboard includes three interactive charts that help you visualize your performance:',
            features: [
              'Monthly Performance: Shows your progress toward monthly goals over time',
              'Meeting Status Distribution: A pie chart showing the breakdown of your meetings by status',
              'Client Performance: Compares your performance across different client assignments',
            ],
            videoPath: 'sdr-dashboard-7.webm',
            additionalContent: 'You can toggle the visibility of each chart on or off using the dropdown menu in the top-right corner of the name card. This allows you to customize your dashboard view to focus on the metrics most important to you.',
          },
        ],
      },
      goals: {
        title: 'Goal Tracking',
        description: 'Monitor your monthly targets and track progress across all client assignments.',
        sections: [
          {
            title: 'Monthly Targets',
            content: 'Your monthly targets for meetings set and meetings held are assigned by your manager and are based on your client assignments. These targets update monthly and are visible on both the metric cards at the top of your dashboard and within each client card.',
          },
          {
            title: 'Progress Tracking',
            content: 'Each client card displays your progress with visual progress bars and percentage indicators. You can toggle between viewing "Set" progress and "Held" progress to see which metric needs more attention. The overall progress is also shown on the main metric cards.',
          },
          {
            title: 'Client-Specific Goals',
            content: 'Click on any metric card (Monthly Set Target, Monthly Held Target, Meetings Set, or Meetings Held) to see a detailed breakdown by client. This view shows how your targets are distributed and your actual performance for each client assignment.',
          },
        ],
      },
      meetings: {
        title: 'Meeting Management',
        description: 'Schedule, manage, and track all your meetings with comprehensive filtering and organization tools.',
        sections: [
          {
            title: 'Scheduling Meetings',
            content: 'Use the "Add Meeting" button to book new meetings. The form captures all necessary information including contact details, meeting time, timezone, and optional fields like LinkedIn profile and notes. Once saved, the meeting automatically appears in the appropriate section based on its status.',
          },
          {
            title: 'Meeting Status Workflow',
            content: 'Meetings progress through different statuses: Pending → Confirmed → Held. You can also mark meetings as No-Show or No Longer Interested. Past Due Pending meetings are those where the scheduled time has passed but haven\'t been updated yet. All status changes are timestamped for accurate tracking.',
          },
          {
            title: 'Meeting Organization',
            content: 'The dashboard organizes meetings into clear sections: Pending, Confirmed, Past Due Pending, Held, No Shows, No Longer Interested, and Not ICP Qualified. Each section can be expanded or collapsed, and you can use the search bar to quickly find specific meetings.',
          },
          {
            title: 'Filtering and Sorting',
            content: 'When viewing meeting lists (by clicking on metric cards or client cards), you have powerful filtering and sorting options:',
            features: [
              'Filter by client to focus on specific accounts',
              'Sort by date, client, or contact name',
              'Choose ascending or descending order',
              'Group by client to see all meetings for each account together',
            ],
          },
          {
            title: 'Editing and Updating Meetings',
            content: 'Click the pencil icon on any meeting card to edit its details. You can update the status, modify contact information, add notes, or change the scheduled date and time. Changes are saved immediately and reflected across the dashboard.',
          },
          {
            title: 'Drag and Drop',
            content: 'You can quickly update meeting status by dragging meeting cards between sections. For example, drag a meeting from "Pending" to "Held" to mark it as completed. This provides a fast, visual way to manage your meetings.',
          },
        ],
      },
      calendar: {
        title: 'Calendar View',
        description: 'View and manage all your meetings in a visual calendar format with multiple view options.',
        videoPath: 'sdr-dashboard-8.webm',
        sections: [
          {
            title: 'Calendar Views',
            content: 'The Calendar tab provides four different ways to view your meetings:',
            features: [
              'Month View: See all meetings for the entire month in a traditional calendar grid',
              'Week View: Focus on a single week with detailed time slots',
              'Day View: View a single day with hourly breakdown',
              'Agenda View: List view showing all meetings in chronological order',
            ],
          },
          {
            title: 'Color-Coded Meetings',
            content: 'Meeting cards are color-coded by status to help you quickly identify meeting types:',
            features: [
              'Pending: Yellow/orange color',
              'Confirmed: Blue color',
              'Held: Green color',
              'No Show: Red color',
            ],
          },
          {
            title: 'Meeting Preview and Details',
            content: 'In calendar view, meeting cards show the prospect\'s name by default. Click on any meeting to see a preview with key information. You can expand the preview to view full meeting details including contact information, company, LinkedIn profile, notes, and timezone.',
          },
          {
            title: 'Navigation',
            content: 'Use the navigation controls to move between months, weeks, or days. The calendar automatically scrolls to show meetings near the current time in week and day views.',
          },
        ],
      },
      analytics: {
        title: 'Performance Analytics',
        description: 'Visualize your performance with interactive charts and metrics that update in real-time.',
        sections: [
          {
            title: 'Chart Types',
            content: 'The dashboard includes three customizable charts:',
            features: [
              'Monthly Performance: Line chart showing your progress toward monthly goals over time',
              'Meeting Status Distribution: Pie chart displaying the breakdown of your meetings by status (Pending, Confirmed, Held, No-Show, etc.)',
              'Client Performance: Bar chart comparing your performance metrics across different client assignments',
            ],
          },
          {
            title: 'Chart Visibility Controls',
            content: 'Use the dropdown menu in the top-right corner of your dashboard to toggle each chart on or off. This allows you to customize your view and focus on the metrics most relevant to your workflow.',
          },
          {
            title: 'Real-Time Updates',
            content: 'All charts update automatically as you book meetings, update statuses, and complete meetings. This gives you instant visual feedback on your performance trends.',
          },
        ],
      },
      commissions: {
        title: 'Commissions',
        description: 'Track your commission earnings and calculate potential compensation based on your performance.',
        videoPath: 'sdr-dashboard-10.webm',
        sections: [
          {
            title: 'Commission Structure',
            content: 'Your manager sets how your commission is calculated. The system supports two commission types:',
            features: [
              'Per Meeting: You receive a base amount per meeting booked, and an additional amount per meeting held. When you exceed your monthly held goal, meetings beyond the goal earn the full rate (base + additional)',
              'Goal Based: You earn bonuses based on achieving specific percentage milestones of your monthly held goal (e.g., 100%, 110%, 120% of goal)',
            ],
          },
          {
            title: 'Current Commission Display',
            content: 'The Commissions tab shows your current month\'s commission based on held meetings, your monthly held goal, and your progress percentage. If your manager has set a commission goal override, it will be displayed with a badge indicating it differs from your calculated goal.',
          },
          {
            title: 'Commission Calculator',
            content: 'Use the commission calculator to project your earnings. Enter a number of meetings to see how much commission you would earn at that level. This helps you plan and understand the financial impact of your performance.',
          },
          {
            title: 'Commission History',
            content: 'Click "Show History" to view your commission earnings for the past 12 months. Each month shows your held goal, actual held meetings, goal progress percentage, and commission earned. This historical view helps you track trends and identify your best performing months.',
          },
        ],
      },
      history: {
        title: 'Meeting History',
        description: 'Review your all-time performance and historical meeting data with advanced filtering options.',
        videoPath: 'sdr-dashboard-9.webm',
        sections: [
          {
            title: 'All-Time Performance Metrics',
            content: 'At the top of the Meeting History page, you\'ll see comprehensive statistics:',
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
            title: 'Monthly Performance View',
            content: 'Use the month dropdown selector to view historical data for any past month. The page displays monthly targets, actual performance, and progress percentages for the selected month. You can also export the meeting data for that month to CSV.',
          },
          {
            title: 'Status Filtering',
            content: 'Filter meetings by status to focus on specific types:',
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
            content: 'The Meeting History page includes the same powerful filtering, sorting, and grouping options as the dashboard:',
            features: [
              'Filter: Narrow down by client name',
              'Sort By: Organize by date, client, or contact name',
              'Order: Ascending or descending',
              'Group By: Group by client or view ungrouped',
            ],
          },
          {
            title: 'Export Functionality',
            content: 'Export your meeting history to CSV format. You can select which columns to include in the export (client, contact, email, phone, date, status, notes) and download the data for analysis or reporting purposes.',
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
    if (currentContent && 'videoPath' in currentContent && currentContent.videoPath) {
      return currentContent.videoPath as string;
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
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">{currentContent.title}</h1>
                  <p className="text-xl text-gray-600">{currentContent.description}</p>
                </div>

                {/* Video Section - Show if video exists */}
                {videoPath && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Play className="w-5 h-5 text-blue-600" />
                      <h2 className="text-2xl font-semibold text-gray-900">Video Demo</h2>
                    </div>
                    <VideoPlayer src={videoPath} title={currentContent.title} />
                  </div>
                )}

                <div className="prose prose-lg max-w-none">
                  {currentContent.sections.map((section: any, index: number) => (
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
                          <VideoPlayer src={section.videoPath} title={section.title} />
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

