import React, { useState, useEffect } from 'react';
import { strapiService } from '../services/strapi';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export default function Sitemap() {
  const [sitemap, setSitemap] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateSitemap();
  }, []);

  const generateSitemap = async () => {
    try {
      setLoading(true);
      
      // Static pages
      const staticPages: SitemapUrl[] = [
        {
          loc: 'https://pypeflow.com',
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 1.0
        },
        {
          loc: 'https://pypeflow.com/blog',
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'daily',
          priority: 0.9
        },
        {
          loc: 'https://pypeflow.com/login',
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'monthly',
          priority: 0.5
        }
      ];

      // Dynamic blog posts from Strapi
      let blogPages: SitemapUrl[] = [];
      try {
        const blogResponse = await strapiService.getBlogPosts(1, 100); // Get up to 100 posts
        blogPages = blogResponse.data.map((post: any) => ({
          loc: `https://pypeflow.com/blog/${post.attributes.slug}`,
          lastmod: new Date(post.attributes.publishedAt).toISOString().split('T')[0],
          changefreq: 'monthly' as const,
          priority: 0.8
        }));
      } catch (error) {
        console.warn('Could not fetch blog posts for sitemap:', error);
      }

      const allPages = [...staticPages, ...blogPages];
      
      // Generate XML sitemap
      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

      setSitemap(sitemapXml);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      setSitemap('Error generating sitemap');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Generating sitemap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">XML Sitemap</h1>
          <p className="text-gray-600 mb-6">
            This sitemap helps search engines discover and index your pages.
          </p>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            {sitemap}
          </pre>
        </div>
      </div>
    </div>
  );
}
