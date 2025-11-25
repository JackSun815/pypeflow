import { useState, useMemo, useRef } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Book, 
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
// Manager Dashboard videos
import managerOverview1 from '../demo-video/manager/manager-overview-1.mp4';
import managerOverview2 from '../demo-video/manager/manager-overview-2.mp4';
import managerOverview3 from '../demo-video/manager/manager-overview-3.mp4';
import managerOverview4 from '../demo-video/manager/manager-overview-4.mp4';
import managerOverview5 from '../demo-video/manager/manager-overview-5.mp4';
import managerTeamsMeetings1 from '../demo-video/manager/manager-teamsmeetings-1.mp4';
import managerTeamsMeetings2 from '../demo-video/manager/manager-teamsmeetings-2.mp4';
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
      <div className="relative w-full flex items-center justify-center">
        {hasError ? (
          <div className="w-full py-16 flex items-center justify-center bg-black/80">
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
              className="w-full max-w-full h-auto"
              style={{ display: 'block', margin: 0, padding: 0 }}
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
  const [activeH1, setActiveH1] = useState<string | null>(null);

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
        h1Sections: [
          {
            id: 'key-metrics',
            title: 'Key Metrics',
            sections: [
              {
                title: 'Overview Cards',
                content: 'At the top of the Overview tab, you\'ll see six key metric cards that provide a comprehensive view of your team\'s performance. Each card is clickable and expands to show detailed information. The first row displays three cards:',
                features: [
                  'Active SDRs: Shows the total number of active SDRs on your team. Click to view a detailed list of all SDRs with their status and basic information.',
                  'Monthly Set Target: Displays the total monthly target for meetings set across all SDRs and clients. Shows the percentage of the month completed. Click to see a breakdown by client and SDR.',
                  'Monthly Held Target: Shows the total monthly target for meetings held. Also displays month progress percentage. Click to view detailed held meeting targets by client and SDR.',
                ],
                videoPath: managerOverview1,
              },
              {
                title: 'Meetings Performance Cards',
                content: 'The second row of cards shows your actual meeting performance metrics:',
                features: [
                  'Meetings Set: Displays the total number of meetings set this month, the percentage of target achieved, and cumulative all-time meetings set. Click to view all meetings set with filtering, sorting, and grouping options.',
                  'Meetings Held: Shows meetings held this month, percentage of held target, and cumulative held meetings. Click to see detailed held meetings with full filtering capabilities.',
                  'Pending: Displays the number of meetings awaiting confirmation, with cumulative pending count. Click to view all pending meetings with detailed information.',
                ],
                additionalContent: 'All metric cards support filtering by client, sorting by date/client/contact, ordering (ascending/descending), and grouping by client or SDR. You can also search for specific meetings within each modal.',
              },
            ],
          },
          {
            id: 'sdr-performance',
            title: 'SDR Performance',
            sections: [
              {
                title: 'SDR Performance Table',
                content: 'The SDR Performance section displays a comprehensive table showing each SDR\'s performance metrics for the selected month. Use the month dropdown to view performance for any past or current month. Each row shows:',
                features: [
                  'SDR Name: The full name of the SDR',
                  'Meetings Set: Actual meetings set vs the monthly set target, with progress percentage',
                  'Meetings Held: Actual meetings held vs the monthly held target, with progress percentage',
                  'Pending: Number of meetings currently pending confirmation',
                  'Progress Indicators: Visual progress bars showing completion status',
                ],
                videoPath: managerOverview2,
              },
              {
                title: 'Expanding SDR Details',
                content: 'Click on any SDR row to expand and view detailed client assignments. The expanded view shows:',
                features: [
                  'Client Assignments: All clients assigned to that SDR for the selected month',
                  'Per-Client Performance: Individual metrics for each client assignment including set/held targets and actual performance',
                  'Meeting Details: Click on any assignment to see specific meetings for that SDR-client combination',
                  'Progress Numbers: Real-time progress indicators showing how close each SDR is to their targets',
                ],
                additionalContent: 'The table supports filtering and sorting to help you quickly identify top performers or SDRs who may need additional support.',
              },
              {
                title: 'Export Functionality',
                content: 'Export SDR performance data to CSV format for reporting or further analysis. The export includes all SDR metrics, client assignments, and performance breakdowns for the selected month.',
              },
            ],
          },
          {
            id: 'clients-performance',
            title: 'Clients Performance',
            sections: [
              {
                title: 'Clients Performance Table',
                content: 'The Clients Performance section provides a detailed view of how each client is performing. Similar to the SDR Performance table, this section shows:',
                features: [
                  'Client Name: The name of each client',
                  'Assigned SDR: Which SDR is responsible for that client',
                  'Monthly Set Target: The target number of meetings to set for that client',
                  'Actual Set: How many meetings have actually been set',
                  'Monthly Held Target: The target number of meetings to hold',
                  'Actual Held: How many meetings have actually been held',
                  'Progress Indicators: Visual bars showing progress toward targets',
                ],
                videoPath: managerOverview3,
              },
              {
                title: 'Client Assignment Details',
                content: 'Click on any client row to expand and see detailed assignment information, including all SDRs assigned to that client and their individual performance metrics. This helps you track which clients are meeting their goals and identify any that may need attention.',
              },
            ],
          },
          {
            id: 'todays-activity',
            title: 'Today\'s Activity',
            sections: [
              {
                title: 'Meetings Booked Today',
                content: 'The "Meetings Booked Today" section displays all meetings that were created today, regardless of their scheduled date. This gives you real-time visibility into your team\'s booking activity. Each meeting card shows:',
                features: [
                  'Contact Information: Full name, email, and phone number',
                  'Meeting Details: Scheduled date and time, client, and assigned SDR',
                  'Status: Current meeting status (pending, confirmed, etc.)',
                  'Quick Actions: Expand to view full meeting details or edit meeting information',
                ],
                videoPath: managerOverview4,
              },
              {
                title: 'Meetings Confirmed Today',
                content: 'The "Meetings Confirmed Today" section shows all meetings that were confirmed today. This helps you track confirmation activity and see which prospects are responding positively. Both sections use the same meeting card interface for consistency.',
              },
            ],
          },
          {
            id: 'visualization',
            title: 'Visualization',
            sections: [
              {
                title: 'Interactive Charts',
                content: 'The Visualization section provides multiple interactive charts to help you understand your team\'s performance at a glance. You can toggle each chart on or off using the dropdown menu in the visualization controls:',
                features: [
                  'Monthly Performance: Bar chart showing target vs actual for both meetings set and meetings held over time',
                  'Meeting Status Distribution: Pie chart showing the breakdown of meetings by status (Held, Pending, No-Show, etc.)',
                  'Active SDR Performance Comparison: Bar chart comparing all active SDRs side-by-side, showing set targets vs actual and held targets vs actual',
                  'Client Progress Visualization: Chart showing client-level performance and progress toward goals',
                ],
                videoPath: managerOverview5,
              },
              {
                title: 'Chart Customization',
                content: 'Each chart can be customized to show different goal types. You can change the goal type to focus on:',
                features: [
                  'Set Goals: Focus on meeting booking targets',
                  'Held Goals: Focus on meeting completion targets',
                  'Combined View: See both set and held goals together',
                  'Custom Metrics: Additional goal types as configured',
                ],
              },
              {
                title: 'Chart Interactions',
                content: 'Hover over chart elements to see specific statistics and detailed information. Export charts to PNG format for use in reports or presentations. The charts update in real-time as meeting data changes.',
              },
            ],
          },
        ],
      },
      meetings: {
        title: 'Team\'s Meetings',
        description: 'Oversee all team meetings with calendar views, meeting lists, and status management.',
        h1Sections: [
          {
            id: 'calendar-view',
            title: 'Calendar View',
            sections: [
              {
                title: 'Four Calendar Views',
                content: 'The Team\'s Meetings tab provides four different ways to view your team\'s meetings, giving you flexibility to see meetings in the format that works best for your workflow:',
                features: [
                  'Month View: See all meetings for the entire month in a traditional calendar grid format. Perfect for getting a high-level overview of team activity.',
                  'Week View: Focus on a single week with detailed time slots. Ideal for planning and coordination.',
                  'Day View: View a single day with hourly breakdown. Great for detailed daily planning.',
                  'Agenda View: List view showing all meetings in chronological order. Best for seeing meetings sequentially.',
                ],
                videoPath: managerTeamsMeetings1,
              },
              {
                title: 'Color-Coded Meetings',
                content: 'Meeting cards are color-coded by SDR for visual distinction, making it easy to see at a glance which SDR has which meetings. Each SDR is assigned a unique color that remains consistent across all views.',
              },
              {
                title: 'Filtering Options',
                content: 'Filter meetings by SDR or client to focus on specific subsets of meetings. This is especially useful when managing large teams or multiple clients. The filters work across all calendar views.',
                features: [
                  'Filter by SDR: Show only meetings for a specific SDR',
                  'Filter by Client: Show only meetings for a specific client',
                  'Combined Filters: Use both filters together for precise meeting views',
                ],
              },
              {
                title: 'Adding Direct Meetings',
                content: 'You can add meetings that aren\'t associated with any SDR directly from the calendar view. This is useful for meetings booked through other channels (email, LinkedIn, referrals, etc.). Click the "Add Direct Meeting" button to create a meeting without an SDR assignment.',
              },
              {
                title: 'Export Functionality',
                content: 'Export calendar data to CSV format for use in other tools or for reporting purposes. The export includes all meeting details, SDR information, and client data.',
              },
            ],
          },
          {
            id: 'meeting-cards',
            title: 'Meeting Cards',
            sections: [
              {
                title: 'Meeting Organization',
                content: 'Below the calendar view, meetings are organized into lists by status. The same filtering, sorting, and grouping options are available here as in the calendar view. Meeting cards are organized into seven different types:',
                features: [
                  'Pending: Meetings awaiting confirmation from the prospect',
                  'Confirmed: Meetings that have been confirmed by the prospect',
                  'Held: Meetings that have been successfully completed',
                  'No Show: Meetings where the prospect didn\'t attend',
                  'Past Due Pending: Meetings that have passed their scheduled time but haven\'t been marked as held or no-show',
                  'No Longer Interested: Meetings where the prospect has indicated they no longer want to proceed',
                  'Not ICP Qualified: Meetings that don\'t match the client\'s Ideal Customer Profile criteria',
                ],
                videoPath: managerTeamsMeetings2,
              },
              {
                title: 'Filter, Sort, and Group Options',
                content: 'The meeting lists support powerful filtering, sorting, and grouping functions:',
                features: [
                  'Filter: Narrow down by SDR or client name to focus on specific subsets',
                  'Sort By: Organize meetings by date, client name, SDR name, or contact name',
                  'Order: Choose ascending (oldest first) or descending (newest first) order',
                  'Group By: Group meetings by client, SDR, or leave ungrouped for a chronological view',
                  'Search: Use the search function to find specific meetings by contact name, company, or other details',
                ],
              },
              {
                title: 'Meeting Card Details',
                content: 'Each meeting card displays comprehensive information including:',
                features: [
                  'Contact Information: Full name, email, phone number, and title',
                  'Company Details: Company name and LinkedIn profile',
                  'Meeting Time: Scheduled date and time in EST',
                  'Created Time: When the meeting was originally booked',
                  'Meeting Status: Current status (Pending, Confirmed, Held, etc.)',
                  'ICP Status: Whether the meeting meets Ideal Customer Profile criteria',
                  'Prospect\'s Timezone: The timezone of the prospect',
                  'Notes: Any additional notes or information about the meeting',
                  'SDR Assignment: Which SDR is responsible for the meeting',
                ],
              },
              {
                title: 'Editing Meetings',
                content: 'As a manager, you can edit any meeting directly from the meeting card. Click the edit button (pencil icon) to modify:',
                features: [
                  'Meeting Date and Time: Change the scheduled date and time',
                  'Contact Information: Update contact details, email, phone, title, company',
                  'Meeting Status: Change status (Pending, Confirmed, Held, No Show, etc.)',
                  'ICP Status: Update ICP qualification status',
                  'Notes: Add or modify meeting notes',
                  'Prospect\'s Timezone: Adjust the timezone if needed',
                ],
                additionalContent: 'All changes made by managers are immediately reflected in the SDR dashboard, ensuring real-time synchronization across the platform. This allows managers to make corrections or updates that SDRs can see instantly.',
              },
              {
                title: 'Meeting Status Management',
                content: 'Managers can update meeting statuses in multiple ways:',
                features: [
                  'Edit Mode: Click the edit button and use the status dropdown',
                  'Drag and Drop: Drag meeting cards between status sections (where supported)',
                  'Quick Actions: Use quick action buttons for common status changes',
                ],
                additionalContent: 'When a meeting is marked as "Held", the system uses the scheduled meeting time rather than the current time, ensuring accurate meeting completion records.',
              },
            ],
          },
        ],
      },
      clients: {
        title: 'Client Management',
        description: 'Manage client relationships, assignments, and performance tracking.',
        h1Sections: [
          {
            id: 'client-overview',
            title: 'Client Overview',
            sections: [
              {
                title: 'Client List',
                content: 'The Client Management tab displays all clients in your agency. Use the month selector to view clients and their assignments for any month (current month, next month, or past months). Each client card shows:',
                features: [
                  'Client Name: The name of the client',
                  'Assigned SDRs: Which SDRs are working with this client',
                  'Monthly Set Target: Target number of meetings to set for this client',
                  'Monthly Held Target: Target number of meetings to hold',
                  'Actual Performance: Current set and held meeting counts',
                  'Progress Indicators: Visual progress bars showing completion status',
                ],
              },
              {
                title: 'Sorting Options',
                content: 'Sort clients by:',
                features: [
                  'Alphabetical: Sort by client name A-Z',
                  'Target: Sort by total monthly targets (highest first)',
                  'Date: Sort by when the client was created (newest first)',
                ],
              },
            ],
          },
          {
            id: 'client-assignments',
            title: 'Client Assignments',
            sections: [
              {
                title: 'Assigning Clients to SDRs',
                content: 'To assign a client to an SDR, click the "Assign Client" button. You\'ll need to specify:',
                features: [
                  'Client: Select the client from the dropdown (or create a new client)',
                  'SDR: Choose which SDR will work with this client',
                  'Monthly Set Target: Set the target number of meetings to book per month',
                  'Monthly Held Target: Set the target number of meetings to hold per month',
                  'Month: Select which month this assignment applies to',
                ],
              },
              {
                title: 'Editing Assignments',
                content: 'Click the edit button on any client card to modify the assignment. You can update targets, change the assigned SDR, or deactivate the assignment for a specific month.',
              },
              {
                title: 'Month-Specific Management',
                content: 'Client assignments are month-specific, allowing you to adjust targets and assignments for future months. This gives you flexibility to scale up or down based on client needs and team capacity.',
              },
            ],
          },
          {
            id: 'client-performance',
            title: 'Client Performance',
            sections: [
              {
                title: 'Performance Metrics',
                content: 'Each client card displays real-time performance metrics including:',
                features: [
                  'Meetings Set: Actual meetings booked vs the monthly set target',
                  'Meetings Held: Actual meetings held vs the monthly held target',
                  'Progress Percentages: Visual indicators showing how close each client is to their targets',
                  'Overall Progress: Combined progress across all clients',
                ],
              },
              {
                title: 'Adding New Clients',
                content: 'Click "Add New Client" to create a new client in your system. Once created, you can immediately assign the client to an SDR and set monthly targets.',
              },
            ],
          },
        ],
      },
      users: {
        title: 'User Management',
        description: 'Manage team members, roles, and permissions.',
        h1Sections: [
          {
            id: 'manager-management',
            title: 'Manager Management',
            sections: [
              {
                title: 'Adding Managers',
                content: 'Add new manager accounts to your agency. When adding a manager, you\'ll need to provide:',
                features: [
                  'Email: The manager\'s email address (used for login)',
                  'Full Name: The manager\'s full name',
                  'Password: A secure password for the account (minimum 6 characters)',
                ],
              },
              {
                title: 'Managing Manager Accounts',
                content: 'View all managers in your agency, including their email addresses, names, and account status. You can update manager passwords and manage account access.',
              },
            ],
          },
          {
            id: 'sdr-management',
            title: 'SDR Management',
            sections: [
              {
                title: 'Adding SDRs',
                content: 'Create new SDR accounts for your team. When adding an SDR, provide:',
                features: [
                  'Email: The SDR\'s email address',
                  'Full Name: The SDR\'s full name',
                ],
              },
              {
                title: 'SDR Invite Links',
                content: 'Each SDR receives a unique invite link that they can use to access their dashboard. Copy the invite link to share with your SDRs. The link is secure and token-based, allowing SDRs to access their dashboard without needing to remember passwords.',
              },
              {
                title: 'SDR Account Management',
                content: 'View all SDRs in your agency, manage their accounts, and track their invite links. You can see which SDRs are active and manage their access as needed.',
              },
            ],
          },
          {
            id: 'client-access',
            title: 'Client Access Management',
            sections: [
              {
                title: 'Client Token Management',
                content: 'Each client receives a secure token-based access link to their dashboard. View all client tokens, copy access links, and manage client access. Client tokens allow clients to view their meetings and SDR assignments without requiring login credentials.',
              },
              {
                title: 'Regenerating Tokens',
                content: 'If needed, you can regenerate client tokens to revoke old access and provide new secure links. This is useful for security purposes or when access needs to be updated.',
              },
            ],
          },
        ],
      },
      history: {
        title: 'Meeting History',
        description: 'Access historical meeting data and track trends over time.',
        h1Sections: [
          {
            id: 'monthly-view',
            title: 'Monthly View',
            sections: [
              {
                title: 'Month Selection',
                content: 'Use the month dropdown to navigate to any past or current month. View all meetings that were booked, held, or had activity during that month. This allows you to review historical performance and track trends over time.',
              },
              {
                title: 'Monthly Statistics',
                content: 'For each selected month, you\'ll see:',
                features: [
                  'Meetings Set: Total meetings booked in that month',
                  'Meetings Held: Total meetings held in that month',
                  'Pending: Meetings still pending from that month',
                  'No Shows: No-show meetings from that month',
                ],
              },
            ],
          },
          {
            id: 'filtering-and-search',
            title: 'Filtering and Search',
            sections: [
              {
                title: 'Status Filtering',
                content: 'Filter meetings by status to focus on specific types:',
                features: [
                  'All: Shows all meetings for the selected month',
                  'Booked: Shows meetings that were booked in the selected month',
                  'Held: Shows only meetings that were held',
                  'No-Show: Shows only no-show meetings',
                  'Pending: Shows only pending meetings',
                ],
              },
              {
                title: 'Advanced Filtering',
                content: 'Use the filter, sort, and group options to organize meetings:',
                features: [
                  'Filter: Narrow down by client name or SDR name',
                  'Sort By: Organize by date, client, contact name, or SDR',
                  'Order: Choose ascending (oldest first) or descending (newest first)',
                  'Group By: Group meetings by client or SDR for easier navigation',
                  'Search: Search for specific meetings by contact name, company, or other details',
                ],
              },
            ],
          },
          {
            id: 'meeting-details',
            title: 'Meeting Details',
            sections: [
              {
                title: 'Meeting Cards',
                content: 'Each meeting is displayed as a card showing comprehensive information including contact details, meeting date and time, status, SDR assignment, and notes. Click on any meeting card to expand and view full details.',
              },
              {
                title: 'Editing Historical Meetings',
                content: 'Managers can edit historical meetings to update status, add notes, or correct information. This is useful for maintaining accurate records and updating meeting outcomes after the fact.',
              },
            ],
          },
          {
            id: 'export-functionality',
            title: 'Export Functionality',
            sections: [
              {
                title: 'CSV Export',
                content: 'Export meeting history to CSV format for further analysis or reporting. Select which columns to include in the export:',
                features: [
                  'SDR Name: Include the assigned SDR',
                  'Client Name: Include the client',
                  'Contact Information: Name, email, phone',
                  'Meeting Details: Date, time, status',
                  'Notes: Any meeting notes',
                ],
              },
            ],
          },
        ],
      },
      icp: {
        title: 'ICP Check',
        description: 'Verify Ideal Customer Profile qualifications for meetings and prospects.',
        h1Sections: [
          {
            id: 'icp-review',
            title: 'ICP Review Process',
            sections: [
              {
                title: 'Pending ICP Reviews',
                content: 'The ICP Check page displays all meetings that are pending ICP (Ideal Customer Profile) review. These are meetings that have been booked but haven\'t yet been verified against your client\'s ICP criteria.',
              },
              {
                title: 'Meeting Information',
                content: 'Each meeting card shows all relevant information needed for ICP review:',
                features: [
                  'Contact Details: Full name, email, phone, title',
                  'Company Information: Company name and LinkedIn profile',
                  'Meeting Details: Scheduled date, time, and assigned SDR',
                  'Client Assignment: Which client this meeting is for',
                  'Notes: Any existing notes about the meeting or prospect',
                ],
              },
            ],
          },
          {
            id: 'icp-actions',
            title: 'ICP Actions',
            sections: [
              {
                title: 'Approving Meetings',
                content: 'If a meeting meets your ICP criteria, click "Approve" to mark it as ICP qualified. You can optionally add notes explaining why it was approved or any relevant details.',
              },
              {
                title: 'Denying Meetings',
                content: 'If a meeting doesn\'t meet ICP criteria, click "Deny" to mark it as not ICP qualified. Add notes explaining which criteria weren\'t met or why it was denied. Denied meetings will appear in the "Not ICP Qualified" section on SDR dashboards.',
              },
              {
                title: 'ICP Notes',
                content: 'When approving or denying a meeting, you can add notes that will be visible to SDRs. This helps provide feedback and guidance on why certain meetings do or don\'t qualify.',
              },
            ],
          },
          {
            id: 'icp-status-tracking',
            title: 'ICP Status Tracking',
            sections: [
              {
                title: 'Status Indicators',
                content: 'Meetings are tracked with ICP status:',
                features: [
                  'Pending: Awaiting ICP review',
                  'Approved: Meets ICP criteria and is qualified',
                  'Denied: Does not meet ICP criteria',
                ],
              },
              {
                title: 'Audit Trail',
                content: 'The system maintains a record of who reviewed each meeting and when, providing a complete audit trail of ICP decisions. This helps ensure accountability and allows you to track review activity.',
              },
            ],
          },
        ],
      },
    },
    sdr: {
      dashboard: {
        title: 'SDR Dashboard Overview',
        description: 'Your personal command center for managing meetings, tracking goals, and monitoring performance.',
        h1Sections: [
          {
            id: 'key-metrics',
            title: 'Key Metrics',
            sections: [
              {
                title: 'Monthly Targets',
                content: 'At the top of your dashboard, you\'ll see key metric cards displaying your monthly set target and monthly held target. These targets are assigned by your manager and update monthly based on your client assignments. Click on either card to see a detailed breakdown by client, showing how your targets are distributed across all your assigned clients.',
                videoPath: sdrDashboard1,
              },
              {
                title: 'Actual Performance',
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
            ],
          },
          {
            id: 'client-cards',
            title: 'Client Cards',
            sections: [
              {
                title: 'Client Card Overview',
                content: 'Each client assignment appears as a dedicated card on your dashboard. Each card displays the client name, actual set / target set ratio, actual held / target held ratio for the current month, number of pending meetings, and a visual progress indicator. You can click to toggle between viewing "Set" and "Held" progress.',
              },
              {
                title: 'Client Card Details',
                content: 'Clicking on any client card opens a detailed view showing all meetings for that specific client, organized into three sections: Meetings Set, Meetings Held, and Pending. You can preview the meeting info by clicking on a meeting, and expand it to see full details including contact information, notes, and status.',
                videoPath: sdrDashboard3,
              },
            ],
          },
          {
            id: 'meeting-cards',
            title: 'Meeting Cards',
            sections: [
              {
                title: 'Add Meeting',
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
                title: 'Meeting Status Sections',
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
            ],
          },
          {
            id: 'performance-visualization',
            title: 'Visualization',
            sections: [
              {
                title: 'Interactive Charts',
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
        h1Sections: [
          {
            id: 'all-time-performance',
            title: 'All Time Performance',
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
            ],
          },
          {
            id: 'monthly-performance',
            title: 'Monthly Performance',
            sections: [
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
            <nav className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
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
                      {sidebarItems.manager.map((item) => {
                        const contentItem = (content as any).manager[item.id];
                        const hasH1Sections = contentItem && contentItem.h1Sections;
                        const isActiveTab = activeSection === 'manager' && activeSubsection === item.id;
                        return (
                          <div key={item.id}>
                            <button
                              onClick={() => {
                                setActiveSection('manager');
                                setActiveSubsection(item.id);
                                setActiveH1(null);
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                                isActiveTab && !activeH1
                                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <item.icon className="w-4 h-4" />
                              <span>{item.title}</span>
                            </button>
                            {hasH1Sections && (
                              <div className="ml-8 mt-1 space-y-1">
                                {contentItem.h1Sections.map((h1Section: any) => (
                                  <button
                                    key={h1Section.id}
                                    onClick={() => {
                                      setActiveSection('manager');
                                      setActiveSubsection(item.id);
                                      setActiveH1(h1Section.id);
                                      const element = document.getElementById(h1Section.id);
                                      if (element) {
                                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                      }
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                      isActiveTab && activeH1 === h1Section.id
                                        ? 'bg-indigo-100 text-indigo-700 font-medium'
                                        : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                                  >
                                    <span>{h1Section.title}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
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
                      {sidebarItems.sdr.map((item) => {
                        const contentItem = (content as any).sdr[item.id];
                        const hasH1Sections = contentItem && contentItem.h1Sections;
                        const isActiveTab = activeSection === 'sdr' && activeSubsection === item.id;
                        return (
                          <div key={item.id}>
                            <button
                              onClick={() => {
                                setActiveSection('sdr');
                                setActiveSubsection(item.id);
                                setActiveH1(null);
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                                isActiveTab && !activeH1
                                  ? 'bg-blue-50 text-blue-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <item.icon className="w-4 h-4" />
                              <span>{item.title}</span>
                            </button>
                            {hasH1Sections && (
                              <div className="ml-8 mt-1 space-y-1">
                                {contentItem.h1Sections.map((h1Section: any) => (
                                  <button
                                    key={h1Section.id}
                                    onClick={() => {
                                      setActiveSection('sdr');
                                      setActiveSubsection(item.id);
                                      setActiveH1(h1Section.id);
                                      const element = document.getElementById(h1Section.id);
                                      if (element) {
                                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                      }
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                      isActiveTab && activeH1 === h1Section.id
                                        ? 'bg-blue-100 text-blue-700 font-medium'
                                        : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                                  >
                                    <span>{h1Section.title}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
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

                {/* Video Section - Show if video exists (only if no h1Sections) */}
                {videoPath && !(currentContent as any).h1Sections && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Play className="w-5 h-5 text-blue-600" />
                      <h2 className="text-2xl font-semibold text-gray-900">Video Demo</h2>
                    </div>
                    <VideoPlayer src={videoPath} title={(currentContent as any).title} />
                  </div>
                )}

                <div className="prose prose-lg max-w-none">
                  {(currentContent as any).h1Sections ? (
                    // New structure with h1, h2, h3
                    (currentContent as any).h1Sections.map((h1Section: any, h1Index: number) => (
                      <div key={h1Index} id={h1Section.id} className="mb-12 scroll-mt-24">
                        <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">{h1Section.title}</h1>
                        {h1Section.sections.map((h2Section: any, h2Index: number) => (
                          <div key={h2Index} className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{h2Section.title}</h2>
                            <p className="text-gray-700 mb-4 leading-relaxed">{h2Section.content}</p>
                            {h2Section.features && (
                              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                                {h2Section.features.map((feature: string, idx: number) => (
                                  <li key={idx}>{feature}</li>
                                ))}
                              </ul>
                            )}
                            {/* Support for video in sections */}
                            {h2Section.videoPath && (
                              <div className="my-6">
                                <VideoPlayer src={typeof h2Section.videoPath === 'string' ? h2Section.videoPath : h2Section.videoPath} title={h2Section.title} />
                              </div>
                            )}
                            {/* Support for additionalContent in sections */}
                            {h2Section.additionalContent && (
                              <p className="text-gray-700 mb-4 leading-relaxed mt-4">{h2Section.additionalContent}</p>
                            )}
                            {/* Support for images in sections */}
                            {h2Section.images && h2Section.images.map((img: any, imgIdx: number) => {
                              const imgPath = getImagePath(activeSection, activeSubsection, img.name);
                              return imgPath ? (
                                <ImageDisplay
                                  key={imgIdx}
                                  src={imgPath}
                                  alt={img.alt || h2Section.title}
                                  caption={img.caption}
                                />
                              ) : null;
                            })}
                            {/* Support for h3 subsections */}
                            {h2Section.subsections && h2Section.subsections.map((h3Section: any, h3Index: number) => (
                              <div key={h3Index} className="ml-4 mt-4">
                                <h3 className="text-xl font-semibold text-gray-800 mb-3">{h3Section.title}</h3>
                                <p className="text-gray-700 mb-3 leading-relaxed">{h3Section.content}</p>
                                {h3Section.features && (
                                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                                    {h3Section.features.map((feature: string, idx: number) => (
                                      <li key={idx}>{feature}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    // Old structure (backward compatibility)
                    (currentContent as any).sections && (currentContent as any).sections.map((section: any, index: number) => (
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
                    ))
                  )}
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

