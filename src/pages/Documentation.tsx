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
        sections: [
          {
            title: 'Personal Performance Hub',
            content: 'The SDR Dashboard provides a focused view of your individual performance, assigned clients, and meeting activity. Track your progress against monthly goals and manage all your meetings in one place.',
            features: [
              'Real-time goal progress tracking',
              'Client-specific performance metrics',
              'Meeting management and scheduling',
              'Performance analytics and insights',
              'Commission tracking',
            ],
          },
          {
            title: 'Goal Tracking',
            content: 'Monitor your monthly targets for meetings set and meetings held. View progress bars showing your current status against goals for each assigned client and overall totals.',
          },
          {
            title: 'Client Cards',
            content: 'Each assigned client has a dedicated card showing your performance metrics, upcoming meetings, and goal progress. Quickly see which clients need attention and track your success rate.',
          },
        ],
      },
      goals: {
        title: 'Goal Tracking',
        description: 'Set and track monthly targets for meetings set and held.',
        sections: [
          {
            title: 'Monthly Targets',
            content: 'Each client has specific monthly targets for meetings set and meetings held. Track your progress with visual progress bars and percentage indicators.',
          },
          {
            title: 'Goal Progress',
            content: 'Monitor your progress throughout the month. See at a glance which clients you\'re on track with and which need more attention.',
          },
          {
            title: 'Performance Metrics',
            content: 'View detailed metrics including total meetings set, held meetings, pending confirmations, and today\'s meetings for each client.',
          },
        ],
      },
      meetings: {
        title: 'Meeting Management',
        description: 'Schedule, manage, and track all your meetings.',
        sections: [
          {
            title: 'Scheduling Meetings',
            content: 'Add new meetings with full details including date, time, timezone, contact information, and notes. The system automatically tracks meeting status and sends reminders.',
          },
          {
            title: 'Meeting Status',
            content: 'Meetings progress through statuses: Pending → Confirmed → Held. Track no-shows and update meeting outcomes. All status changes are timestamped.',
          },
          {
            title: 'Meeting Lists',
            content: 'Organized lists show pending meetings, confirmed meetings, held meetings, and no-shows. Filter by client or date to find specific meetings quickly.',
          },
          {
            title: 'Timezone Support',
            content: 'Schedule meetings across different timezones with automatic conversion. Ensure prospects see meeting times in their local timezone.',
          },
        ],
      },
      analytics: {
        title: 'Performance Analytics',
        description: 'Analyze your performance with detailed charts and metrics.',
        sections: [
          {
            title: 'Performance Charts',
            content: 'View visualizations of your meeting distribution, client performance comparisons, monthly progress trends, and goal completion rates.',
          },
          {
            title: 'Client Performance',
            content: 'Compare your performance across different clients. Identify which clients you\'re most successful with and where you can improve.',
          },
          {
            title: 'Trend Analysis',
            content: 'Track your performance over time to identify trends, improvements, and areas for growth.',
          },
        ],
      },
      commissions: {
        title: 'Commissions',
        description: 'Track your commission earnings and performance-based compensation.',
        sections: [
          {
            title: 'Commission Tracking',
            content: 'View your commission structure and earnings based on meetings held and other performance metrics.',
          },
          {
            title: 'Performance-Based Pay',
            content: 'Understand how your performance directly impacts your compensation. Track progress toward commission goals.',
          },
        ],
      },
      history: {
        title: 'Meeting History',
        description: 'Review your past meetings and performance history.',
        sections: [
          {
            title: 'Historical Records',
            content: 'Access complete records of all your past meetings including dates, outcomes, and associated clients.',
          },
          {
            title: 'Performance Review',
            content: 'Review your historical performance to identify patterns, successes, and areas for improvement.',
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
  
  // Get video path for current subsection
  const videoPath = useMemo(() => {
    return getVideoPath(activeSection, activeSubsection);
  }, [activeSection, activeSubsection]);

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

