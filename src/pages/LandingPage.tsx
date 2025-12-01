import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle, 
  Users, 
  Target, 
  Calendar, 
  BarChart3, 
  Clock, 
  Star,
  Play,
  Mail,
  Menu,
  X,
  Book
} from 'lucide-react';
import DemoViewer from '../components/DemoViewer';
import ManagerVideoSlideshow from '../components/ManagerVideoSlideshow';
import ContactForm from '../components/ContactForm';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sdr' | 'manager' | 'client'>('sdr');
  const [showDemo, setShowDemo] = useState(false);
  const [demoType, setDemoType] = useState<'manager' | 'sdr' | 'client'>('manager');
  const [showContactForm, setShowContactForm] = useState(false);

  const features = {
    sdr: [
      { icon: Target, title: 'Real-Time Goal Tracking', description: 'Track monthly set and held meeting targets with live progress bars, client-specific goals, and performance metrics that update instantly' },
      { icon: Calendar, title: 'Advanced Meeting Management', description: 'Schedule meetings with timezone support, contact details, LinkedIn integration, and automated status tracking (pending, confirmed, held, no-show)' },
      { icon: BarChart3, title: 'Comprehensive Analytics', description: 'View detailed performance charts, meeting distribution, client performance comparisons, and monthly progress visualizations' },
      { icon: Clock, title: 'Smart Meeting Lists', description: 'Organized meeting lists by status: pending, confirmed, held, no-shows, and ICP-qualified meetings with easy filtering and management' }
    ],
    manager: [
      { icon: Users, title: 'Complete Team Oversight', description: 'Manage SDRs, assign clients, set individual targets, track team performance, and generate comprehensive reports' },
      { icon: BarChart3, title: 'Advanced Team Analytics', description: 'Team-wide performance dashboards, individual SDR metrics, client performance analysis, and exportable data reports' },
      { icon: Target, title: 'Goal & Target Management', description: 'Set monthly targets for each SDR, track progress across all team members, and manage client assignments with detailed goal tracking' },
      { icon: Calendar, title: 'Meeting Oversight & History', description: 'View all team meetings, track meeting history, manage meeting statuses, and oversee the complete sales process' }
    ],
    client: [
      { icon: Calendar, title: 'Seamless Meeting Coordination', description: 'Access your dedicated SDR dashboard through secure token-based links for easy meeting scheduling and coordination' },
      { icon: Clock, title: 'Flexible Timezone Support', description: 'Schedule meetings across different timezones with automatic time conversion and prospect-friendly scheduling' },
      { icon: Mail, title: 'Direct SDR Communication', description: 'Direct access to your assigned SDR with integrated contact information and meeting management' },
      { icon: CheckCircle, title: 'Meeting Status Tracking', description: 'Real-time updates on meeting confirmations, held meetings, and progress tracking with your dedicated SDR team' }
    ]
  };

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Senior SDR',
      company: 'TechCorp',
      content: 'The real-time goal tracking and client-specific targets keep me focused. I can see exactly where I stand with each client and the progress bars motivate me to stay on track. The meeting management with timezone support is a game-changer.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Sales Manager',
      company: 'GrowthCo',
      content: 'The team oversight features are incredible. I can manage all my SDRs, set individual targets, and track performance across the entire team. The analytics dashboard gives me insights I never had before.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'VP of Sales',
      company: 'InnovateTech',
      content: 'Our clients love the secure token-based access to their SDR dashboards. The seamless meeting coordination and real-time status updates have improved our client satisfaction and meeting success rates by 40%.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-500">PypeFlow</h1>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <button
                  onClick={() => {
                    setDemoType('manager');
                    setShowDemo(true);
                  }}
                  className="text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Demo
                </button>
                <a href="/docs" className="text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">Documentation</a>
                <a href="/blog" className="text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">Blog</a>
                <button
                  onClick={() => setShowContactForm(true)}
                  className="text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center justify-center"
                >
                  Contact
                </button>
                <a href="/login" className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors">
                  Sign In
                </a>
              </div>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-blue-500 transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-100">
              <button
                onClick={() => {
                  setDemoType('manager');
                  setShowDemo(true);
                  setMobileMenuOpen(false);
                }}
                className="text-gray-700 hover:text-blue-500 block px-3 py-2 rounded-md text-base font-medium transition-colors w-full text-left"
              >
                Demo
              </button>
              <a href="/docs" className="text-gray-700 hover:text-blue-500 block px-3 py-2 rounded-md text-base font-medium transition-colors">Documentation</a>
              <a href="/blog" className="text-gray-700 hover:text-blue-500 block px-3 py-2 rounded-md text-base font-medium transition-colors">Blog</a>
              <button
                onClick={() => {
                  setShowContactForm(true);
                  setMobileMenuOpen(false);
                }}
                className="text-gray-700 hover:text-blue-500 block px-3 py-2 rounded-md text-base font-medium transition-colors w-full text-left"
              >
                Contact
              </button>
              <a href="/login" className="bg-blue-500 text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-600 transition-colors">Sign In</a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              The All-in-One Dashboard for
              <span className="text-blue-500"> Modern Sales Teams</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              PypeFlow streamlines meeting management, goal tracking, and performance analytics for SDRs, Managers, and Clients in one powerful platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/login"
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </a>
              <button 
                onClick={() => {
                  setDemoType('manager');
                  setShowDemo(true);
                }}
                className="group relative border-2 border-blue-500 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold overflow-hidden transition-all duration-300 flex items-center justify-center gap-2 hover:text-white"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-in-out"></span>
                <Play className="w-5 h-5 relative z-10" />
                <span className="relative z-10">See It In Action</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for Every Role in Your Sales Process
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Whether you're an SDR, Manager, or Client, PypeFlow has the tools you need to succeed.
            </p>
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105"
            >
              <Book className="w-5 h-5" />
              <span>View Comprehensive Documentation</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Role Tabs */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-100 rounded-lg p-1">
              {[
                { id: 'sdr', label: 'SDRs', icon: Target },
                { id: 'manager', label: 'Managers', icon: Users },
                { id: 'client', label: 'Clients', icon: Calendar }
              ].map((role) => (
                <button
                  key={role.id}
                  onClick={() => setActiveTab(role.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-colors ${
                    activeTab === role.id
                      ? 'bg-white text-blue-500 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <role.icon className="w-5 h-5" />
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features[activeTab].map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center mb-4 group-hover:from-blue-200 group-hover:to-cyan-200 transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-2">50+</div>
              <div className="text-blue-100">Active SDRs</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">2,500+</div>
              <div className="text-blue-100">Meetings Tracked</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">40%</div>
              <div className="text-blue-100">Meeting Success Rate Increase</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">Real-time</div>
              <div className="text-blue-100">Goal Tracking</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your team size and needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* SDR Plan */}
            <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-100">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">SDR Plan</h3>
                <p className="text-gray-600">Perfect for individual SDRs</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-blue-600">$29</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Real-time goal tracking</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Advanced meeting management</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Performance analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Timezone support</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Client-specific targets</span>
                </li>
              </ul>
              <a
                href="/login"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center block"
              >
                Get Started
              </a>
            </div>

            {/* Manager Plan */}
            <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-blue-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Manager Plan</h3>
                <p className="text-gray-600">Complete team management</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-blue-600">$99</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Everything in SDR Plan</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Team oversight dashboard</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Advanced team analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>SDR management tools</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Client assignment management</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Exportable reports</span>
                </li>
              </ul>
              <a
                href="/login"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center block"
              >
                Get Started
              </a>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-100">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <p className="text-gray-600">Custom solutions for large teams</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-blue-600">Custom</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Everything in Manager Plan</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Dedicated support</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Advanced security</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Custom reporting</span>
                </li>
              </ul>
              <a
                href="/login"
                className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-center block"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Your Dashboard Awaits
            </h2>
            <p className="text-xl text-gray-600">
              See exactly what you'll get with PypeFlow - no more guessing
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">SDR Dashboard</h3>
              <p className="text-gray-600 mb-6">
                Your personal command center for meeting management and goal tracking. 
                Everything you need to succeed as an SDR in one beautiful interface.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Real-time goal tracking with progress bars</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Client cards with individual targets</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Meeting lists organized by status</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Performance analytics and charts</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl shadow-2xl p-6 border border-gray-200">
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="text-sm font-semibold text-gray-700">SDR Dashboard - December 2024</div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">15</div>
                    <div className="text-xs text-blue-600">Meetings Set</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">12</div>
                    <div className="text-xs text-green-600">Meetings Held</div>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">Client: TechCorp</div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>75%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm">3 Pending Meetings</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">5 Confirmed Meetings</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="order-2 lg:order-1">
              <ManagerVideoSlideshow />
            </div>
            <div className="order-1 lg:order-2">
              <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl p-8 shadow-lg border border-indigo-100">
                <div className="mb-6">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                    Manager Dashboard
                  </h3>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    Complete oversight of your SDR team with comprehensive analytics, 
                    individual performance tracking, and team-wide goal management.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-indigo-50 hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <span className="text-gray-800 font-medium text-lg">Team performance overview</span>
                      <p className="text-sm text-gray-600 mt-1">Track overall team metrics and progress at a glance</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-indigo-50 hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <span className="text-gray-800 font-medium text-lg">Individual SDR tracking</span>
                      <p className="text-sm text-gray-600 mt-1">Monitor each team member's performance and goals</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-indigo-50 hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <span className="text-gray-800 font-medium text-lg">Client assignment management</span>
                      <p className="text-sm text-gray-600 mt-1">Efficiently assign and manage client relationships</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-indigo-50 hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <span className="text-gray-800 font-medium text-lg">Exportable reports and analytics</span>
                      <p className="text-sm text-gray-600 mt-1">Generate comprehensive reports for stakeholders</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              See PypeFlow in Action
            </h2>
            <p className="text-xl text-gray-600">
              Real features that drive real results for your sales team
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Real-Time Goal Tracking</h3>
              <p className="text-gray-600 mb-6">
                Track monthly set and held meeting targets with live progress bars that update instantly. 
                See exactly where you stand with each client and get motivated by visual progress indicators.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Client-specific monthly targets</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Live progress bars with month completion tracking</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Performance metrics and analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Goal tier tracking with bonus calculations</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-xl">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="font-semibold text-gray-900 mb-4">Monthly Set Target</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-semibold text-green-600">75%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-600 rounded-full" style={{ width: '75%' }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>15 meetings set</span>
                    <span>20 target</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="order-2 lg:order-1">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-xl">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="font-semibold text-gray-900 mb-4">Meeting Management</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm">Pending: 3 meetings</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Confirmed: 5 meetings</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Held: 12 meetings</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Advanced Meeting Management</h3>
              <p className="text-gray-600 mb-6">
                Schedule meetings with comprehensive contact details, timezone support, and automated status tracking. 
                Organize meetings by status and manage the complete meeting lifecycle.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Timezone-aware scheduling</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Contact details and LinkedIn integration</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Status tracking: pending, confirmed, held, no-show</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>ICP qualification tracking</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Comprehensive Analytics</h3>
              <p className="text-gray-600 mb-6">
                Get detailed insights into your performance with interactive charts, meeting distribution analysis, 
                and client performance comparisons. Make data-driven decisions to improve your results.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Monthly performance charts</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Meeting status distribution</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Client performance comparisons</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Exportable data and reports</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-xl">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="font-semibold text-gray-900 mb-4">Performance Overview</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">15</div>
                    <div className="text-xs text-gray-600">Meetings Set</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">12</div>
                    <div className="text-xs text-gray-600">Meetings Held</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">3</div>
                    <div className="text-xs text-gray-600">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">1</div>
                    <div className="text-xs text-gray-600">No Shows</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by Sales Teams Everywhere
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers have to say about PypeFlow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role} at {testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Sales Process?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join sales teams already using PypeFlow to increase their meeting success rates by 40% and achieve their goals faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a
              href="/login"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5" />
            </a>
            <button 
              onClick={() => setShowContactForm(true)}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-cyan-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Mail className="w-5 h-5" />
              Contact Us
            </button>
            <button 
              onClick={() => {
                // Scroll to features section
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300"
            >
              Explore Features
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="text-white">
              <div className="text-2xl font-bold mb-2">✓</div>
              <div className="text-sm text-blue-100">No setup fees</div>
            </div>
            <div className="text-white">
              <div className="text-2xl font-bold mb-2">✓</div>
              <div className="text-sm text-blue-100">Cancel anytime</div>
            </div>
            <div className="text-white">
              <div className="text-2xl font-bold mb-2">✓</div>
              <div className="text-sm text-blue-100">24/7 support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-800 via-slate-700 to-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-blue-300 mb-4">PypeFlow</h3>
              <p className="text-gray-300">
                The all-in-one dashboard for modern sales teams.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-blue-200 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-blue-200 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-blue-200 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-blue-200 transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-blue-200 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-blue-200 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-blue-200 transition-colors">Careers</a></li>
                <li>
                  <button 
                    onClick={() => setShowContactForm(true)}
                    className="hover:text-blue-200 transition-colors text-left"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-blue-200 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-blue-200 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-200 transition-colors">Status</a></li>
                <li>
                  <button 
                    onClick={() => setShowContactForm(true)}
                    className="hover:text-blue-200 transition-colors text-left"
                  >
                    Contact Support
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 PypeFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Demo Viewer Modal */}
      {showDemo && (
        <DemoViewer 
          type={demoType} 
          onClose={() => setShowDemo(false)} 
        />
      )}

      {/* Contact Form Modal */}
      <ContactForm
        isOpen={showContactForm}
        onClose={() => setShowContactForm(false)}
      />
    </div>
  );
}
