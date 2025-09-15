import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
  canonicalUrl?: string;
}

export default function SEOHead({
  title = 'PypeFlow - SDR Meeting Tracker & Sales Development Platform',
  description = 'Build and scale high-performing SDR teams with PypeFlow. Track meetings, manage compensation, and drive revenue growth with our comprehensive sales development platform.',
  image = '/og-image.jpg',
  url = 'https://pypeflow.com',
  type = 'website',
  publishedTime,
  modifiedTime,
  author = 'Eric Chen',
  tags = [],
  canonicalUrl
}: SEOHeadProps) {
  const fullTitle = title.includes('PypeFlow') ? title : `${title} | PypeFlow`;
  const fullUrl = canonicalUrl || url;
  const fullImage = image.startsWith('http') ? image : `https://pypeflow.com${image}`;

  // JSON-LD structured data for better SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type === 'article' ? 'Article' : 'WebSite',
    name: fullTitle,
    description,
    url: fullUrl,
    image: fullImage,
    ...(type === 'article' && {
      author: {
        '@type': 'Person',
        name: author
      },
      publisher: {
        '@type': 'Organization',
        name: 'PypeFlow',
        logo: {
          '@type': 'ImageObject',
          url: 'https://pypeflow.com/logo.png'
        }
      },
      datePublished: publishedTime,
      dateModified: modifiedTime || publishedTime,
      keywords: tags.join(', ')
    })
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={tags.join(', ')} />
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="PypeFlow" />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      
      {/* Article-specific meta tags */}
      {type === 'article' && publishedTime && (
        <>
          <meta property="article:published_time" content={publishedTime} />
          <meta property="article:author" content={author} />
          {tags.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
