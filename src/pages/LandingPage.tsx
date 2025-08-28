import React, { useState } from 'react';
import { 
  ArrowRight, 
  CheckCircle, 
  Users, 
  Target, 
  Calendar, 
  BarChart3, 
  Clock, 
  Zap,
  Star,
  Play,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sdr' | 'manager' | 'client'>('sdr');

  const features = {
    sdr: [
      { icon: Target, title: 'Meeting Goal Tracking', description: 'Set and track monthly meeting targets with real-time progress updates' },
      { icon: Calendar, title: 'Smart Scheduling', description: 'Efficiently schedule meetings with integrated calendar management' },
      { icon: BarChart3, title: 'Performance Analytics', description: 'Monitor your performance with detailed analytics and insights' },
      { icon: Clock, title: 'Time Management', description: 'Optimize your time with intelligent meeting scheduling and reminders' }
    ],
    manager: [
      { icon: Users, title: 'Team Management', description: 'Oversee your SDR team with comprehensive management tools' },
      { icon: BarChart3, title: 'Advanced Analytics', description: 'Get detailed insights into team performance and meeting outcomes' },
      { icon: Target, title: 'Goal Setting', description: 'Set and monitor team-wide goals with individual target tracking' },
      { icon: Calendar, title: 'Meeting Oversight', description: 'Track all team meetings with detailed reporting and analytics' }
    ],
    client: [
      { icon: Calendar, title: 'Meeting Coordination', description: 'Seamlessly coordinate meetings with your SDR team' },
      { icon: Clock, title: 'Flexible Scheduling', description: 'Choose meeting times that work best for your schedule' },
      { icon: Mail, title: 'Communication Hub', description: 'Centralized communication with your dedicated SDR' },
      { icon: CheckCircle, title: 'Progress Tracking', description: 'Stay updated on meeting progress and outcomes' }
    ]
  };

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Senior SDR',
      company: 'TechCorp',
      content: 'PypeFlow has transformed how I manage my meetings. The goal tracking keeps me motivated and the analytics help me improve every day.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Sales Manager',
      company: 'GrowthCo',
      content: 'As a manager, I love the visibility PypeFlow provides. I can see exactly how my team is performing and where we need to focus.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'VP of Sales',
      company: 'InnovateTech',
      content: 'Our clients love the seamless meeting experience. PypeFlow has improved our client satisfaction scores significantly.',
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
                <h1 className="text-2xl font-bold text-indigo-600">PypeFlow</h1>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#features" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Features</a>
                <a href="#pricing" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Pricing</a>
                <a href="#testimonials" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Testimonials</a>
                <a href="/login" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
                  Sign In
                </a>
              </div>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-indigo-600"
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
              <a href="#features" className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Features</a>
              <a href="#pricing" className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Pricing</a>
              <a href="#testimonials" className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Testimonials</a>
              <a href="/login" className="bg-indigo-600 text-white block px-3 py-2 rounded-md text-base font-medium">Sign In</a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              The All-in-One Dashboard for
              <span className="text-indigo-600"> Modern Sales Teams</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              PypeFlow streamlines meeting management, goal tracking, and performance analytics for SDRs, Managers, and Clients in one powerful platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/login"
                className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </a>
              <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Watch Demo
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
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you're an SDR, Manager, or Client, PypeFlow has the tools you need to succeed.
            </p>
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
                      ? 'bg-white text-indigo-600 shadow-sm'
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
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-indigo-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-2">500+</div>
              <div className="text-indigo-200">Active SDRs</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">10,000+</div>
              <div className="text-indigo-200">Meetings Tracked</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">95%</div>
              <div className="text-indigo-200">Client Satisfaction</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-indigo-200">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
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
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
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
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Sales Process?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of sales teams already using PypeFlow to increase their meeting success rates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/login"
              className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5" />
            </a>
            <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors">
              Schedule a Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-indigo-400 mb-4">PypeFlow</h3>
              <p className="text-gray-400">
                The all-in-one dashboard for modern sales teams.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
                <li><a href="#" className="hover:text-white">Contact Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 PypeFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
