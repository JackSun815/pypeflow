import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Tag, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SEOHead from '../components/SEOHead';
import Header from '../components/Header';
import { trackBlogEngagement } from '../components/GoogleAnalytics';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  slug: string;
  publishedAt: string;
  excerpt?: string;
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  tags: string[];
  featuredImage?: string;
  readTime: number;
}

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      // Always reload when slug changes (including when navigating back)
      loadBlogPost(slug);
    }
  }, [slug]);

  const loadBlogPost = async (slug: string) => {
    try {
      setLoading(true);
      setError(null);
      setPost(null); // Clear previous post to avoid showing stale data
      
      const strapiUrl = import.meta.env.VITE_STRAPI_URL;
      if (!strapiUrl) {
        setError('Strapi URL not configured');
        setLoading(false);
        return;
      }
      
      console.log('Loading blog post from Strapi...', { strapiUrl, slug, encodedSlug: encodeURIComponent(slug) });
      
      // Create a fetch with timeout using AbortController
      // Increased timeout to 15 seconds for slower connections
      const fetchWithTimeout = (url: string, timeout = 15000): Promise<Response> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        return fetch(url, { signal: controller.signal })
          .finally(() => clearTimeout(timeoutId));
      };
      
      // URL encode the slug to handle special characters
      const encodedSlug = encodeURIComponent(slug);
      
      // Try both possible endpoints - articles and blog-posts
      let response;
      let data;
      const timeout = 15000; // 15 second timeout
      
      try {
        // First try the articles endpoint with full populate to get all content
        const articlesUrl = `${strapiUrl}/api/articles?filters[slug][$eq]=${encodedSlug}&populate=*`;
        console.log('Trying articles endpoint:', articlesUrl);
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
          // Fallback to blog-posts endpoint with full populate to get all content
          const blogPostsUrl = `${strapiUrl}/api/blog-posts?filters[slug][$eq]=${encodedSlug}&populate=*`;
          console.log('Trying blog-posts endpoint:', blogPostsUrl);
          response = await fetchWithTimeout(blogPostsUrl, timeout);
          if (!response.ok) {
            // Log the actual response for debugging
            const errorText = await response.text().catch(() => '');
            console.error('Blog posts endpoint error:', response.status, errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          data = await response.json();
          console.log('Successfully loaded from /api/blog-posts');
        } catch (blogPostsError: any) {
          if (blogPostsError.name === 'AbortError' || blogPostsError.message === 'Request timeout') {
            setError('Request timed out after 15 seconds. Please check your Strapi URL and try again.');
          } else {
            setError(`Failed to load blog post: ${blogPostsError.message || 'Unknown error'}`);
          }
          setLoading(false);
          return;
        }
      }
      
      console.log('Strapi response data:', data);
      
      if (!data || !data.data) {
        console.error('Invalid response structure:', data);
        setError('Invalid response from Strapi API');
        setLoading(false);
        return;
      }
      
      if (data.data.length === 0) {
        console.warn('No blog post found with slug:', slug);
        setError('Post not found');
        setLoading(false);
        return;
      }
      
      const postData = data.data[0];
      console.log('Post data:', postData);
      
      // Handle both Strapi v4 structure (direct properties) and v3 structure (attributes)
      const isV4 = !postData.attributes;
      const title = isV4 ? postData.title : postData.attributes?.title;
      const slugValue = isV4 ? postData.slug : postData.attributes?.slug;
      const publishedAt = isV4 ? postData.publishedAt : postData.attributes?.publishedAt;
      const description = isV4 ? postData.description : postData.attributes?.description;
      const cover = isV4 ? postData.cover : postData.attributes?.cover;
      const author = isV4 ? postData.author : postData.attributes?.author;
      const category = isV4 ? postData.category : postData.attributes?.category;
      const blocks = isV4 ? postData.blocks : postData.attributes?.blocks;
      
      // Handle nested populate structure (cover.data, author.data, etc.)
      const coverImage = cover?.data || cover;
      const authorData = author?.data || author;
      const categoryData = category?.data || category;
        
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

        // Extract author info (handle nested structure)
        const authorName = authorData?.name || authorData?.attributes?.name || 'Eric Chen';
        const authorAvatar = authorData?.avatar?.data?.attributes?.url || 
                           authorData?.avatar?.url || 
                           authorData?.attributes?.avatar?.data?.attributes?.url ||
                           authorData?.attributes?.avatar?.url;
        const authorBio = authorData?.bio || authorData?.attributes?.bio;
        
        // Extract category/tags
        const categoryName = categoryData?.name || categoryData?.attributes?.name;
        const tags = categoryName ? [categoryName] : [];
        
        // Extract cover image
        const coverUrl = coverImage?.attributes?.url || 
                        coverImage?.url || 
                        cover?.data?.attributes?.url ||
                        cover?.url;

        const formattedPost: BlogPost = {
          id: postData.id.toString(),
          title: title || 'Untitled',
          content: content || description || 'No content available',
          slug: slugValue || slug,
          publishedAt: publishedAt || new Date().toISOString(),
          excerpt,
          author: {
            name: authorName,
            avatar: getImageUrl(authorAvatar),
            bio: authorBio
          },
          tags,
          featuredImage: getImageUrl(coverUrl),
          readTime: 5 // Default read time
        };
        
        setPost(formattedPost);
        // Track blog post view
        trackBlogEngagement('view_post', formattedPost.title, formattedPost.slug);
    } catch (error) {
      console.error('Error loading blog post:', error);
      setError('Failed to load blog post');
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The blog post you are looking for does not exist.'}</p>
          <Link
            to="/blog"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={post.title}
        description={post.excerpt || post.content.substring(0, 160) + '...'}
        image={post.featuredImage}
        url={`https://pypeflow.com/blog/${post.slug}`}
        type="article"
        publishedTime={post.publishedAt}
        author={post.author.name}
        tags={post.tags}
      />
      
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/blog"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-3 mb-6">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="px-4 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 text-sm font-medium rounded-full"
              >
                <Tag className="w-3 h-3 inline mr-1" />
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-gray-600 mb-8">
            <div className="flex items-center gap-6">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                <span className="font-medium">{post.author.name}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{formatDate(post.publishedAt)}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>{post.readTime} min read</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {post.featuredImage && (
        <section className="py-8 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover rounded-xl shadow-lg"
            />
          </div>
        </section>
      )}

      {/* Content */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12">
            <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-ul:text-gray-700 prose-li:text-gray-700 prose-li:leading-relaxed">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({children}) => <h1 className="text-3xl font-bold text-gray-900 mb-6 mt-8 first:mt-0">{children}</h1>,
                h2: ({children}) => <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8 first:mt-0">{children}</h2>,
                h3: ({children}) => <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6 first:mt-0">{children}</h3>,
                p: ({children}) => <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>,
                ul: ({children}) => <ul className="mb-4 ml-6 list-disc text-gray-700">{children}</ul>,
                ol: ({children}) => <ol className="mb-4 ml-6 list-decimal text-gray-700">{children}</ol>,
                li: ({children}) => <li className="mb-2 text-gray-700">{children}</li>,
                strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                em: ({children}) => <em className="italic text-gray-800">{children}</em>,
                blockquote: ({children}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4">{children}</blockquote>,
                hr: () => <hr className="my-8 border-gray-300" />,
                code: ({children}) => <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">{children}</code>,
                pre: ({children}) => <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4">{children}</pre>
              }}
            >
              {post.content}
            </ReactMarkdown>
            </div>
          </div>

          {/* Author Bio */}
          {post.author.bio && (
            <div className="mt-12 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-8 border border-blue-100">
              <div className="flex items-start">
                {post.author.avatar && (
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-16 h-16 rounded-full mr-6 border-2 border-white shadow-md"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    About {post.author.name}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{post.author.bio}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
