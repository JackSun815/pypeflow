# Documentation Media Quick Start

## 📋 Summary

Your documentation page now supports **videos** and **images** organized by Manager, SDR, and Client sections.

## 🎯 How It Works

### Videos
- **Automatic Detection**: Videos are automatically displayed at the top of each documentation subsection
- **Naming**: Videos must be named to match the subsection ID
- **Location**: `src/demo-video/{section}/{subsection-id}.webm`

### Images
- **Manual Placement**: Images are added to specific sections in the content object
- **Naming**: Use descriptive names, referenced in the content
- **Location**: `src/demo-images/{section}/{subsection-id}/{image-name}.png`

## 🚀 Quick Steps to Add Media

### Adding a Video

1. **Record your video** (15-60 seconds, WebM format)
2. **Name it correctly**: `overview.webm`, `team-management.webm`, etc.
3. **Place it**: `src/demo-video/manager/overview.webm`
4. **Import it** in `Documentation.tsx`:
   ```typescript
   import managerOverviewVideo from '../demo-video/manager/overview.webm';
   ```
5. **Add to videoPaths**:
   ```typescript
   'manager-overview': managerOverviewVideo,
   ```
6. **Done!** The video will automatically appear on that documentation page

### Adding an Image

1. **Create your image** (PNG or WebP, optimized)
2. **Name it descriptively**: `dashboard-screenshot.png`
3. **Place it**: `src/demo-images/manager/overview/dashboard-screenshot.png`
4. **Import it** in `Documentation.tsx`:
   ```typescript
   import dashboardImg from '../demo-images/manager/overview/dashboard-screenshot.png';
   ```
5. **Add to imagePaths**:
   ```typescript
   'manager-overview-dashboard': dashboardImg,
   ```
6. **Add to content section**:
   ```typescript
   {
     title: 'Dashboard Overview',
     content: '...',
     images: [
       {
         name: 'dashboard', // Matches the key in imagePaths
         alt: 'Dashboard Screenshot',
         caption: 'The main dashboard view'
       }
     ]
   }
   ```

## 📁 Current Folder Structure

```
src/
├── demo-video/
│   ├── manager/          ✅ Has 6 videos (1.webm - 6.webm)
│   ├── sdr/             ⚠️  Empty - ready for videos
│   └── client/           ⚠️  Empty - ready for videos
│
└── demo-images/
    ├── manager/          ✅ Folders created
    │   ├── overview/
    │   ├── team-management/
    │   └── ...
    ├── sdr/             ✅ Folders created
    └── client/          ✅ Folders created
```

## 🎬 Recommended Recording Order

### Phase 1: Core Features (Start Here)
1. **Manager → Overview** (most important)
2. **SDR → Dashboard** (most important)
3. **Client → Overview** (most important)

### Phase 2: Key Features
4. **Manager → Team Management**
5. **SDR → Goal Tracking**
6. **SDR → Meeting Management**
7. **Client → Meetings**

### Phase 3: Secondary Features
- Manager: Analytics, Meetings, Clients
- SDR: Analytics, Commissions, History
- Client: Calendar, LinkedIn, Analytics

## 📝 Example: Adding Manager Overview Video

```typescript
// 1. Import the video
import managerOverviewVideo from '../demo-video/manager/overview.webm';

// 2. Add to videoPaths
const videoPaths: Record<string, string> = {
  'manager-overview': managerOverviewVideo,
  // ... other videos
};

// 3. That's it! The video will show automatically
```

## 🖼️ Example: Adding an Image to a Section

```typescript
// 1. Import the image
import dashboardImg from '../demo-images/manager/overview/dashboard.png';

// 2. Add to imagePaths
const imagePaths: Record<string, string> = {
  'manager-overview-dashboard': dashboardImg,
};

// 3. Add to content section
overview: {
  sections: [
    {
      title: 'Dashboard Overview',
      content: 'The dashboard shows...',
      images: [
        {
          name: 'dashboard',
          alt: 'Dashboard Screenshot',
          caption: 'Main dashboard view'
        }
      ]
    }
  ]
}
```

## ✅ Checklist

Before recording:
- [ ] Review the feature you're documenting
- [ ] Prepare demo data if needed
- [ ] Clear browser cache
- [ ] Set browser to 100% zoom

After recording:
- [ ] Trim unnecessary parts
- [ ] Optimize file size
- [ ] Name file correctly (matches subsection ID)
- [ ] Place in correct folder
- [ ] Import in Documentation.tsx
- [ ] Add to videoPaths/imagePaths
- [ ] Test in documentation page

## 🆘 Troubleshooting

**Video not showing?**
- Check file name matches subsection ID
- Verify import path is correct
- Check videoPaths key format: `{section}-{subsection}`
- Ensure file is WebM format

**Image not showing?**
- Check imagePaths key format: `{section}-{subsection}-{imageName}`
- Verify the `name` in images array matches the key
- Check import path is correct

**File too large?**
- Compress video with HandBrake
- Optimize images with TinyPNG or Squoosh
- Consider using WebP for images

## 📚 More Information

See `DOCUMENTATION_MEDIA_GUIDE.md` for detailed guidelines on:
- Video recording best practices
- Image creation tips
- File optimization
- Tools and resources

