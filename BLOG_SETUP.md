# Blog Setup Guide

This guide will help you set up the Strapi blog integration for PypeFlow.

## 🚀 Quick Start

### Step 1: Deploy Strapi Backend

#### Option A: Strapi Cloud (Recommended)
1. Go to [https://cloud.strapi.io](https://cloud.strapi.io)
2. Sign up for a free account
3. Create a new project
4. Choose "Blog" template or start from scratch
5. Note your Strapi URL (e.g., `https://your-project.strapi.app`)

#### Option B: Railway (Free Tier)
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Create new project: `railway init`
4. Deploy: `railway up`
5. Note your Railway URL

### Step 2: Configure Content Types in Strapi

1. **Login to Strapi Admin Panel**
   - Go to your Strapi URL + `/admin`
   - Create admin account

2. **Create Content Types:**

   **Blog Post:**
   - `title` (Text, Short text, Required)
   - `slug` (Text, Short text, Required, Unique)
   - `excerpt` (Text, Long text)
   - `content` (Rich text, Required)
   - `publishedAt` (Date time)
   - `readTime` (Number, Integer)
   - `featuredImage` (Media, Single media)
   - `author` (Relation, Many-to-one with Author)
   - `tags` (Relation, Many-to-many with Tag)

   **Author:**
   - `name` (Text, Short text, Required)
   - `bio` (Text, Long text)
   - `avatar` (Media, Single media)

   **Tag:**
   - `name` (Text, Short text, Required)
   - `slug` (Text, Short text, Required, Unique)

3. **Configure API Permissions:**
   - Go to Settings → Users & Permissions Plugin → Roles
   - Edit "Public" role
   - Enable "find" and "findOne" for Blog Post, Author, and Tag

### Step 3: Configure Environment Variables

Add to your `.env` file:

```env
VITE_STRAPI_URL=https://your-strapi-url.com
```

### Step 4: Test the Integration

1. Start your development server: `npm run dev`
2. Visit `http://localhost:5174/blog`
3. You should see the blog page with mock data

### Step 5: Create Your First Blog Post

1. Go to your Strapi admin panel
2. Create an Author entry for Eric
3. Create some Tags
4. Create a Blog Post
5. Publish it
6. Refresh your blog page to see the real data

## 📝 How Eric Can Write Blogs

1. **Login to Strapi Admin** (bookmark this URL)
2. **Create New Blog Post:**
   - Click "Content Manager" → "Blog Post" → "Create new entry"
   - Fill in title, slug, excerpt, content
   - Upload featured image
   - Select author and tags
   - Set read time
   - Click "Save" then "Publish"

3. **The blog post will automatically appear** on your website!

## 🎨 Strapi Admin Features Eric Will Love

- **Rich Text Editor** - Similar to WordPress
- **Media Library** - Easy image management
- **Draft System** - Save drafts before publishing
- **Preview Mode** - See how posts look before publishing
- **SEO Fields** - Meta descriptions, etc.
- **Bulk Operations** - Manage multiple posts at once

## 🔧 Troubleshooting

### Blog Not Loading?
- Check your `VITE_STRAPI_URL` environment variable
- Ensure Strapi is running and accessible
- Check browser console for errors

### Images Not Showing?
- Make sure Strapi media permissions are set to public
- Check image URLs in Strapi admin

### Posts Not Appearing?
- Ensure posts are published (not just saved)
- Check API permissions in Strapi
- Verify content type relationships

## 🚀 Production Deployment

### Vercel Environment Variables
Add to your Vercel project settings:
```
VITE_STRAPI_URL=https://your-production-strapi-url.com
```

### Strapi Production
- Use Strapi Cloud for production
- Or deploy to Railway/Render with proper database
- Set up proper CORS settings
- Configure media storage (AWS S3, Cloudinary, etc.)

## 📚 Next Steps

1. **Customize the blog design** in `src/pages/Blog.tsx`
2. **Add more content types** (Categories, Comments, etc.)
3. **Set up SEO** with proper meta tags
4. **Add search functionality**
5. **Integrate with analytics** (Google Analytics, etc.)

## 🆘 Need Help?

- Strapi Documentation: https://docs.strapi.io
- Strapi Community: https://forum.strapi.io
- PypeFlow Support: [Your contact info]
