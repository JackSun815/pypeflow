import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="text-2xl font-bold text-blue-500 hover:text-blue-600 transition-colors">
                PypeFlow
              </Link>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="/#features" className="text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">Features</a>
              <a href="/#pricing" className="text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">Pricing</a>
              <a href="/#testimonials" className="text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">Testimonials</a>
              <Link to="/blog" className="text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">Blog</Link>
              <Link to="/login" className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors">
                Sign In
              </Link>
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
            <a href="/#features" className="text-gray-700 hover:text-blue-500 block px-3 py-2 rounded-md text-base font-medium transition-colors">Features</a>
            <a href="/#pricing" className="text-gray-700 hover:text-blue-500 block px-3 py-2 rounded-md text-base font-medium transition-colors">Pricing</a>
            <a href="/#testimonials" className="text-gray-700 hover:text-blue-500 block px-3 py-2 rounded-md text-base font-medium transition-colors">Testimonials</a>
            <Link to="/blog" className="text-gray-700 hover:text-blue-500 block px-3 py-2 rounded-md text-base font-medium transition-colors">Blog</Link>
            <Link to="/login" className="bg-blue-500 text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-600 transition-colors">Sign In</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
