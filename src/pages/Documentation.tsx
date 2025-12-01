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
import managerClientManagement1 from '../demo-video/manager/client-management-1.mp4';
import managerUserManagement1 from '../demo-video/manager/user-management-1.mp4';
import managerMeetingHistory1 from '../demo-video/manager/meeting-history-1.mp4';
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
        description: 'Your comprehensive command center for monitoring team performance, tracking client relationships, and maintaining complete visibility into all meeting activity across your organization.',
        h1Sections: [
          {
            id: 'key-metrics',
            title: 'Key Metrics and Performance Indicators',
        sections: [
          {
                title: 'Understanding the Overview Dashboard',
                content: 'The Manager Dashboard Overview serves as your primary window into the health and performance of your entire SDR team. When you first land on this tab, you\'re greeted by six strategically positioned metric cards that provide an immediate snapshot of your team\'s current status. These cards aren\'t just static displays—they\'re interactive portals that unlock detailed information with a single click. The layout is designed to give you both high-level visibility and the ability to drill down into specifics when needed, creating a workflow that supports both quick status checks and deep analysis.',
                videoPath: managerOverview1,
                additionalContent: 'The Overview tab is designed to answer the most critical questions managers face daily: How is my team performing? Are we on track to meet our goals? Which areas need attention? By presenting key metrics prominently and making detailed data accessible through interactive cards, the dashboard ensures you always have the information you need to make informed decisions.',
          },
          {
                title: 'Target and Capacity Cards',
                content: 'The first row of metric cards focuses on your team\'s capacity and targets, providing essential context for understanding performance. The Active SDRs card shows you at a glance how many team members are currently active, which is fundamental for understanding your team\'s capacity. Clicking this card reveals a detailed list of all SDRs, their status, and basic information, helping you quickly assess your team composition. The Monthly Set Target card displays the aggregate target for meetings booked across all SDRs and all clients, along with a visual indicator showing what percentage of the month has elapsed. This combination of target and time progress helps you understand whether your team is pacing appropriately. Similarly, the Monthly Held Target card shows your total held meeting goals and month progress, giving you visibility into completion targets. Both target cards are clickable, opening detailed breakdowns that show how targets are distributed across clients and SDRs, which is invaluable for understanding workload distribution and identifying potential imbalances.',
                features: [
                  'Active SDRs: Total number of active team members with detailed roster on click',
                  'Monthly Set Target: Aggregate booking targets across all clients and SDRs with time progress',
                  'Monthly Held Target: Aggregate completion targets with month progress percentage',
                  'Interactive Breakdowns: Click any target card to see distribution by client and SDR',
                ],
          },
              {
                title: 'Performance and Activity Cards',
                content: 'The second row of cards shifts focus from targets to actual performance, showing you what your team has accomplished. The Meetings Set card displays the total number of meetings booked this month, the percentage of target achieved, and a cumulative count of all meetings ever set. This combination of current performance and historical context helps you understand both short-term progress and long-term trends. The Meetings Held card follows the same pattern, showing held meetings for the month, percentage of held target achieved, and cumulative held meetings. The Pending card displays meetings awaiting confirmation, along with a cumulative pending count, which helps you understand your pipeline and potential future activity. All three cards are fully interactive, opening detailed views with comprehensive filtering, sorting, and grouping capabilities that let you analyze the data from multiple perspectives.',
                features: [
                  'Meetings Set: Current month bookings, target percentage, and all-time cumulative count',
                  'Meetings Held: Current month completions, held target percentage, and all-time cumulative',
                  'Pending: Current pending meetings and cumulative pending count',
                ],
                additionalContent: 'The interactive nature of these cards transforms them from simple displays into powerful analytical tools. By combining current performance metrics with historical data and providing flexible filtering options, the cards enable you to answer complex questions about your team\'s performance quickly and efficiently.',
              },
            ],
          },
          {
            id: 'sdr-performance',
            title: 'SDR Performance Analysis',
            sections: [
              {
                title: 'Individual SDR Performance Tracking',
                content: 'The SDR Performance section provides a comprehensive, month-by-month view of how each individual team member is performing. This table is one of the most valuable tools for understanding team dynamics and identifying both top performers and those who may need additional support. The month dropdown at the top allows you to navigate through time, viewing performance for any past or current month, which enables you to track trends, compare performance across different periods, and understand how individual SDRs are progressing over time. Each row in the table represents one SDR and displays their key performance metrics in a format that makes comparison easy.',
                features: [
                  'SDR Name: Full name of each team member for easy identification',
                  'Meetings Set: Actual meetings booked versus monthly set target with progress percentage',
                  'Meetings Held: Actual meetings completed versus monthly held target with progress percentage',
                  'Pending Count: Number of meetings currently awaiting confirmation',
                  'Visual Progress Bars: Color-coded indicators showing completion status at a glance',
                ],
                videoPath: managerOverview2,
                additionalContent: 'The table format makes it easy to scan and compare performance across team members. Visual progress bars provide immediate insight into who\'s on track and who might be struggling, while the numerical data gives you precise metrics for detailed analysis.',
              },
              {
                title: 'Drilling Down into SDR Details',
                content: 'The real power of the SDR Performance section lies in its expandable detail views. Clicking on any SDR row expands to reveal a comprehensive breakdown of that team member\'s client assignments and performance. This expanded view shows all clients assigned to that SDR for the selected month, with individual performance metrics for each client assignment. You can see not just aggregate numbers, but how the SDR is performing with each specific client, which is invaluable for understanding workload distribution, identifying which client relationships are most productive, and spotting potential issues with specific assignments. Clicking on any individual assignment within the expanded view takes you even deeper, showing specific meetings for that SDR-client combination, allowing you to understand the details behind the numbers.',
                features: [
                  'Client Assignments: Complete list of all clients assigned to the SDR for the selected month',
                  'Per-Client Performance: Individual metrics showing set/held targets and actual performance for each client',
                  'Meeting-Level Details: Click any assignment to see specific meetings for that SDR-client combination',
                  'Real-Time Progress: Live updates showing how close each SDR is to their individual and per-client targets',
                ],
                additionalContent: 'This hierarchical view—from team-level to individual SDR to client assignments to specific meetings—provides a complete picture of performance at every level. This depth of information enables you to provide targeted coaching, identify best practices from top performers, and address specific challenges before they become bigger problems.',
              },
              {
                title: 'Filtering, Sorting, and Exporting Performance Data',
                content: 'The SDR Performance table includes powerful tools for analyzing and working with the data. Filtering and sorting capabilities help you quickly identify top performers, spot SDRs who may need support, or organize the data in ways that support your analysis. You can filter by various criteria to focus on specific subsets of your team, and sort by different metrics to see performance rankings. When you need to share performance data or conduct deeper analysis outside the system, the export functionality allows you to download all SDR metrics, client assignments, and performance breakdowns for the selected month in CSV format. This export includes all the detail from the expanded views, giving you a complete dataset for reporting, analysis, or record-keeping.',
                additionalContent: 'The combination of interactive analysis within the dashboard and export capabilities for external analysis ensures that you have the tools you need to understand performance, communicate insights, and make data-driven decisions about your team.',
              },
            ],
          },
          {
            id: 'clients-performance',
            title: 'Client Performance Analysis',
            sections: [
              {
                title: 'Understanding Client-Level Performance',
                content: 'While the SDR Performance section focuses on individual team members, the Clients Performance section shifts the perspective to your client relationships. This view is essential for understanding which clients are meeting their goals, which may need additional attention, and how your team\'s efforts are distributed across your client portfolio. The table format mirrors the SDR Performance table for consistency, but the data is organized by client rather than by SDR, giving you a different analytical lens through which to view your team\'s work. Each row represents one client and shows their performance metrics, assigned SDR, and progress toward goals.',
                videoPath: managerOverview3,
                additionalContent: 'This client-centric view complements the SDR-focused view, giving you two different perspectives on the same data. By switching between these views, you can understand both how individual SDRs are performing and how client relationships are progressing, which is essential for managing both team performance and client satisfaction.',
              },
              {
                title: 'Exploring Client Assignment Details',
                content: 'Just as you can drill down into SDR details, you can expand any client row to see comprehensive assignment information. The expanded view reveals all SDRs assigned to that client and their individual performance metrics for that client relationship. This is particularly valuable for clients who have multiple SDRs assigned, as it shows you how each team member is contributing to that client\'s success. The detailed view helps you identify which clients are meeting their goals and which may need attention—whether that means adjusting targets, reassigning SDRs, or providing additional support. This client-focused analysis enables you to maintain strong client relationships by ensuring that each client receives appropriate attention and that their goals are being met.',
                additionalContent: 'The ability to see both SDR performance and client performance, and to drill down into details in both views, gives you a complete picture of your organization\'s health. You can identify patterns, spot issues early, and make informed decisions about resource allocation, client management, and team development.',
              },
            ],
          },
          {
            id: 'todays-activity',
            title: 'Today\'s Activity and Real-Time Monitoring',
            sections: [
          {
                title: 'Monitoring Daily Booking Activity',
                content: 'The "Meetings Booked Today" section provides real-time visibility into your team\'s daily booking activity, showing all meetings that were created today regardless of when they\'re scheduled to occur. This immediate view of booking activity is invaluable for understanding daily productivity, identifying trends in booking patterns, and ensuring that your team is maintaining consistent activity levels. The section displays meetings as they\'re created throughout the day, giving you a live feed of your team\'s work. Each meeting card shows comprehensive information including contact details, scheduled date and time, client assignment, and assigned SDR, allowing you to quickly understand what meetings are being booked and by whom.',
                features: [
                  'Contact Information: Full name, email, and phone number for each prospect',
                  'Meeting Details: Scheduled date and time, client assignment, and assigned SDR',
                  'Current Status: Real-time meeting status (pending, confirmed, etc.)',
                  'Interactive Cards: Expand any card to view full meeting details or edit information',
                ],
                videoPath: managerOverview4,
                additionalContent: 'This real-time view of booking activity helps you stay connected to your team\'s daily work. By monitoring bookings as they happen, you can quickly identify if activity levels are appropriate, spot any issues that arise, and celebrate wins as they occur. This immediate visibility supports proactive management and helps you maintain awareness of your team\'s activity without needing to constantly check individual SDR dashboards.',
              },
              {
                title: 'Tracking Confirmation Activity',
                content: 'The "Meetings Confirmed Today" section complements the booking view by showing all meetings that were confirmed today. This confirmation activity is a key indicator of prospect engagement and response rates, helping you understand how well your team is converting booked meetings into confirmed appointments. By monitoring confirmations alongside bookings, you can track the health of your pipeline and identify trends in prospect responsiveness. Both sections use the same intuitive meeting card interface for consistency, making it easy to navigate between different activity types while maintaining a familiar user experience.',
                additionalContent: 'Together, these two activity sections provide a comprehensive view of your team\'s daily work. The booking section shows output and activity levels, while the confirmation section shows engagement and conversion. By monitoring both, you can understand not just how much work your team is doing, but how effective that work is at moving prospects through the pipeline.',
          },
        ],
      },
          {
            id: 'visualization',
            title: 'Data Visualization and Insights',
        sections: [
          {
                title: 'Understanding Performance Through Visualizations',
                content: 'The Visualization section transforms your team\'s performance data into visual insights that make patterns, trends, and relationships immediately apparent. While tables and lists provide detailed information, charts and graphs help you see the big picture and identify insights that might not be obvious in raw data. The section includes multiple interactive charts, each designed to answer different questions about your team\'s performance. You can toggle each chart on or off using the dropdown menu in the visualization controls, allowing you to customize your view based on what you want to analyze at any given moment.',
                features: [
                  'Monthly Performance Chart: Bar chart showing target versus actual performance for both meetings set and meetings held over time, helping you track trends and identify patterns',
                  'Meeting Status Distribution: Pie chart breaking down all meetings by status (Held, Pending, No-Show, etc.), providing a visual representation of your pipeline health',
                  'Active SDR Performance Comparison: Side-by-side bar chart comparing all active SDRs, showing set targets versus actual and held targets versus actual, making it easy to identify top performers and those who may need support',
                  'Client Progress Visualization: Chart showing client-level performance and progress toward goals, helping you understand which clients are thriving and which may need attention',
                ],
                videoPath: managerOverview5,
                additionalContent: 'These visualizations serve different analytical purposes. The monthly performance chart helps you understand trends over time, the status distribution shows pipeline health, the SDR comparison enables team analysis, and the client visualization supports relationship management. Together, they provide a comprehensive visual understanding of your organization\'s performance.',
          },
          {
                title: 'Customizing Charts for Different Perspectives',
                content: 'Each chart can be customized to focus on different aspects of performance, allowing you to analyze your data from multiple angles. You can change the goal type to focus specifically on set goals (meeting booking targets), held goals (meeting completion targets), or view both together in a combined perspective. This flexibility means you can use the same visualization tools to answer different questions—whether you want to understand booking activity, completion rates, or overall performance. Additional custom metrics can be configured based on your specific needs, ensuring that the visualization tools adapt to your organization\'s unique goals and measurement criteria.',
                features: [
                  'Set Goals View: Focus specifically on meeting booking targets and performance',
                  'Held Goals View: Focus specifically on meeting completion targets and performance',
                  'Combined View: See both set and held goals together for comprehensive analysis',
                  'Custom Metrics: Configure additional goal types based on your organization\'s needs',
                ],
                additionalContent: 'This customization capability ensures that the visualization tools remain relevant and useful as your organization evolves. By allowing you to focus on different aspects of performance, the charts support various analytical needs and decision-making scenarios.',
          },
          {
                title: 'Interacting with Charts and Exporting Visualizations',
                content: 'The charts are fully interactive, responding to your interactions to provide detailed information. Hovering over chart elements reveals specific statistics and detailed data points, allowing you to explore the visualizations and understand the numbers behind the graphics. This interactivity transforms static charts into dynamic analytical tools. When you need to share insights or include visualizations in reports or presentations, you can export any chart to PNG format with a single click. The charts update in real-time as meeting data changes, ensuring that your visualizations always reflect the current state of your team\'s performance. This combination of interactivity, exportability, and real-time updates makes the visualization section a powerful tool for both analysis and communication.',
                additionalContent: 'The ability to interact with charts, export them for external use, and see real-time updates ensures that visualizations serve multiple purposes—from quick status checks to detailed analysis to executive reporting. This versatility makes the visualization section valuable for managers at all levels of the organization.',
          },
        ],
      },
        ],
      },
      meetings: {
        title: 'Team\'s Meetings',
        description: 'Comprehensive oversight of all team meetings with flexible calendar views, powerful filtering, and complete meeting management capabilities.',
        h1Sections: [
          {
            id: 'calendar-view',
            title: 'Calendar Views and Meeting Organization',
        sections: [
          {
                title: 'Four Perspectives on Team Meetings',
                content: 'The Team\'s Meetings tab recognizes that different situations call for different views of the same data. To support this, it provides four distinct calendar views, each optimized for different use cases and analytical needs. The Month View displays all meetings for an entire month in a traditional calendar grid format, perfect for getting a high-level overview of team activity and understanding the distribution of meetings across time. The Week View zooms in to focus on a single week with detailed time slots, ideal for planning and coordination when you need to understand scheduling patterns and identify potential conflicts. The Day View provides the most granular perspective, showing a single day with hourly breakdown, which is great for detailed daily planning and understanding exactly what\'s happening on specific days. Finally, the Agenda View presents meetings as a chronological list, best for seeing meetings sequentially and understanding the flow of activity over time.',
                features: [
                  'Month View: Comprehensive monthly overview in traditional calendar grid format',
                  'Week View: Detailed weekly perspective with time slot visibility',
                  'Day View: Hourly breakdown for precise daily planning',
                  'Agenda View: Chronological list format for sequential understanding',
                ],
                videoPath: managerTeamsMeetings1,
                additionalContent: 'The ability to switch between these views seamlessly means you can zoom in and out as needed, moving from big-picture planning to detailed coordination without losing context. This flexibility ensures that the calendar interface adapts to your workflow rather than forcing you to adapt to it.',
          },
          {
                title: 'Visual Organization Through Color Coding',
                content: 'Meeting cards are color-coded by SDR throughout all calendar views, providing immediate visual distinction that makes it easy to see at a glance which team member has which meetings. Each SDR is assigned a unique color that remains consistent across all views and throughout the interface, creating a visual language that you quickly learn to recognize. This color coding is particularly valuable in Month and Week views, where multiple meetings appear simultaneously, as it allows you to quickly scan and understand team workload distribution without reading individual meeting details. The consistent color assignment means that once you learn which color represents which SDR, you can identify their meetings instantly across all views.',
                additionalContent: 'This visual organization system transforms what could be an overwhelming display of information into an easily navigable interface. By using color as a primary organizational tool, the system leverages visual processing to make information more accessible and understandable.',
          },
          {
                title: 'Powerful Filtering for Focused Analysis',
                content: 'When managing large teams or multiple clients, the ability to filter meetings becomes essential for maintaining focus and understanding specific subsets of activity. The filtering system allows you to narrow down the view to show only meetings for a specific SDR, only meetings for a specific client, or both filters together for precise, targeted views. This filtering capability works seamlessly across all calendar views, meaning you can apply the same filters whether you\'re looking at a month overview or a day detail view. This consistency ensures that once you\'ve filtered to focus on what you need, you can switch between views without losing that focus.',
                features: [
                  'Filter by SDR: Show only meetings for a specific team member',
                  'Filter by Client: Show only meetings for a specific client',
                  'Combined Filters: Use both filters together for precise, targeted views',
                  'Cross-View Consistency: Filters work identically across all calendar views',
                ],
                additionalContent: 'The filtering system transforms the calendar from a display of all meetings into a focused analytical tool. By allowing you to isolate specific subsets of meetings, the filters enable you to answer specific questions, analyze particular relationships, or focus on areas that need attention.',
          },
          {
                title: 'Adding Direct Meetings',
                content: 'Not all meetings flow through the standard SDR booking process. Some meetings are booked through other channels—direct email communication, LinkedIn outreach, referrals, or other methods. The Team\'s Meetings interface accommodates this reality by allowing you to add meetings directly from the calendar view without requiring an SDR assignment. This "Add Direct Meeting" functionality ensures that all meetings are captured in the system, regardless of how they were booked, maintaining complete records and ensuring that your calendar reflects the full picture of team activity. This capability is essential for organizations that use multiple booking channels or have meetings that don\'t fit the standard SDR workflow.',
                additionalContent: 'The ability to add direct meetings ensures that the system remains flexible and adaptable to different workflows while maintaining data completeness. By accommodating meetings from all sources, the system provides a true picture of team activity rather than just SDR-booked meetings.',
          },
          {
                title: 'Exporting Calendar Data',
                content: 'When you need to work with meeting data outside the dashboard—for reporting, analysis in other tools, or record-keeping—the export functionality allows you to download calendar data in CSV format. The export includes comprehensive meeting details, SDR information, client data, and all relevant metadata, ensuring that you have complete information for external use. This export capability bridges the gap between the dashboard\'s interactive interface and external analytical tools, allowing you to leverage the best of both worlds.',
                additionalContent: 'The export functionality recognizes that different tasks require different tools. By providing easy export capabilities, the system ensures that you can use the dashboard for interactive analysis and exploration while still having access to raw data for deeper analysis, reporting, or integration with other systems.',
          },
        ],
      },
          {
            id: 'meeting-cards',
            title: 'Meeting Cards and Status Management',
        sections: [
          {
                title: 'Organizing Meetings by Status',
                content: 'Below the calendar view, meetings are organized into intuitive lists grouped by status, providing a different perspective on the same data that complements the calendar views. This status-based organization helps you understand the health of your pipeline, identify meetings that need attention, and track progress through different stages of the meeting lifecycle. The same powerful filtering, sorting, and grouping options available in the calendar view are also available here, ensuring consistency across different ways of viewing your data. Meetings are organized into seven distinct status categories, each representing a different stage in the meeting lifecycle or outcome.',
                cardFeatures: [
                  { label: 'Pending', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
                  { label: 'Confirmed', color: 'bg-blue-100 border-blue-300 text-blue-800' },
                  { label: 'Past Due Pending', color: 'bg-orange-100 border-orange-300 text-orange-800' },
                  { label: 'Held', color: 'bg-green-100 border-green-300 text-green-800' },
                  { label: 'No Show', color: 'bg-red-100 border-red-300 text-red-800' },
                  { label: 'No Longer Interested', color: 'bg-purple-100 border-purple-300 text-purple-800' },
                  { label: 'Not ICP Qualified', color: 'bg-gray-100 border-gray-300 text-gray-800' },
                ],
                videoPath: managerTeamsMeetings2,
                additionalContent: 'This status-based organization transforms a simple list into a pipeline management tool. By grouping meetings by status, the interface makes it immediately clear where meetings are in their lifecycle, which meetings need attention, and what the overall health of your pipeline looks like.',
              },
              {
                title: 'Advanced Filtering, Sorting, and Grouping',
                content: 'The meeting lists support comprehensive filtering, sorting, and grouping functions that transform raw data into actionable insights. Filtering allows you to narrow down by SDR or client name, focusing on specific subsets of meetings for targeted analysis. Sorting options let you organize meetings by date (to see chronological order), by client name (to group by account), by SDR name (to review individual performance), or by contact name (to find specific prospects). You can choose ascending order (oldest first) or descending order (newest first) depending on your analytical needs. Grouping options let you organize meetings by client, by SDR, or leave them ungrouped for a pure chronological view. Finally, a powerful search function allows you to find specific meetings by contact name, company, or other details, making it easy to locate particular meetings even in large datasets.',
                additionalContent: 'These organizational tools work together to create a flexible analytical environment. By combining filters, sorts, and groupings, you can answer complex questions about your team\'s meetings, identify patterns, and focus on areas that need attention.',
          },
          {
                title: 'Comprehensive Meeting Information',
                content: 'Each meeting card is a rich source of information, displaying everything you need to understand that meeting at a glance. The cards show complete contact information including full name, email, phone number, and job title, ensuring you have all the details needed for communication or follow-up. Company details include the company name and LinkedIn profile when available, providing context about the prospect\'s organization. Meeting timing information shows both the scheduled date and time (in EST) and when the meeting was originally booked, giving you temporal context. Status information includes both the current meeting status and ICP qualification status, helping you understand both where the meeting is in its lifecycle and whether it meets qualification criteria. Additional details include the prospect\'s timezone, any notes that have been added, and which SDR is responsible for the meeting.',
                features: [
                  'Contact Information: Full name, email, phone number, and job title',
                  'Company Details: Company name and LinkedIn profile when available',
                  'Meeting Timing: Scheduled date and time in EST, plus original booking date',
                  'Status Information: Current meeting status and ICP qualification status',
                  'Contextual Details: Prospect timezone, notes, and assigned SDR',
                ],
                additionalContent: 'This comprehensive information display means you rarely need to navigate elsewhere to understand a meeting. All the context you need is right there in the card, making it easy to quickly assess meetings, make decisions, and take action.',
              },
              {
                title: 'Manager Editing Capabilities',
                content: 'As a manager, you have comprehensive editing capabilities that allow you to maintain data accuracy and make necessary updates. You can edit any meeting directly from the meeting card by clicking the edit button, which opens a form where you can modify meeting details. You can change the scheduled date and time if meetings need to be rescheduled, update contact information if details are incorrect or have changed, modify meeting status to reflect actual outcomes, update ICP qualification status based on review, add or modify notes to provide context or document outcomes, and adjust the prospect\'s timezone if needed. All changes made by managers are immediately reflected in the SDR dashboard, ensuring real-time synchronization across the platform. This instant synchronization means that when managers make corrections or updates, SDRs see those changes immediately, maintaining consistency and ensuring everyone is working with the same information.',
                features: [
                  'Meeting Date and Time: Reschedule meetings when needed',
                  'Contact Information: Update details, email, phone, title, company',
                  'Meeting Status: Change status to reflect actual outcomes',
                  'ICP Status: Update qualification status based on review',
                  'Notes: Add or modify notes to provide context',
                  'Timezone: Adjust timezone if needed',
                ],
                additionalContent: 'The ability for managers to edit any meeting ensures that data remains accurate and up-to-date. Whether correcting errors, updating statuses based on outcomes, or adding important context, manager editing capabilities maintain data quality across the organization.',
          },
          {
                title: 'Flexible Status Management',
                content: 'Managers can update meeting statuses through multiple methods, providing flexibility to match different workflows and preferences. The edit mode allows you to click the edit button and use a status dropdown to change status, which is ideal when you want to review other details while updating status. Drag and drop functionality (where supported) lets you move meeting cards between status sections, providing an intuitive visual way to update status that\'s particularly useful when reviewing multiple meetings. Quick action buttons provide one-click status changes for common updates, streamlining frequent operations. When a meeting is marked as "Held", the system uses the scheduled meeting time rather than the current time, ensuring that meeting completion records reflect when meetings actually occurred rather than when they were marked as complete. This accuracy is important for reporting, analysis, and understanding actual meeting patterns.',
                features: [
                  'Edit Mode: Use the edit button and status dropdown for comprehensive updates',
                  'Drag and Drop: Move meeting cards between status sections for visual updates',
                  'Quick Actions: One-click status changes for common updates',
                  'Accurate Timestamps: System uses scheduled time for held meetings, not current time',
                ],
                additionalContent: 'This multi-method approach to status management ensures that the system adapts to different workflows and preferences. Whether you prefer detailed editing, quick visual updates, or streamlined actions, the interface supports your preferred method.',
              },
            ],
          },
        ],
      },
      clients: {
        title: 'Client Management',
        description: 'Manage client relationships, assignments, and performance tracking with comprehensive tools for planning, monitoring, and optimizing your team\'s workload.',
        h1Sections: [
          {
            id: 'client-overview',
            title: 'Client Management Overview',
            sections: [
              {
                title: 'Understanding the Client Management Interface',
                content: 'The Client Management tab serves as your central command center for overseeing all client relationships and SDR assignments. When you first open this tab, you\'ll see a comprehensive view of all clients in your agency, organized in an intuitive card-based layout. Each client card provides a wealth of information at a glance, showing not just basic client details, but real-time performance metrics, assignment status, and progress indicators that help you quickly assess which clients are thriving and which may need attention.',
                videoPath: managerClientManagement1,
                additionalContent: 'The interface is designed with efficiency in mind, allowing you to manage multiple clients and their complex assignment structures without feeling overwhelmed. You can view clients for any month—past, present, or future—giving you the flexibility to review historical performance, manage current assignments, and plan ahead for upcoming months.',
              },
              {
                title: 'Month Selection and Planning Ahead',
                content: 'One of the most powerful features of Client Management is the month selector, which enables you to navigate through time seamlessly. The system always shows one month ahead of the current month, allowing you to start planning assignments early. This forward-looking capability is invaluable for proactive management, as you can set up next month\'s assignments while the current month is still in progress. When you select a month, the entire interface updates to show client assignments, targets, and performance metrics specific to that time period. This month-specific approach ensures that historical data remains accurate while giving you the flexibility to adjust future plans as business needs evolve.',
                features: [
                  'View past months to analyze historical performance and identify trends',
                  'See the current month\'s assignments and real-time progress',
                  'Plan ahead by viewing and setting up next month\'s assignments early',
                  'All changes are month-specific, preserving historical accuracy',
                ],
              },
              {
                title: 'Client Card Information',
                content: 'Each client card is a rich source of information, displaying everything you need to understand that client\'s status at a glance. The card prominently shows the client name, followed by a list of all SDRs currently assigned to work with that client for the selected month. Below the assignments, you\'ll see the client\'s monthly targets—both for meetings set and meetings held—alongside the actual performance numbers. Visual progress bars provide an immediate sense of how well each client is performing relative to their goals, with color coding that makes it easy to spot clients who are exceeding expectations versus those who may be falling behind.',
                cardFeatures: [
                  { label: 'Client Name', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                  { label: 'Assigned SDR', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
                  { label: 'Monthly Set', color: 'bg-purple-50 border-purple-200 text-purple-700' },
                  { label: 'Actual Set', color: 'bg-purple-100 border-purple-300 text-purple-800' },
                  { label: 'Monthly Held', color: 'bg-green-50 border-green-200 text-green-700' },
                  { label: 'Actual Held', color: 'bg-green-100 border-green-300 text-green-800' },
                  { label: 'Visual Progress', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
                ],
              },
              {
                title: 'Sorting and Organization',
                content: 'To help you find and organize clients efficiently, the interface offers multiple sorting options. You can sort clients alphabetically by name, which is useful when you know the client you\'re looking for. Alternatively, you can sort by target value, which automatically arranges clients from highest to lowest total monthly targets, helping you quickly identify your most demanding clients. Finally, you can sort by date to see the most recently added clients first, which is helpful when onboarding new clients or reviewing recent additions to your portfolio.',
                features: [
                  'Alphabetical: Sort by client name A-Z for easy lookup',
                  'Target: Sort by total monthly targets (highest first) to prioritize high-volume clients',
                  'Date: Sort by creation date (newest first) to see recent additions',
                ],
              },
            ],
          },
          {
            id: 'client-assignments',
            title: 'Managing Client Assignments',
            sections: [
              {
                title: 'Adding New Clients',
                content: 'Adding a new client to your system is straightforward and immediate. When you click the "Add New Client" button, a simple form appears where you can enter the client\'s name. Once you create the client, they immediately appear in your client list, and you can start assigning SDRs to work with them right away. This streamlined process ensures that new clients can be onboarded and assigned without delay, keeping your workflow smooth and efficient.',
              },
              {
                title: 'Assigning Clients to SDRs',
                content: 'The assignment process is designed to be both comprehensive and intuitive. When you click the "Assign Client" button, a form opens that guides you through creating a new assignment. You\'ll first select the client from a dropdown menu—or if the client doesn\'t exist yet, you can create them on the spot. Next, you choose which SDR will work with this client from a list of all active SDRs in your agency. As you browse through the SDR options, you can interactively see each SDR\'s current assignment load for the selected month, displayed right in the assignment interface. This real-time visibility is crucial for workload balancing, as you can immediately see if an SDR is already handling multiple clients or if they have capacity for additional assignments.',
                features: [
                  'Client Selection: Choose from existing clients or create a new one during assignment',
                  'SDR Selection: Pick from all active SDRs, with current assignment information visible',
                  'Interactive Assignment View: See each SDR\'s current workload as you browse options',
                  'Monthly Set Target: Set the target number of meetings to book per month for this assignment',
                  'Monthly Held Target: Set the target number of meetings to successfully hold per month',
                  'Month Selection: Choose which month this assignment applies to (current, next, or past)',
                ],
                additionalContent: 'The ability to see current assignments while selecting an SDR helps prevent overloading team members and ensures fair distribution of work. This interactive feature transforms assignment from a blind process into an informed decision-making experience.',
              },
              {
                title: 'Editing Client and SDR Targets',
                content: 'Targets are not set in stone—they can and should be adjusted as business needs change. The Client Management interface provides two levels of target editing that give you granular control over performance expectations. At the client level, you can edit the overall monthly targets for meetings set and meetings held. These client-level targets represent the total goals for that client across all assigned SDRs. At the assignment level, you can edit the specific targets for each SDR-client combination, allowing you to fine-tune expectations based on individual SDR capacity, client requirements, or strategic priorities.',
                features: [
                  'Client Monthly Targets: Edit the overall set and held targets for the entire client',
                  'SDR Assignment Targets: Edit individual targets for specific SDR-client assignments',
                  'Real-time Updates: Changes are immediately reflected across the dashboard',
                  'Month-Specific: All target edits apply to the selected month only',
                ],
                additionalContent: 'This dual-level editing capability means you can set broad client goals while also customizing individual SDR assignments. For example, if a client has a total target of 50 meetings per month, you might assign 30 to one SDR and 20 to another, with the ability to adjust these splits as needed.',
              },
              {
                title: 'Managing SDR Assignments',
                content: 'Each client card shows all SDRs assigned to that client, and you have full control over these assignments. You can add new SDR assignments by clicking the assignment button, which allows you to assign additional SDRs to work with a client. This is particularly useful when a client\'s needs grow and require multiple SDRs, or when you want to distribute workload across your team. Conversely, you can delete SDR assignments when they\'re no longer needed, such as when an SDR moves to a different client or when a client\'s requirements change. The ability to add and remove assignments gives you the flexibility to adapt your team structure as your business evolves.',
                features: [
                  'Add SDR Assignments: Assign additional SDRs to work with a client',
                  'Delete SDR Assignments: Remove assignments when they\'re no longer needed',
                  'View All Assignments: See all SDRs assigned to each client at a glance',
                  'Month-Specific: Additions and deletions apply to the selected month',
                ],
              },
              {
                title: 'The Migrate Feature',
                content: 'One of the most time-saving features in Client Management is the migrate button, which allows you to copy previous month\'s assignments as a template for the upcoming month. This feature is a game-changer for monthly planning, as it eliminates the tedious work of manually recreating assignments each month. When you click migrate, the system takes all assignments from the previous month and copies them to the next month, preserving both client-SDR relationships and target values. You can then review these copied assignments and make any necessary adjustments—perhaps updating targets based on performance trends, adding new clients, or reassigning SDRs based on capacity changes. This workflow allows you to start with a solid foundation from the previous month while still having the flexibility to optimize for the upcoming period.',
                additionalContent: 'The migrate feature exemplifies the system\'s focus on efficiency and forward planning. Instead of starting from scratch each month, you build on previous work, making incremental improvements that compound over time.',
              },
            ],
          },
          {
            id: 'target-overview',
            title: 'Target Overview and Statistics',
            sections: [
              {
                title: 'Understanding Target Overview',
                content: 'At the top of the Client Management interface, you\'ll find the Target Overview section, which provides a high-level summary of all your targets and progress. This overview is designed to give you immediate insight into your team\'s overall performance and workload distribution. The overview displays aggregate statistics across all clients and SDRs for the selected month, showing total targets, actual performance, and progress percentages. This bird\'s-eye view helps you quickly assess whether your team is on track to meet monthly goals and identify any areas that may need attention.',
                features: [
                  'Total Monthly Set Target: Sum of all set targets across all clients and SDRs',
                  'Total Monthly Held Target: Sum of all held targets across all clients and SDRs',
                  'Overall Progress: Combined progress percentage showing how close you are to goals',
                  'Unassigned Clients: Count of clients without SDR assignments for the selected month',
                ],
              },
              {
                title: 'The Unassigned Section',
                content: 'One of the most valuable features in the Target Overview is the ability to click on "Unassigned" and see exactly which clients need work. When you click this section, the interface filters to show only clients that don\'t have any SDR assignments for the selected month. This is incredibly helpful for ensuring no client falls through the cracks, especially when planning for upcoming months. The unassigned view makes it immediately obvious which clients need attention, allowing you to quickly assign SDRs and set targets. This proactive approach ensures that every client has proper coverage and that your team is prepared for the month ahead.',
                additionalContent: 'The unassigned feature transforms what could be a manual audit process into a simple, visual check. By making unassigned clients immediately visible, the system helps you maintain complete coverage and prevents the oversight that can happen when managing many clients.',
              },
              {
                title: 'Why These Statistics Matter',
                content: 'The statistics displayed in Client Management aren\'t just numbers—they\'re actionable insights that drive better decision-making. The target overview helps you understand your team\'s total capacity and workload, which is essential for resource planning and ensuring that targets are realistic and achievable. Progress percentages give you early warning signs if performance is lagging, allowing you to intervene before it\'s too late. The unassigned count helps you maintain operational completeness, ensuring every client has proper coverage. Together, these statistics form a comprehensive picture of your team\'s health and performance, enabling you to make informed decisions about assignments, targets, and resource allocation.',
                additionalContent: 'By regularly reviewing these statistics, you can identify patterns, spot potential issues before they become problems, and optimize your team structure for maximum efficiency and performance.',
              },
            ],
          },
          {
            id: 'export-functionality',
            title: 'Export and Data Management',
            sections: [
              {
                title: 'Comprehensive Spreadsheet Export',
                content: 'The export functionality in Client Management is designed to give you complete control over your data. When you click the export button, you can export everything—all clients, all assignments, all targets, and all performance metrics—into a spreadsheet format. But the export feature goes beyond simple data dumping; it offers extensive customization options that let you select exactly which columns and data points you want to include. This means you can create exports tailored to specific reporting needs, whether you\'re preparing a summary for stakeholders, analyzing performance trends, or planning for upcoming months.',
                features: [
                  'Export All Data: Include all clients, assignments, targets, and metrics',
                  'Customizable Columns: Select which data points to include in your export',
                  'Client Information: Export client names, creation dates, and status',
                  'Assignment Details: Include SDR names, assignment dates, and target values',
                  'Performance Metrics: Export actual set/held counts and progress percentages',
                  'Month-Specific: Export data for the selected month or multiple months',
                ],
                additionalContent: 'The detailed customization options mean you can create exports for different purposes—a high-level summary for executives, a detailed breakdown for analysis, or a planning template for next month. This flexibility ensures that the export feature serves multiple use cases and adapts to your specific workflow needs.',
              },
              {
                title: 'Using Exports for Planning and Analysis',
                content: 'Exported data can be invaluable for planning, analysis, and reporting. You can import the spreadsheet into Excel, Google Sheets, or other analysis tools to perform deeper analysis, create charts and visualizations, or combine with other data sources. The export feature also serves as a backup mechanism, ensuring you have a record of your assignments and targets that exists outside the system. For planning purposes, you can export current month data, make adjustments in a spreadsheet, and then use that as a reference when setting up next month\'s assignments.',
              },
            ],
          },
        ],
      },
      users: {
        title: 'User Management',
        description: 'Comprehensive user administration with full control over team members, roles, permissions, and access management across your entire organization.',
        h1Sections: [
          {
            id: 'user-groups-overview',
            title: 'Understanding the Three User Groups',
            sections: [
              {
                title: 'The Three-Tier User Structure',
                content: 'The User Management tab organizes all users in your system into three distinct groups, each with specific roles and capabilities. Understanding these groups is fundamental to effective user administration. Managers represent the administrative tier with super admin powers, giving them complete control over the system. SDRs are the operational tier, responsible for booking and managing meetings. Clients are the external tier, with read-only access to view their meetings and SDR assignments. This three-tier structure ensures proper separation of concerns while maintaining security and appropriate access levels.',
                videoPath: managerUserManagement1,
                features: [
                  'Managers: Super admin access with full system control and user management capabilities',
                  'SDRs: Operational users who book meetings and manage client relationships',
                  'Clients: External users with read-only access to their own meeting data',
                ],
                additionalContent: 'Each user group has distinct needs and permissions, and the User Management interface is designed to handle all three groups efficiently from a single location. This centralized approach simplifies administration while maintaining the security boundaries necessary for a multi-tenant system.',
              },
            ],
          },
          {
            id: 'manager-management',
            title: 'Manager Management',
            sections: [
              {
                title: 'Manager Super Admin Powers',
                content: 'Managers hold the highest level of access in the system, functioning as super administrators with comprehensive control over all aspects of the platform. This elevated status means managers can manage every user type—other managers, SDRs, and clients—giving them complete oversight of the organization. Manager accounts use traditional email and password authentication, providing secure access to the full suite of administrative tools. The ability to manage other managers means you can build a team of administrators, each with the same powerful capabilities, which is essential for larger organizations that need multiple people handling user management and system administration.',
                features: [
                  'Full System Access: Complete control over all features and settings',
                  'User Management: Add, edit, and delete users across all three groups',
                  'Manager Administration: Create and manage other manager accounts',
                  'Password Management: Set and update passwords for manager accounts',
                ],
              },
              {
                title: 'Adding and Managing Manager Accounts',
                content: 'When you need to add a new manager to your agency, the process is straightforward. You\'ll provide the manager\'s email address, which serves as their login credential, along with their full name for identification purposes. You\'ll also set an initial password for the account, which must be at least 6 characters long. Once created, the manager immediately has full access to the system and can begin managing users, viewing dashboards, and performing all administrative functions. The interface displays all managers in your agency, showing their email addresses, names, and account status, allowing you to maintain oversight of your administrative team. You can update manager passwords if needed, ensuring that access remains secure and current.',
                features: [
                  'Email: The manager\'s email address (used for login)',
                  'Full Name: The manager\'s full name for identification',
                  'Password: A secure password for the account (minimum 6 characters)',
                  'Account Status: View active status and manage access',
                ],
              },
            ],
          },
          {
            id: 'sdr-management',
            title: 'SDR Management',
            sections: [
              {
                title: 'Adding and Managing SDR Accounts',
                content: 'SDR management is a core function of the User Management tab, as SDRs are the primary operational users of the system. When adding a new SDR, you only need to provide their email address and full name—the system handles the rest automatically. Unlike managers, SDRs don\'t use traditional passwords. Instead, each SDR receives a unique, secure invite link that provides token-based access to their dashboard. This approach simplifies onboarding while maintaining security, as SDRs don\'t need to remember passwords and can access their dashboard directly through the link. The invite link is generated automatically when you create an SDR account, and you can copy it immediately to share with your new team member.',
                features: [
                  'Email: The SDR\'s email address',
                  'Full Name: The SDR\'s full name',
                  'Automatic Invite Link: System generates a secure token-based access link',
                  'Copy to Share: Easy one-click copying of invite links',
                ],
              },
              {
                title: 'SDR Invite Links and Access',
                content: 'The invite link system is designed for simplicity and security. Each SDR receives a unique, secure token that\'s embedded in their personal dashboard URL. When an SDR clicks their invite link, they\'re taken directly to their dashboard without needing to enter credentials. This token-based approach eliminates password management overhead while maintaining strong security. The links are long-lived and persistent, meaning SDRs can bookmark their dashboard URL and return to it anytime. You can view all SDR invite links in the User Management interface, making it easy to resend links if needed or verify which SDRs have active access.',
                additionalContent: 'The invite link system represents a thoughtful approach to user access that balances security with usability. By removing the password requirement for SDRs, the system reduces friction in daily use while maintaining appropriate security through token-based authentication.',
              },
              {
                title: 'Deactivating and Reactivating SDRs',
                content: 'One of the most important features in SDR management is the ability to deactivate SDR accounts without deleting their data. When you deactivate an SDR, they immediately lose access to the system and can no longer log in or view their dashboard. However, all their historical data—meetings, assignments, performance metrics, and records—remains intact in the system. This is crucial for maintaining data integrity and historical accuracy. When you need to reactivate an SDR, perhaps after a leave of absence or when they return to the team, you can do so with a single click. Upon reactivation, the SDR regains access to their dashboard and can see all their previous data, assignments, and meeting history. This deactivation/reactivation workflow ensures that you can manage team changes without losing valuable historical information.',
                features: [
                  'Deactivate SDRs: Remove access without deleting data',
                  'Data Preservation: All meetings, assignments, and history remain intact',
                  'Reactivate SDRs: Restore access and full data visibility with one click',
                  'Historical Continuity: Performance tracking and records are never lost',
                ],
                additionalContent: 'The distinction between deactivation and deletion is important. Deactivation is reversible and preserves data, making it the right choice for temporary absences, role changes, or team restructuring. Deletion, by contrast, would permanently remove all data, which is rarely the desired outcome.',
              },
            ],
          },
          {
            id: 'client-management',
            title: 'Client Access Management',
            sections: [
              {
                title: 'Client Token System',
                content: 'Clients receive access through a secure token-based system similar to SDRs, but with read-only permissions. Each client gets a unique token that\'s embedded in their dashboard URL, allowing them to view their meetings, see their assigned SDR, and track meeting status—all without needing to create an account or remember login credentials. This token-based approach makes it easy for clients to access their information while maintaining security and privacy boundaries. Clients can only see their own data, ensuring that sensitive information from other clients remains protected.',
                features: [
                  'Token-Based Access: Secure, unique tokens for each client',
                  'Read-Only Access: Clients can view but not modify data',
                  'No Login Required: Direct access through token URL',
                  'Data Isolation: Each client only sees their own information',
                ],
              },
              {
                title: 'Managing Client Tokens',
                content: 'The User Management interface provides comprehensive tools for managing client access. You can view all client tokens in one place, see which clients have active access, and copy access links to share with clients. If security concerns arise or if you need to update client access, you can regenerate tokens, which immediately revokes the old token and generates a new one. This regeneration process ensures that old links no longer work, providing a way to control access when needed. The ability to manage client tokens centrally makes it easy to maintain oversight of who has access to what information, which is essential for security and compliance.',
                features: [
                  'View All Tokens: See all client access tokens in one interface',
                  'Copy Access Links: Easy sharing of client dashboard URLs',
                  'Regenerate Tokens: Revoke old access and create new secure links',
                  'Access Control: Maintain oversight of client access',
                ],
              },
            ],
          },
          {
            id: 'compensation-management',
            title: 'Compensation Management',
            sections: [
              {
                title: 'How Compensation Management Works',
                content: 'The User Management tab includes powerful compensation management tools that allow managers to set and adjust how SDRs are paid. The compensation system supports multiple commission structures, giving you flexibility to design compensation plans that align with your business goals. You can set per-meeting rates, where SDRs earn a base amount for each meeting booked and an additional amount for each meeting held. Alternatively, you can implement goal-based compensation, where SDRs earn bonuses for achieving specific percentage milestones of their monthly held goals. The system tracks all compensation automatically based on meeting performance, calculating earnings in real-time as meetings are booked and held.',
                features: [
                  'Per-Meeting Compensation: Set base rates for meetings set and held',
                  'Goal-Based Bonuses: Configure milestone bonuses for goal achievement',
                  'Real-Time Calculation: Automatic earnings calculation based on performance',
                  'Historical Tracking: View compensation history for past months',
                ],
                additionalContent: 'The compensation management system integrates seamlessly with meeting data, automatically calculating earnings as performance metrics update. This real-time calculation ensures that SDRs always have accurate, up-to-date information about their earnings, which helps with motivation and transparency.',
              },
              {
                title: 'Setting and Adjusting Compensation',
                content: 'When setting up compensation for an SDR, you can configure their commission structure based on their role, experience level, or specific client assignments. The interface allows you to set different rates for different scenarios—for example, you might set a base rate for meetings set and a higher rate for meetings held, incentivizing not just booking but successful completion. You can also set bonus thresholds, such as earning an additional bonus when an SDR exceeds 100% of their monthly held goal. All compensation settings are stored per SDR and can be adjusted at any time, giving you the flexibility to adapt compensation plans as business needs change.',
                additionalContent: 'The ability to manage compensation directly in the User Management interface means you have complete control over how your team is paid, all in one centralized location. This integration of user management and compensation management streamlines administrative workflows and ensures consistency across your organization.',
              },
            ],
          },
        ],
      },
      history: {
        title: 'Meeting History',
        description: 'Comprehensive historical meeting data with powerful filtering, search, and analysis tools to track performance trends and maintain detailed records.',
        h1Sections: [
          {
            id: 'history-overview',
            title: 'Meeting History Overview',
            sections: [
              {
                title: 'Understanding Manager Meeting History',
                content: 'The Meeting History tab in the Manager Dashboard provides a comprehensive view of all meetings across your entire team, similar to the meeting history feature available to SDRs but with expanded scope and manager-specific capabilities. While SDRs see only their own meetings, managers can view meetings from all SDRs, all clients, and across all time periods. This broader perspective enables you to analyze team-wide performance, identify trends, and make data-driven decisions about resource allocation and strategy. The interface is designed to handle large volumes of historical data efficiently, allowing you to navigate through months of meeting records with ease.',
                videoPath: managerMeetingHistory1,
                additionalContent: 'The Manager Meeting History serves as both a record-keeping tool and an analytical resource. You can use it to review past performance, understand what worked well, identify areas for improvement, and maintain accurate historical records for reporting and compliance purposes.',
              },
              {
                title: 'Key Differences from SDR Meeting History',
                content: 'While the Manager Meeting History shares many features with the SDR version, there are important differences that reflect the different needs of managers versus individual SDRs. Managers see all meetings from all SDRs, not just their own, which provides the team-wide visibility necessary for effective management. The statistics and metrics are aggregated across the entire team, showing totals and averages rather than individual performance. Additionally, managers have enhanced editing capabilities, allowing them to update meeting statuses, add notes, or correct information for any meeting in the system. This administrative control is essential for maintaining data accuracy and ensuring that historical records are complete and correct.',
                features: [
                  'Team-Wide View: See meetings from all SDRs, not just individual performance',
                  'Aggregated Statistics: View totals and averages across the entire team',
                  'Enhanced Editing: Update any meeting in the system, not just your own',
                  'Cross-SDR Analysis: Compare performance across different SDRs',
                  'Client-Level Insights: Analyze meeting patterns by client',
                ],
              },
            ],
          },
          {
            id: 'monthly-view',
            title: 'Monthly View and Navigation',
            sections: [
              {
                title: 'Month Selection and Historical Navigation',
                content: 'The month selector is your primary tool for navigating through historical meeting data. You can select any past month or the current month to view all meetings that were booked, held, or had activity during that time period. This month-by-month view allows you to review historical performance systematically, track trends over time, and compare performance across different periods. The interface remembers your selected month as you navigate, making it easy to jump between different time periods to analyze specific months or compare performance across quarters or years.',
                features: [
                  'Past Month Navigation: View any historical month to analyze past performance',
                  'Current Month View: See real-time data for the current month',
                  'Activity-Based Filtering: View all meetings with activity in the selected month',
                  'Persistent Selection: The interface remembers your month selection',
                ],
              },
              {
                title: 'Monthly Statistics Overview',
                content: 'For each selected month, the Meeting History interface displays comprehensive statistics that give you an immediate understanding of that month\'s performance. These statistics are calculated across all SDRs and all clients, providing a team-wide perspective on meeting activity. The statistics include total meetings set (booked) during that month, total meetings held, meetings that are still pending, and meetings that resulted in no-shows. These numbers help you quickly assess whether the month was successful, identify any issues that may have occurred, and understand the overall health of your team\'s meeting activity.',
                features: [
                  'Meetings Set: Total meetings booked in that month across all SDRs and clients',
                  'Meetings Held: Total meetings successfully completed during that month',
                  'Pending: Meetings from that month that are still awaiting confirmation or completion',
                  'No Shows: Meetings from that month where prospects didn\'t attend',
                ],
                additionalContent: 'These monthly statistics serve as key performance indicators, helping you understand not just what happened, but how it compares to targets and previous months. By tracking these metrics over time, you can identify trends, spot patterns, and make informed decisions about strategy and resource allocation.',
              },
            ],
          },
          {
            id: 'filtering-and-search',
            title: 'Advanced Filtering and Search',
            sections: [
              {
                title: 'Status-Based Filtering',
                content: 'The Meeting History interface provides powerful filtering options that allow you to focus on specific types of meetings. Status filtering lets you narrow down the view to show only meetings with particular statuses, which is invaluable for analysis and reporting. You can view all meetings for the selected month, or filter to show only meetings that were booked during that month (regardless of their current status), only meetings that were held, only no-show meetings, or only pending meetings. This granular filtering helps you answer specific questions about your team\'s performance, such as "How many meetings were actually held last month?" or "What meetings are still pending from previous months?"',
                features: [
                  'All: Shows all meetings for the selected month regardless of status',
                  'Booked: Shows meetings that were booked in the selected month (regardless of current status)',
                  'Held: Shows only meetings that were successfully held',
                  'No-Show: Shows only meetings where prospects didn\'t attend',
                  'Pending: Shows only meetings that are still awaiting confirmation or completion',
                ],
              },
              {
                title: 'Advanced Filtering and Organization',
                content: 'Beyond status filtering, the Meeting History interface offers comprehensive filtering, sorting, and grouping capabilities that make it easy to find and analyze specific meetings. You can filter by client name to see all meetings for a particular client, or filter by SDR name to review an individual SDR\'s historical performance. Sorting options let you organize meetings by date (to see chronological order), by client name (to group by account), by contact name (to find specific prospects), or by SDR name (to review individual performance). You can choose ascending order (oldest first) or descending order (newest first) depending on your analysis needs. Grouping options let you organize meetings by client or by SDR, which is particularly useful when analyzing patterns or preparing reports. Finally, a search function allows you to find specific meetings by contact name, company name, or other details, making it easy to locate particular meetings even in large datasets.',
                features: [
                  'Filter by Client: Narrow down to meetings for specific clients',
                  'Filter by SDR: Focus on meetings from specific SDRs',
                  'Sort By: Organize by date, client, contact name, or SDR',
                  'Order: Choose ascending (oldest first) or descending (newest first)',
                  'Group By: Group meetings by client or SDR for easier analysis',
                  'Search: Find specific meetings by contact name, company, or other details',
                ],
                additionalContent: 'These advanced filtering and organization tools transform the Meeting History from a simple list into a powerful analytical resource. By combining different filters, sorts, and groupings, you can answer complex questions about your team\'s performance and identify insights that might not be obvious in a flat list view.',
              },
            ],
          },
          {
            id: 'meeting-details',
            title: 'Meeting Details and Management',
            sections: [
              {
                title: 'Comprehensive Meeting Cards',
                content: 'Each meeting in the history is displayed as a detailed card that shows comprehensive information about that meeting. The cards include all contact details (name, email, phone number, title), company information, meeting date and time, current status, assigned SDR, client information, and any notes that were added. This rich information display means you can understand the context and details of any meeting without needing to navigate elsewhere. Clicking on a meeting card expands it to show even more details, including the prospect\'s timezone, LinkedIn profile if available, meeting creation date, and full meeting notes. This level of detail ensures that you have complete information for analysis, reporting, or follow-up actions.',
                features: [
                  'Contact Information: Full name, email, phone, and job title',
                  'Company Details: Company name and LinkedIn profile if available',
                  'Meeting Information: Scheduled date, time, and timezone',
                  'Status: Current meeting status (Held, Pending, No-Show, etc.)',
                  'Assignment: Assigned SDR and client information',
                  'Notes: Any notes or additional information about the meeting',
                ],
              },
              {
                title: 'Editing Historical Meetings',
                content: 'As a manager, you have the ability to edit historical meetings, which is essential for maintaining accurate records and correcting any errors that may have occurred. You can update meeting statuses (for example, marking a meeting as held if it was missed in real-time), add notes to provide context or updates, correct contact information if errors are discovered, or adjust meeting dates and times if records need to be updated. This editing capability ensures that your historical data remains accurate and complete, which is important for reporting, analysis, and maintaining data integrity over time. The ability to add notes to historical meetings is particularly valuable, as it allows you to document outcomes, follow-up actions, or important context that may have been discovered after the meeting occurred.',
                additionalContent: 'The editing functionality for historical meetings reflects the reality that data sometimes needs to be corrected or updated after the fact. By providing these capabilities, the system ensures that managers can maintain accurate records even when initial data entry may have been incomplete or incorrect.',
              },
            ],
          },
          {
            id: 'statistics-and-insights',
            title: 'Statistics and Performance Insights',
            sections: [
              {
                title: 'What Statistics Are Available and Why They Matter',
                content: 'The Meeting History interface provides a wealth of statistics that help you understand your team\'s performance at both aggregate and detailed levels. At the monthly level, you can see total meetings set, total meetings held, pending counts, and no-show rates. These statistics help you assess overall performance, identify trends, and compare performance across different time periods. The statistics are particularly helpful for understanding conversion rates (how many booked meetings actually result in held meetings), no-show rates (which can indicate issues with prospect qualification or meeting preparation), and overall activity levels (which help you understand team productivity and capacity utilization).',
                features: [
                  'Conversion Rates: Understand how many booked meetings result in held meetings',
                  'No-Show Analysis: Identify patterns in no-show rates to improve qualification',
                  'Activity Trends: Track meeting volume over time to understand capacity and productivity',
                  'Performance Comparison: Compare statistics across months to identify improvements or declines',
                ],
                additionalContent: 'These statistics aren\'t just numbers—they\'re insights that drive decision-making. By regularly reviewing and analyzing these statistics, you can identify what\'s working well, spot potential issues early, and make data-driven decisions about strategy, resource allocation, and process improvements.',
              },
            ],
          },
          {
            id: 'export-functionality',
            title: 'Export and Reporting',
            sections: [
              {
                title: 'CSV Export with Customization',
                content: 'The export functionality in Meeting History allows you to extract meeting data for external analysis, reporting, or record-keeping. When you export, you can select exactly which columns and data points to include, giving you complete control over the exported dataset. This customization is essential because different reports and analyses require different data points. For example, a summary report for executives might only need high-level metrics, while a detailed analysis might require all contact information, notes, and status details. The export feature supports this flexibility by letting you choose which columns to include.',
                features: [
                  'SDR Name: Include the assigned SDR for each meeting',
                  'Client Name: Include the client associated with each meeting',
                  'Contact Information: Name, email, phone number, and job title',
                  'Meeting Details: Date, time, timezone, and status',
                  'Company Information: Company name and LinkedIn profile',
                  'Notes: Any meeting notes or additional information',
                  'Custom Selection: Choose exactly which columns to include in your export',
                ],
                additionalContent: 'The ability to customize exports means you can create datasets tailored to specific needs—whether that\'s importing into other analysis tools, preparing reports for stakeholders, or maintaining external records. This flexibility ensures that the export feature serves multiple use cases and adapts to your workflow requirements.',
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
        description: 'Your personal command center for managing meetings, tracking goals, monitoring performance, and maintaining complete visibility into your work and progress.',
        h1Sections: [
          {
            id: 'key-metrics',
            title: 'Key Metrics and Performance Tracking',
            sections: [
              {
                title: 'Understanding Your Monthly Targets',
                content: 'At the top of your dashboard, prominently displayed metric cards show your monthly set target and monthly held target—the two primary goals that define your success each month. These targets aren\'t arbitrary numbers; they\'re carefully assigned by your manager based on your client assignments and are designed to reflect both your capacity and the needs of the clients you serve. The targets update monthly as your assignments change, ensuring they always reflect your current responsibilities. Each target card is interactive—clicking on either card opens a detailed breakdown that shows how your targets are distributed across all your assigned clients. This breakdown is invaluable for understanding your workload, planning your approach to each client, and ensuring you\'re allocating your time and effort appropriately across all your accounts.',
                videoPath: sdrDashboard1,
                additionalContent: 'Understanding how your targets are distributed helps you prioritize your work and ensures that no client relationship is neglected. By seeing the breakdown, you can identify which clients require more attention and plan your outreach accordingly.',
              },
              {
                title: 'Tracking Your Actual Performance',
                content: 'The "Meetings Set" and "Meetings Held" cards show your actual performance for the current month, displaying the real meetings you\'ve booked and completed. These cards don\'t just show numbers—they display your progress percentage toward your monthly targets, giving you instant visibility into whether you\'re on track, ahead of schedule, or need to increase your activity. This real-time progress tracking is essential for managing your own performance and making adjustments throughout the month. Clicking on either card opens a comprehensive view of all meetings in that category, with detailed information and powerful organizational tools that help you understand your performance at a granular level.',
                features: [
                  'Progress Percentages: Instant visibility into how close you are to your targets',
                  'Real-Time Updates: Performance metrics update as you book and complete meetings',
                  'Detailed Views: Click any card to see all meetings with full filtering and organization',
                  'Filter by Client: Narrow down meetings by client name to focus on specific accounts',
                  'Sort Options: Organize meetings by date, client name, or contact name',
                  'Order Control: Choose ascending (oldest first) or descending (newest first) order',
                  'Grouping: Group meetings by client to see all meetings for each account together, or leave ungrouped for chronological view',
                ],
                additionalContent: 'The combination of high-level progress indicators and detailed meeting views means you can quickly assess your status and then drill down into specifics when needed. This two-level approach supports both quick status checks and detailed analysis.',
              },
              {
                title: 'Monitoring Pending and No-Show Meetings',
                content: 'The "Pending" card shows all meetings scheduled for this month that are awaiting confirmation from prospects. This card is crucial for pipeline management, as it shows you which meetings need follow-up and which prospects are actively engaged. The "No Shows" card displays meetings where prospects didn\'t attend, which is important for understanding conversion rates and identifying potential issues with qualification or scheduling. Both cards are fully interactive, opening detailed meeting lists with the same comprehensive filtering, sorting, and grouping options available in other views. This consistency ensures that once you learn how to use these tools, you can apply that knowledge across all parts of the dashboard.',
                videoPath: sdrDashboard2,
                additionalContent: 'Monitoring pending and no-show meetings helps you understand not just how many meetings you\'re booking, but how effective those bookings are at moving prospects through the pipeline. By tracking these metrics, you can identify patterns, improve your approach, and increase your conversion rates.',
              },
            ],
          },
          {
            id: 'client-cards',
            title: 'Client Cards and Relationship Management',
            sections: [
              {
                title: 'Understanding Your Client Assignments',
                content: 'Each client assignment appears as a dedicated card on your dashboard, providing a focused view of your relationship with that specific client. These cards are more than just displays—they\'re interactive tools that give you immediate insight into how you\'re performing with each client. Each card displays the client name prominently, followed by key performance metrics: the actual set versus target set ratio, the actual held versus target held ratio for the current month, the number of pending meetings, and a visual progress indicator that makes it easy to see at a glance how you\'re doing. You can toggle between viewing "Set" and "Held" progress with a single click, allowing you to focus on whichever metric is most relevant at the moment.',
                additionalContent: 'These client cards transform what could be overwhelming aggregate data into manageable, client-specific views. By breaking down your overall performance into individual client relationships, the cards help you understand where you\'re succeeding and where you might need to focus more attention.',
              },
              {
                title: 'Drilling Down into Client Details',
                content: 'Clicking on any client card opens a comprehensive detailed view that shows all meetings for that specific client, organized into three intuitive sections: Meetings Set, Meetings Held, and Pending. This organization helps you understand the full lifecycle of your relationship with that client, from initial bookings through successful completions. Within each section, you can preview meeting information by clicking on individual meetings, and expand any meeting to see full details including contact information, notes, status, and all other relevant data. This hierarchical view—from client card to meeting list to individual meeting details—provides a complete picture of your work with each client while maintaining an organized, navigable structure.',
                videoPath: sdrDashboard3,
                additionalContent: 'The ability to drill down from high-level client performance to individual meeting details means you can quickly move from understanding overall performance to addressing specific meetings or prospects. This flexibility supports both strategic planning and tactical execution.',
              },
            ],
          },
          {
            id: 'meeting-cards',
            title: 'Meeting Management and Status Tracking',
            sections: [
              {
                title: 'Booking New Meetings',
                content: 'The "Add Meeting" button is your primary tool for booking new meetings directly from your dashboard. When clicked, it opens an intuitive form that guides you through entering all the necessary information. The form is designed to be both comprehensive and efficient, collecting all the details needed for a complete meeting record while making the process as smooth as possible. Required fields ensure that essential information is always captured, while optional fields allow you to add additional context when available. The meeting booked date automatically defaults to the current day, saving you time while still allowing you to adjust if needed. The prospect\'s timezone is required to ensure accurate scheduling, with options covering all major US time zones including EST, CST, MST, PST, Arizona, Alaska, and Hawaii.',
                features: [
                  'Meeting Booked Date: Automatically defaults to current day, but can be adjusted (optional)',
                  'Meeting Date: The scheduled date for the meeting (required)',
                  'Meeting Time: The scheduled time for the meeting (required)',
                  'Contact Full Name: The prospect\'s full name (required)',
                  'Contact Email: Email address for communication (optional)',
                  'Contact Phone: Phone number for contact (optional)',
                  'Title: The prospect\'s job title for context (optional)',
                  'Company: Company name for identification (optional)',
                  'LinkedIn Page: LinkedIn profile URL for additional context (optional)',
                  'Prospect\'s Timezone: Required selection from all major US time zones',
                  'Notes: Additional information about the meeting or prospect (optional)',
                ],
                videoPath: sdrDashboard4,
                additionalContent: 'The form balances completeness with efficiency, ensuring you can quickly book meetings while still capturing all the information needed for effective follow-up and relationship management.',
              },
              {
                title: 'Batch Import for Efficiency',
                content: 'While adding meetings one at a time works well for individual bookings, there are times when you have multiple meetings to book from a spreadsheet, exported data, or other sources. The batch import feature recognizes this reality and allows you to import multiple meetings at once from a CSV file. This capability dramatically increases efficiency when you have lists of meetings to book, eliminating the need to manually enter each meeting individually. The import process handles the same information fields as the individual meeting form, ensuring consistency whether you\'re adding meetings one at a time or in bulk.',
                videoPath: importMeetings,
                additionalContent: 'The batch import feature transforms what could be hours of manual data entry into a quick, automated process. This efficiency gain allows you to focus on relationship building and outreach rather than data entry.',
              },
              {
                title: 'Organizing Meetings by Status',
                content: 'Below the metric cards, your dashboard organizes all meetings into intuitive lists grouped by status. This status-based organization helps you understand where meetings are in their lifecycle and which ones need attention. When you book a new meeting, it automatically appears in the "Pending" section, where it remains until the prospect confirms or you update the status. The dashboard organizes meetings into seven distinct status categories, each representing a different stage or outcome. Pending meetings are those awaiting confirmation, representing active pipeline. Confirmed meetings show prospects who have committed to the scheduled time. Past Due Pending meetings are those where the scheduled time has passed without being marked as held or no-show, requiring immediate attention. Held meetings represent successful completions. No Shows indicate meetings where prospects didn\'t attend. No Longer Interested represents prospects who have asked to stop contact, though no-show meetings can still be rescheduled. Not ICP Qualified meetings are those that don\'t match client criteria and require review.',
                features: [
                  'Pending: Meetings awaiting confirmation from prospects',
                  'Confirmed: Meetings that prospects have confirmed',
                  'Past Due Pending: Meetings past their scheduled time awaiting status update',
                  'Held: Meetings that have been successfully completed',
                  'No Show: Meetings where prospects didn\'t attend',
                  'No Longer Interested: Prospects who have asked to stop contact',
                  'Not ICP Qualified: Meetings that don\'t match client criteria',
                ],
                additionalContent: 'Pending meetings with scheduled times within 24 hours require confirmation and will flash yellow to draw your attention. To change meeting status, click the pencil button, select the correct status from the dropdown, and click save. To delete a meeting, click the trash can button. You can also change status by dragging and dropping meeting cards between status sections.',
                videoPath: sdrDashboard5,
              },
            ],
          },
          {
            id: 'performance-visualization',
            title: 'Performance Visualization and Insights',
            sections: [
              {
                title: 'Understanding Performance Through Visualizations',
                content: 'The dashboard includes three interactive charts that transform your performance data into visual insights, making patterns and trends immediately apparent. These visualizations complement the numerical metrics and detailed lists by providing a different perspective on your performance—one that helps you see the big picture and identify insights that might not be obvious in raw data. You can toggle each chart on or off using the dropdown menu in the name card at the top, allowing you to customize your view based on what you want to analyze. This flexibility ensures that the visualizations serve your needs rather than cluttering your view with information you don\'t need at the moment.',
                features: [
                  'Monthly Performance Chart: Shows your progress toward monthly goals over time, helping you track trends and understand your trajectory',
                  'Meeting Status Distribution: A pie chart breaking down all your meetings by status, providing a visual representation of your pipeline health',
                  'Client Performance Comparison: Compares your performance across different client assignments, helping you identify which relationships are most productive',
                ],
                videoPath: sdrDashboard6,
                additionalContent: 'These visualizations serve different analytical purposes. The monthly performance chart helps you understand trends over time, the status distribution shows pipeline health, and the client comparison enables you to optimize your approach across different accounts. Together, they provide a comprehensive visual understanding of your performance.',
              },
            ],
          },
        ],
      },
      calendar: {
        title: 'Calendar View',
        description: 'Visual calendar interface with multiple view options for managing your meeting schedule and understanding your time allocation across different perspectives.',
        sections: [
          {
            title: 'Four Perspectives on Your Schedule',
            content: 'The Calendar tab recognizes that different situations call for different views of your schedule, and provides four distinct calendar views optimized for different use cases. The Month View displays all meetings for an entire month in a traditional calendar grid format, perfect for getting a high-level overview of your schedule and understanding the distribution of meetings across time. The Week View zooms in to focus on a single week with detailed time slots, ideal for planning and coordination when you need to understand scheduling patterns and identify potential conflicts. The Day View provides the most granular perspective, showing a single day with hourly breakdown, which is great for detailed daily planning and understanding exactly what\'s happening on specific days. Finally, the Agenda View presents meetings as a chronological list, best for seeing meetings sequentially and understanding the flow of activity over time.',
            videoPath: sdrCalendar1,
            features: [
              'Month View: Comprehensive monthly overview in traditional calendar grid format',
              'Week View: Detailed weekly perspective with time slot visibility',
              'Day View: Hourly breakdown for precise daily planning',
              'Agenda View: Chronological list format for sequential understanding',
            ],
            additionalContent: 'The ability to switch between these views seamlessly means you can zoom in and out as needed, moving from big-picture planning to detailed coordination without losing context. This flexibility ensures that the calendar interface adapts to your workflow rather than forcing you to adapt to it.',
          },
          {
            title: 'Visual Organization Through Color Coding',
            content: 'Meeting cards are color-coded by status throughout all calendar views, providing immediate visual distinction that makes it easy to identify meeting types at a glance without reading individual details. This color coding creates a visual language that you quickly learn to recognize: yellow or orange for pending meetings, blue for confirmed meetings, green for held meetings, and red for no-shows. This visual organization is particularly valuable in Month and Week views, where multiple meetings appear simultaneously, as it allows you to quickly scan and understand your schedule composition without reading individual meeting details. The consistent color assignment means that once you learn the color scheme, you can identify meeting statuses instantly across all views.',
            features: [
              'Pending: Yellow/orange color for meetings awaiting confirmation',
              'Confirmed: Blue color for meetings that prospects have confirmed',
              'Held: Green color for successfully completed meetings',
              'No Show: Red color for meetings where prospects didn\'t attend',
            ],
            additionalContent: 'This visual organization system transforms what could be an overwhelming display of information into an easily navigable interface. By using color as a primary organizational tool, the system leverages visual processing to make information more accessible and understandable.',
          },
          {
            title: 'Accessing Meeting Details',
            content: 'In any calendar view, clicking on a meeting opens an expanded view that shows comprehensive meeting information. The preview displays key details immediately, and you can expand it further to view complete meeting information including full contact details, company information, LinkedIn profile, notes, timezone, and all other relevant data. This hierarchical approach—from calendar view to preview to full details—ensures that you can quickly access the information you need without cluttering the calendar view with excessive detail. The ability to see both quick previews and full details means you can efficiently navigate your schedule while still having access to comprehensive information when needed.',
            additionalContent: 'This balance between overview and detail ensures that the calendar remains clean and navigable while still providing access to all the information you need for effective meeting management and follow-up.',
          },
        ],
      },
      commissions: {
        title: 'Commissions',
        description: 'Comprehensive commission tracking and calculation tools to understand your earnings, plan for goals, and track your financial performance over time.',
        sections: [
          {
            title: 'Understanding Commission Structures',
            content: 'Your manager configures how your commission is calculated based on your organization\'s compensation structure. The system supports multiple commission types, each designed to align incentives with performance goals. The Per Meeting commission type, which is demonstrated in the video, provides a base amount for each meeting booked and an additional amount for each meeting held. When you exceed your monthly held goal, meetings beyond the goal earn the full rate (base plus additional), providing extra incentive for exceeding targets. The Goal Based commission type offers bonuses for achieving specific percentage milestones of your monthly held goal (such as 100%, 110%, or 120% of goal), rewarding consistent high performance. Understanding which commission structure applies to you is essential for maximizing your earnings and setting appropriate goals.',
            videoPath: sdrCommissions1,
            features: [
              'Per Meeting: Base amount per meeting booked plus additional amount per meeting held, with full rate for meetings beyond goal',
              'Goal Based: Bonuses for achieving percentage milestones of monthly held goal (e.g., 100%, 110%, 120%)',
            ],
            additionalContent: 'The commission structure is designed to reward both activity (booking meetings) and results (holding meetings), with additional incentives for exceeding goals. This balanced approach encourages consistent performance while providing extra rewards for exceptional achievement.',
          },
          {
            title: 'Tracking Your Current Commission',
            content: 'For per-meeting commissions, the Commissions tab displays your held goal for the current month, your current progress toward that goal, and your current commission based on meetings held. This real-time display shows both your goal and your actual progress side-by-side, making it easy to understand at a glance how close you are to your commission targets. The display updates automatically as meetings are marked as held, ensuring you always have current information about your earnings. This immediate visibility into your commission status helps you understand the financial impact of your performance and motivates you to maintain or increase your activity levels.',
            additionalContent: 'Seeing your commission progress in real-time transforms abstract goals into concrete financial outcomes. This connection between performance and earnings helps maintain motivation and provides clear feedback on the value of your work.',
          },
          {
            title: 'Planning with the Commission Calculator',
            content: 'The commission calculator is a powerful planning tool that allows you to explore different performance scenarios and understand their financial implications. You can enter any hypothetical number of meetings to calculate the projected commission at that level, helping you set personal goals, understand the financial impact of different performance levels, and plan your approach to maximize earnings. This "what-if" capability is invaluable for goal setting, as it helps you understand exactly what you need to achieve to reach specific commission targets. By experimenting with different meeting counts, you can identify realistic but challenging goals and understand the incremental value of each additional meeting.',
            additionalContent: 'The commission calculator transforms commission from a passive outcome into an active planning tool. By allowing you to model different scenarios, it helps you make informed decisions about your activity levels and set goals that are both ambitious and achievable.',
          },
          {
            title: 'Understanding Your Commission History',
            content: 'Clicking "Show History" reveals your commission earnings for the past 12 months, providing a comprehensive view of your financial performance over time. Each month in the history shows your held goal, actual held meetings, goal progress percentage, and commission earned, creating a complete picture of your performance and earnings patterns. This historical view helps you track trends, identify your best performing months, understand seasonal patterns, and recognize improvements or declines in your performance. By analyzing your commission history, you can identify what works well, understand factors that contribute to higher earnings, and set goals based on your historical performance rather than arbitrary targets.',
            additionalContent: 'The commission history transforms individual months from isolated data points into a narrative of your performance journey. By seeing patterns over time, you can identify trends, celebrate improvements, and address declines before they become significant issues.',
          },
        ],
      },
      history: {
        title: 'Meeting History',
        description: 'Comprehensive historical meeting data with advanced filtering, analysis tools, and performance insights to track trends and understand your long-term performance patterns.',
        h1Sections: [
          {
            id: 'all-time-performance',
            title: 'All-Time Performance Overview',
            sections: [
              {
                title: 'Understanding Your Overall Performance',
                content: 'At the top of the Meeting History page, comprehensive all-time statistics provide a high-level overview of your overall performance across your entire tenure. These statistics aren\'t just numbers—they tell the story of your work, showing both volume and quality metrics that help you understand your effectiveness. The Total Meetings Booked statistic shows the scale of your activity, representing all meetings you\'ve ever created. The Total Meetings Held statistic shows successful outcomes, representing meetings that were successfully completed. The Total No Shows statistic helps you understand conversion challenges, showing meetings where prospects didn\'t attend. The Total Pending statistic shows your current pipeline, representing meetings across all time that are still awaiting confirmation or completion. Perhaps most importantly, the Held Rate and No Show Rate percentages provide quality metrics that help you understand not just how many meetings you\'re booking, but how effective those bookings are at moving prospects through the pipeline.',
                features: [
                  'Total Meetings Booked: Complete count of all meetings you\'ve ever created',
                  'Total Meetings Held: Complete count of all successfully completed meetings',
                  'Total No Shows: Complete count of meetings where prospects didn\'t attend',
                  'Total Pending: Currently pending meetings across all time periods',
                  'Held Rate: Percentage of booked meetings that resulted in held meetings (Held / (Held + No Shows))',
                  'No Show Rate: Percentage of booked meetings that resulted in no-shows (No Shows / (Held + No Shows))',
                ],
                additionalContent: 'These all-time statistics provide context for understanding your current performance. By seeing your overall held rate, for example, you can assess whether your current month\'s performance is above or below your historical average, helping you identify improvements or areas that need attention.',
              },
            ],
          },
          {
            id: 'monthly-performance',
            title: 'Monthly Performance Analysis',
            sections: [
              {
                title: 'Analyzing Performance Month by Month',
                content: 'Below the all-time statistics, the Meeting History page allows you to dive deep into monthly performance, viewing historical data for any past month through an intuitive month dropdown selector. This month-by-month view displays monthly targets, actual performance, and progress percentages for the selected month, providing detailed insights into your performance trends over time. This granular view helps you understand not just what happened overall, but how your performance varied from month to month, what factors contributed to better or worse months, and how you\'ve improved over time. By comparing months, you can identify patterns, understand seasonal variations, and recognize improvements in your approach.',
                videoPath: sdrMeetingHistory1,
                additionalContent: 'The ability to view any past month means you can analyze specific time periods, compare performance across different months, and understand the context behind your all-time statistics. This flexibility transforms historical data from a static record into a dynamic analytical resource.',
              },
              {
                title: 'Filtering by Status for Focused Analysis',
                content: 'Status filtering allows you to focus on specific types of meetings, helping you analyze different aspects of your performance. You can view all meetings for the selected month to get a comprehensive view, or filter to show only meetings that were booked in that month (regardless of current status) to understand booking activity. Filtering to show only held meetings helps you analyze successful outcomes, while filtering to no-shows helps you understand conversion challenges. Filtering to pending meetings shows your pipeline at that point in time. This granular filtering enables you to answer specific questions about your performance and understand different aspects of your meeting activity.',
                features: [
                  'All: Shows all meetings for the selected month regardless of status',
                  'Booked: Shows all meetings that were booked in the selected month (regardless of current status)',
                  'Held: Shows only meetings that were successfully held in the selected month',
                  'No-Show: Shows only no-show meetings from the selected month',
                  'Pending: Shows only pending meetings from the selected month',
                ],
                additionalContent: 'This status-based filtering transforms a simple list into a powerful analytical tool. By allowing you to focus on specific types of meetings, the filters help you understand different aspects of your performance and identify areas for improvement.',
              },
              {
                title: 'Advanced Filtering and Organization Tools',
                content: 'The Meeting History page includes comprehensive filtering, sorting, and grouping functions that help you find and analyze specific meetings. You can filter by client name to focus on specific accounts, helping you understand your performance with individual clients over time. Sorting options let you organize meetings by date (to see chronological order), by client (to group by account), or by contact name (to find specific prospects). You can choose ascending order (oldest first) or descending order (newest first) depending on your analytical needs. Grouping options let you organize meetings by client to see all meetings for each account together, or leave them ungrouped for a pure chronological view. These organizational tools work together to create a flexible analytical environment where you can answer complex questions about your historical performance.',
                features: [
                  'Filter by Client: Narrow down to meetings for specific accounts',
                  'Sort By: Organize by date, client, or contact name',
                  'Order: Choose ascending (oldest first) or descending (newest first)',
                  'Group By: Group by client to see all meetings for each account together, or view ungrouped for chronological view',
                ],
                additionalContent: 'These advanced organizational tools transform historical data from a simple list into a powerful analytical resource. By combining filters, sorts, and groupings, you can answer complex questions about your performance, identify patterns, and understand trends over time.',
              },
              {
                title: 'Exporting Historical Data',
                content: 'When you need to work with your meeting history outside the dashboard—for deeper analysis, reporting, or record-keeping—the export functionality allows you to download your meeting history in CSV format. You can select which columns to include in the export (client, contact, email, phone, date, status, notes), giving you control over the exported dataset. This export capability bridges the gap between the dashboard\'s interactive interface and external analytical tools, allowing you to leverage the best of both worlds. Whether you\'re importing into Excel for deeper analysis, preparing reports for stakeholders, or maintaining external records, the export feature ensures you have access to your data in the format you need.',
                additionalContent: 'The ability to export historical data recognizes that different tasks require different tools. By providing easy export capabilities, the system ensures that you can use the dashboard for interactive analysis while still having access to raw data for deeper analysis, reporting, or integration with other systems.',
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
                                    <span className="flex-1 truncate text-left" title={h1Section.title}>
                                      {h1Section.title}
                                    </span>
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
                                    <span className="flex-1 truncate text-left" title={h1Section.title}>
                                      {h1Section.title}
                                    </span>
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
                <div className="mb-10 pb-6 border-b border-gray-200">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">{(currentContent as any).title}</h1>
                  <p className="text-xl text-gray-600 leading-relaxed">{(currentContent as any).description}</p>
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
                        <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b-2 border-gray-300 pb-4">{h1Section.title}</h1>
                        {h1Section.sections.map((h2Section: any, h2Index: number) => (
                          <div key={h2Index} className="mb-10">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-6">{h2Section.title}</h2>
                            <p className="text-gray-700 mb-5 leading-relaxed text-base">{h2Section.content}</p>
                            {h2Section.features && (
                              <div className="flex flex-wrap gap-1.5 mt-4 mb-4">
                                {h2Section.features.map((feature: string, idx: number) => {
                                  const label = feature.includes(':') ? feature.split(':')[0].trim() : feature.trim();
                                  return (
                                    <span 
                                      key={idx}
                                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors"
                                      title={feature}
                                    >
                                      {label}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                            {/* Support for color-coded card features */}
                            {h2Section.cardFeatures && (
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4 mb-4">
                                {h2Section.cardFeatures.map((card: any, idx: number) => (
                                  <div 
                                    key={idx}
                                    className={`rounded-lg border-2 p-3 text-center ${card.color}`}
                                  >
                                    <div className="text-sm font-semibold">{card.label}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Support for video in sections */}
                            {h2Section.videoPath && (
                              <div className="my-6">
                                <VideoPlayer src={typeof h2Section.videoPath === 'string' ? h2Section.videoPath : h2Section.videoPath} title={h2Section.title} />
                              </div>
                            )}
                            {/* Support for additionalContent in sections */}
                            {h2Section.additionalContent && (
                              <p className="text-gray-600 mb-4 leading-relaxed mt-4 text-sm italic border-l-4 border-blue-200 pl-4 py-2 bg-blue-50 rounded-r">{h2Section.additionalContent}</p>
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
                              <div key={h3Index} className="ml-4 mt-5 pl-4 border-l-2 border-gray-200">
                                <h3 className="text-xl font-semibold text-gray-800 mb-3">{h3Section.title}</h3>
                                <p className="text-gray-700 mb-3 leading-relaxed text-base">{h3Section.content}</p>
                                {h3Section.features && (
                                  <div className="flex flex-wrap gap-1.5 mt-3 mb-3">
                                    {h3Section.features.map((feature: string, idx: number) => {
                                      const label = feature.includes(':') ? feature.split(':')[0].trim() : feature.trim();
                                      return (
                                        <span 
                                          key={idx}
                                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors"
                                          title={feature}
                                        >
                                          {label}
                                        </span>
                                      );
                                    })}
                                  </div>
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
                      <div key={index} className="mb-10">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-6">{section.title}</h2>
                        <p className="text-gray-700 mb-5 leading-relaxed text-base">{section.content}</p>
                        {section.features && (
                          <div className="flex flex-wrap gap-1.5 mt-4 mb-4">
                            {section.features.map((feature: string, idx: number) => {
                              const label = feature.includes(':') ? feature.split(':')[0].trim() : feature.trim();
                              return (
                                <span 
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors"
                                  title={feature}
                                >
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {/* Support for video in sections */}
                        {section.videoPath && (
                          <div className="my-6">
                            <VideoPlayer src={typeof section.videoPath === 'string' ? section.videoPath : section.videoPath} title={section.title} />
                          </div>
                        )}
                        {/* Support for additionalContent in sections */}
                        {section.additionalContent && (
                          <p className="text-gray-600 mb-4 leading-relaxed mt-4 text-sm italic border-l-4 border-blue-200 pl-4 py-2 bg-blue-50 rounded-r">{section.additionalContent}</p>
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

