import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, Search, Tag } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import Header from '../components/Header';
import { trackBlogEngagement } from '../components/GoogleAnalytics';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  publishedAt: string;
  author: {
    name: string;
    avatar?: string;
  };
  tags: string[];
  featuredImage?: string;
  readTime: number;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Always refetch when component mounts to ensure fresh data
    loadBlogPosts();
  }, []);

  const loadBlogPosts = async () => {
    try {
      setLoading(true);
      setPosts([]); // Clear previous posts to avoid showing stale data
      
      // Check if Strapi URL is configured
      const strapiUrl = import.meta.env.VITE_STRAPI_URL;
      if (!strapiUrl) {
        console.warn('VITE_STRAPI_URL not configured, using mock data');
        setPosts(getMockPosts());
        setLoading(false);
        return;
      }
      
      console.log('Loading blog posts from Strapi...', strapiUrl);
      
      // Create a fetch with timeout using AbortController
      // Increased timeout to 15 seconds for slower connections
      const fetchWithTimeout = (url: string, timeout = 15000): Promise<Response> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        return fetch(url, { signal: controller.signal })
          .finally(() => clearTimeout(timeoutId));
      };
      
      // Try both possible endpoints - articles and blog-posts
      let response;
      let data;
      const timeout = 15000; // 15 second timeout
      
      try {
        // First try the articles endpoint (most common in Strapi)
        // Only populate what we need instead of * to reduce payload size
        const articlesUrl = `${strapiUrl}/api/articles?populate[cover][fields][0]=url&populate[author][fields][0]=name&populate[category][fields][0]=name&sort=publishedAt:desc`;
        response = await fetchWithTimeout(articlesUrl, timeout);
        if (response.ok) {
          data = await response.json();
          console.log('Successfully loaded from /api/articles');
        } else {
          throw new Error(`Articles endpoint failed: ${response.status}`);
        }
      } catch (articlesError: any) {
        // Check if it's a timeout or abort error
        if (articlesError.name === 'AbortError' || articlesError.message === 'Request timeout') {
          console.warn('Articles endpoint timed out, trying blog-posts...');
        } else {
          console.log('Articles endpoint failed, trying blog-posts...', articlesError);
        }
        
        try {
          // Fallback to blog-posts endpoint with optimized populate
          const blogPostsUrl = `${strapiUrl}/api/blog-posts?populate[cover][fields][0]=url&populate[author][fields][0]=name&populate[category][fields][0]=name&sort=publishedAt:desc`;
          response = await fetchWithTimeout(blogPostsUrl, timeout);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          data = await response.json();
          console.log('Successfully loaded from /api/blog-posts');
        } catch (blogPostsError: any) {
          // Don't fall back to mock data - show error instead
          if (blogPostsError.name === 'AbortError' || blogPostsError.message === 'Request timeout') {
            console.error('Blog posts endpoint timed out after 15 seconds');
            throw new Error('Request timed out. Please check your Strapi URL and try again.');
          } else {
            console.error('Both endpoints failed:', blogPostsError);
            throw new Error(`Failed to load blog posts: ${blogPostsError.message || 'Unknown error'}`);
          }
        }
      }
      
      console.log('Strapi response:', data);
      
      if (!data.data || data.data.length === 0) {
        console.log('No blog posts found in Strapi');
        setPosts([]); // Show empty state instead of mock data
        setLoading(false);
        return;
      }
      
      const formattedPosts = data.data.map((post: any) => {
        // Handle both Strapi v4 structure (direct properties) and v3 structure (attributes)
        const isV4 = !post.attributes;
        const title = isV4 ? post.title : post.attributes.title;
        const slug = isV4 ? post.slug : post.attributes.slug;
        const publishedAt = isV4 ? post.publishedAt : post.attributes.publishedAt;
        const description = isV4 ? post.description : post.attributes.description;
        const cover = isV4 ? post.cover : post.attributes.cover;
        const author = isV4 ? post.author : post.attributes.author;
        const category = isV4 ? post.category : post.attributes.category;
        const blocks = isV4 ? post.blocks : post.attributes.blocks;
        
        // Extract content from blocks (Strapi v4 structure)
        let content = '';
        if (blocks && Array.isArray(blocks)) {
          content = blocks
            .filter(block => block.__component === 'shared.rich-text')
            .map(block => block.body)
            .join('\n\n');
        }
        
        // If no content from blocks, use description as markdown
        if (!content && description) {
          content = description;
        }
        
        // Create excerpt from content (strip markdown for preview)
        const excerpt = content ? 
          content.replace(/#{1,6}\s+/g, '') // Remove headers
                .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
                .replace(/\*(.*?)\*/g, '$1') // Remove italic
                .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
                .substring(0, 150) + '...' : 
          (description || 'No description available');
        
        // Handle image URLs - Strapi returns relative URLs that need to be prefixed
        const getImageUrl = (url: string | undefined) => {
          if (!url) return undefined;
          if (url.startsWith('http://') || url.startsWith('https://')) {
            return url; // Already absolute
          }
          // Relative URL - prefix with Strapi base URL
          const baseUrl = strapiUrl.replace(/\/$/, ''); // Remove trailing slash
          return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
        };

        return {
          id: post.id.toString(),
          title,
          excerpt,
          content: content || description || 'No content available',
          slug,
          publishedAt,
          author: {
            name: author?.name || 'Eric Chen',
            avatar: getImageUrl(author?.avatar?.url)
          },
          tags: category ? [category.name] : [],
          featuredImage: getImageUrl(cover?.url),
          readTime: 5 // Default read time
        };
      });
      
      console.log('Formatted posts:', formattedPosts);
      setPosts(formattedPosts);
    } catch (error: any) {
      console.error('Error loading blog posts:', error);
      // Only use mock data if VITE_STRAPI_URL is not configured
      // Otherwise, show empty state or error message
      const strapiUrl = import.meta.env.VITE_STRAPI_URL;
      if (!strapiUrl) {
        setPosts(getMockPosts());
      } else {
        // Show empty state - don't use mock data when API is configured
        setPosts([]);
        console.error('Failed to load blog posts from API:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const getMockPosts = (): BlogPost[] => [
    {
      id: '1',
      title: 'How to Scale Your SDR Team: A Complete Guide',
      excerpt: 'Learn the proven strategies to build and scale a high-performing SDR team that drives consistent revenue growth.',
      content: 'Full blog content here...',
      slug: 'how-to-scale-sdr-team',
      publishedAt: '2024-01-15T10:00:00Z',
      author: {
        name: 'Eric Chen',
        avatar: '/api/placeholder/40/40'
      },
      tags: ['SDR', 'Sales', 'Team Management'],
      featuredImage: '/api/placeholder/800/400',
      readTime: 8
    },
    {
      id: '2',
      title: 'The Future of Sales Development: AI and Automation',
      excerpt: 'Discover how AI and automation are revolutionizing the sales development process and what it means for your team.',
      content: 'Full blog content here...',
      slug: 'future-sales-development-ai',
      publishedAt: '2024-01-10T14:30:00Z',
      author: {
        name: 'Eric Chen',
        avatar: '/api/placeholder/40/40'
      },
      tags: ['AI', 'Automation', 'Sales Tech'],
      featuredImage: '/api/placeholder/800/400',
      readTime: 6
    },
    {
      id: '3',
      title: 'Building a Data-Driven SDR Culture',
      excerpt: 'Why data-driven decision making is crucial for SDR success and how to implement it in your organization.',
      content: 'Full blog content here...',
      slug: 'data-driven-sdr-culture',
      publishedAt: '2024-01-05T09:15:00Z',
      author: {
        name: 'Eric Chen',
        avatar: '/api/placeholder/40/40'
      },
      tags: ['Data', 'Analytics', 'Culture'],
      featuredImage: '/api/placeholder/800/400',
      readTime: 5
    }
  ];

  // Get all unique tags
  const allTags = Array.from(new Set(posts.flatMap(post => post.tags)));

  // Filter posts based on search and tag
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || post.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="PypeFlow Blog - Sales Development Insights & Best Practices"
        description="Discover expert insights, strategies, and best practices for building high-performing sales development teams. Learn from industry leaders and scale your SDR operations."
        url="https://pypeflow.com/blog"
        type="website"
        tags={['SDR', 'Sales Development', 'Sales Strategy', 'Team Management', 'Revenue Growth']}
      />
      
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              PypeFlow <span className="text-blue-500">Blog</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Insights, strategies, and best practices for building high-performing sales development teams
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                !selectedTag
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
              }`}
            >
              All Posts
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedTag === tag
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                }`}
              >
                <Tag className="w-4 h-4 inline mr-1" />
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300 group"
              >
                {/* Featured Image */}
                {post.featuredImage && (
                  <div className="aspect-w-16 aspect-h-9 overflow-hidden">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <div className="p-6">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 text-xs font-medium rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="hover:text-blue-600 transition-colors"
                      onClick={() => trackBlogEngagement('click_title', post.title, post.slug)}
                    >
                      {post.title}
                    </Link>
                  </h2>

                {/* Excerpt */}
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    <span>{post.author.name}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{formatDate(post.publishedAt)}</span>
                  </div>
                </div>

                {/* Read Time */}
                <div className="text-sm text-gray-500 mb-4">
                  {post.readTime} min read
                </div>

                  {/* Read More Link */}
                  <Link
                    to={`/blog/${post.slug}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold transition-colors group-hover:bg-blue-50 px-3 py-2 rounded-lg"
                    onClick={() => trackBlogEngagement('click_read_more', post.title, post.slug)}
                  >
                    Read More
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* No Results */}
          {filteredPosts.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {posts.length === 0 ? 'No blog posts available' : 'No posts found'}
              </h3>
              <p className="text-gray-600 mb-4">
                {posts.length === 0 
                  ? 'Check your Strapi configuration or create some blog posts.'
                  : 'Try adjusting your search terms or filters'}
              </p>
              {posts.length === 0 && import.meta.env.VITE_STRAPI_URL && (
                <button
                  onClick={() => loadBlogPosts()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry Loading
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
