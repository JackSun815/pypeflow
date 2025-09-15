const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiBlogPost {
  id: number;
  attributes: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    publishedAt: string;
    readTime: number;
    // SEO fields
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    // Social media fields
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: {
      url: string;
      alternativeText?: string;
    };
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: {
      url: string;
      alternativeText?: string;
    };
    featuredImage?: {
      url: string;
      alternativeText?: string;
    };
    author?: {
      data: {
        id: number;
        attributes: {
          name: string;
          bio?: string;
          avatar?: {
            url: string;
          };
        };
      };
    };
    tags?: {
      data: Array<{
        id: number;
        attributes: {
          name: string;
          slug: string;
        };
      }>;
    };
  };
}

export class StrapiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = STRAPI_URL;
  }

  private async fetchAPI<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async getBlogPosts(page = 1, pageSize = 10): Promise<StrapiResponse<StrapiBlogPost[]>> {
    return this.fetchAPI<StrapiResponse<StrapiBlogPost[]>>(
      `/blog-posts?populate=*&sort=publishedAt:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
    );
  }

  async getBlogPostBySlug(slug: string): Promise<StrapiResponse<StrapiBlogPost[]>> {
    return this.fetchAPI<StrapiResponse<StrapiBlogPost[]>>(
      `/blog-posts?filters[slug][$eq]=${slug}&populate=*`
    );
  }

  async getBlogPostById(id: number): Promise<StrapiResponse<StrapiBlogPost>> {
    return this.fetchAPI<StrapiResponse<StrapiBlogPost>>(
      `/blog-posts/${id}?populate=*`
    );
  }

  async getTags(): Promise<StrapiResponse<any[]>> {
    return this.fetchAPI<StrapiResponse<any[]>>('/tags');
  }
}

export const strapiService = new StrapiService();
