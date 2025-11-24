# Documentation Media Guide

This guide explains how to structure demo videos and images for the documentation page.

## 📁 Folder Structure

```
src/
├── demo-video/
│   ├── manager/
│   │   ├── overview.webm              # Manager Dashboard Overview
│   │   ├── team-management.webm      # Team Management
│   │   ├── analytics.webm            # Analytics & Reports
│   │   ├── meetings.webm             # Team's Meetings
│   │   ├── clients.webm               # Client Management
│   │   ├── users.webm                 # User Management
│   │   ├── history.webm               # Meeting History
│   │   └── icp.webm                    # ICP Check
│   ├── sdr/
│   │   ├── dashboard.webm             # Dashboard Overview
│   │   ├── goals.webm                  # Goal Tracking
│   │   ├── meetings.webm              # Meeting Management
│   │   ├── analytics.webm              # Performance Analytics
│   │   ├── commissions.webm           # Commissions
│   │   └── history.webm                # Meeting History
│   └── client/
│       ├── overview.webm               # Overview
│       ├── meetings.webm               # Meetings
│       ├── calendar.webm               # Calendar View
│       ├── linkedin.webm                # LinkedIn Integration
│       ├── cold-calling.webm           # Cold Calling
│       └── analytics.webm              # Analytics
│
└── demo-images/
    ├── manager/
    │   ├── overview/
    │   │   ├── dashboard-screenshot.png
    │   │   ├── metrics-overview.png
    │   │   └── navigation.png
    │   ├── team-management/
    │   │   ├── sdr-performance.png
    │   │   ├── client-assignment.png
    │   │   └── goal-setting.png
    │   └── ...
    ├── sdr/
    │   ├── dashboard/
    │   │   ├── goal-tracking.png
    │   │   ├── client-cards.png
    │   │   └── meeting-lists.png
    │   └── ...
    └── client/
        ├── overview/
        │   ├── secure-access.png
        │   └── sdr-info.png
        └── ...
```

## 🎥 Video Guidelines

### Format & Quality
- **Format**: WebM (preferred) or MP4
- **Resolution**: 1920x1080 (Full HD) minimum
- **Aspect Ratio**: 16:9
- **Duration**: 15-60 seconds per video
- **File Size**: Keep under 10MB per video when possible

### Naming Convention
- Use kebab-case: `team-management.webm`
- Match the subsection ID from Documentation.tsx
- Be descriptive but concise

### Content Guidelines
1. **Start with a clear title card** (2-3 seconds)
   - Feature name
   - Brief description
   
2. **Show the actual feature** (10-50 seconds)
   - Navigate to the feature
   - Demonstrate key actions
   - Highlight important UI elements
   
3. **End with a summary** (2-3 seconds)
   - Key takeaway
   - Next steps (optional)

### Recording Tips
- Use screen recording software (OBS, QuickTime, Loom)
- Record at 60fps for smooth playback
- Use a consistent browser zoom level (100%)
- Hide personal/sensitive data
- Use demo data that's representative
- Add subtle cursor highlights if helpful
- Keep audio muted (or add background music)

## 🖼️ Image Guidelines

### Format & Quality
- **Format**: PNG (for screenshots) or WebP (for optimized images)
- **Resolution**: Match the actual UI resolution (1920x1080 or higher)
- **File Size**: Optimize to under 500KB when possible

### Naming Convention
- Use kebab-case: `goal-tracking.png`
- Be descriptive: `sdr-performance-card.png`
- Group related images in folders by subsection

### Content Guidelines
1. **Screenshots should be:**
   - Clear and high resolution
   - Cropped to relevant areas
   - Annotated if needed (arrows, labels)
   - Consistent styling

2. **Use images for:**
   - UI component close-ups
   - Step-by-step guides
   - Feature highlights
   - Before/after comparisons
   - Annotated workflows

## 📝 Documentation Integration

### Adding Videos
Videos are automatically detected if they match the subsection ID. Place them in:
- `src/demo-video/{section}/{subsection-id}.webm`

Example:
- Manager → Team Management → `src/demo-video/manager/team-management.webm`
- SDR → Goal Tracking → `src/demo-video/sdr/goals.webm`
- Client → Overview → `src/demo-video/client/overview.webm`

### Adding Images
Images are referenced in the documentation content. Place them in:
- `src/demo-images/{section}/{subsection-id}/{image-name}.png`

Then reference them in the documentation content object.

## 🎬 Recording Checklist

Before recording each video:
- [ ] Clear browser cache
- [ ] Use demo/test data
- [ ] Close unnecessary tabs
- [ ] Set browser to 100% zoom
- [ ] Hide bookmarks bar
- [ ] Use consistent window size
- [ ] Test audio (if adding narration)
- [ ] Check lighting (if showing face)

After recording:
- [ ] Trim unnecessary parts
- [ ] Add title card if needed
- [ ] Optimize file size
- [ ] Test playback in browser
- [ ] Verify naming matches subsection ID
- [ ] Place in correct folder

## 📊 Priority Order

### Phase 1: Core Features (High Priority)
1. **Manager**
   - Overview
   - Team Management
   - Analytics & Reports

2. **SDR**
   - Dashboard Overview
   - Goal Tracking
   - Meeting Management

3. **Client**
   - Overview
   - Meetings
   - Calendar View

### Phase 2: Secondary Features (Medium Priority)
- Manager: Meetings, Clients, History
- SDR: Analytics, Commissions, History
- Client: LinkedIn, Cold Calling, Analytics

### Phase 3: Advanced Features (Lower Priority)
- Manager: Users, ICP Check
- Any remaining features

## 🔧 Tools & Resources

### Screen Recording
- **OBS Studio** (Free, cross-platform)
- **QuickTime** (Mac, built-in)
- **Loom** (Free tier, easy sharing)
- **ScreenFlow** (Mac, paid)
- **Camtasia** (Windows/Mac, paid)

### Video Editing
- **DaVinci Resolve** (Free, professional)
- **iMovie** (Mac, free)
- **Shotcut** (Free, cross-platform)
- **Adobe Premiere** (Paid, professional)

### Image Editing
- **Figma** (Free, web-based)
- **Sketch** (Mac, paid)
- **Photoshop** (Paid)
- **GIMP** (Free, open-source)

### Optimization
- **HandBrake** (Video compression)
- **TinyPNG** (Image compression)
- **Squoosh** (Image optimization)

## 📋 Example Workflow

1. **Plan the video**
   - Write a brief script (30-60 seconds)
   - List key actions to demonstrate
   - Note important UI elements to highlight

2. **Record**
   - Start recording
   - Navigate to the feature
   - Perform key actions
   - Stop recording

3. **Edit**
   - Trim beginning/end
   - Add title card (optional)
   - Adjust speed if needed
   - Export as WebM

4. **Optimize**
   - Compress if needed
   - Test playback
   - Verify file size

5. **Deploy**
   - Place in correct folder
   - Verify naming matches subsection ID
   - Test in documentation page

## 🚀 Quick Start

1. **Create the folder structure** (if not exists):
   ```bash
   mkdir -p src/demo-video/{manager,sdr,client}
   mkdir -p src/demo-images/{manager,sdr,client}
   ```

2. **Record your first video**:
   - Open the feature in your browser
   - Start screen recording
   - Demonstrate the feature (30-60 seconds)
   - Save as `overview.webm` in the appropriate folder

3. **Test it**:
   - The documentation page will automatically detect and display it
   - Verify it plays correctly
   - Check file size and quality

## 💡 Tips

- **Consistency**: Use the same recording settings for all videos
- **Demo Data**: Use realistic but anonymized demo data
- **Updates**: Re-record videos when UI changes significantly
- **Accessibility**: Consider adding captions for important videos
- **Mobile**: Consider recording mobile views for responsive features
- **Performance**: Optimize videos to ensure fast page loads

