import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, Search, Tag } from 'lucide-react';

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
    loadBlogPosts();
  }, []);

  const loadBlogPosts = async () => {
    try {
      setLoading(true);
      // Replace with actual Strapi API call
      const response = await fetch(`${import.meta.env.VITE_STRAPI_URL}/api/blog-posts?populate=*&sort=publishedAt:desc`);
      const data = await response.json();
      
      const formattedPosts = data.data.map((post: any) => ({
        id: post.id,
        title: post.attributes.title,
        excerpt: post.attributes.excerpt,
        content: post.attributes.content,
        slug: post.attributes.slug,
        publishedAt: post.attributes.publishedAt,
        author: {
          name: post.attributes.author?.data?.attributes?.name || 'Eric Chen',
          avatar: post.attributes.author?.data?.attributes?.avatar?.url
        },
        tags: post.attributes.tags?.data?.map((tag: any) => tag.attributes.name) || [],
        featuredImage: post.attributes.featuredImage?.url,
        readTime: post.attributes.readTime || 5
      }));
      
      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error loading blog posts:', error);
      // Fallback to mock data for development
      setPosts(getMockPosts());
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              PypeFlow Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Insights, strategies, and best practices for building high-performing sales development teams
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !selectedTag
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Posts
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === tag
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Tag className="w-4 h-4 inline mr-1" />
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              {/* Featured Image */}
              {post.featuredImage && (
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              <div className="p-6">
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.slice(0, 2).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h2 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                  <Link
                    to={`/blog/${post.slug}`}
                    className="hover:text-blue-600 transition-colors"
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
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Read More
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* No Results */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
