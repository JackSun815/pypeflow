import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Tag, Clock } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  slug: string;
  publishedAt: string;
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
      loadBlogPost(slug);
    }
  }, [slug]);

  const loadBlogPost = async (slug: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Replace with actual Strapi API call
      const response = await fetch(`${import.meta.env.VITE_STRAPI_URL}/api/blog-posts?filters[slug][$eq]=${slug}&populate=*`);
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const postData = data.data[0];
        const formattedPost: BlogPost = {
          id: postData.id,
          title: postData.attributes.title,
          content: postData.attributes.content,
          slug: postData.attributes.slug,
          publishedAt: postData.attributes.publishedAt,
          author: {
            name: postData.attributes.author?.data?.attributes?.name || 'Eric Chen',
            avatar: postData.attributes.author?.data?.attributes?.avatar?.url,
            bio: postData.attributes.author?.data?.attributes?.bio
          },
          tags: postData.attributes.tags?.data?.map((tag: any) => tag.attributes.name) || [],
          featuredImage: postData.attributes.featuredImage?.url,
          readTime: postData.attributes.readTime || 5
        };
        setPost(formattedPost);
      } else {
        setError('Post not found');
      }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to="/blog"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
              >
                <Tag className="w-3 h-3 inline mr-1" />
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              <span>{post.author.name}</span>
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

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
          />
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* Author Bio */}
        {post.author.bio && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start">
              {post.author.avatar && (
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-16 h-16 rounded-full mr-4"
                />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  About {post.author.name}
                </h3>
                <p className="text-gray-600">{post.author.bio}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
