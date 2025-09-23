# Developer Login Guide

## 🔑 Developer Access

As the developer, you now have a special login that takes you directly to the Agency Management interface.

### Login Credentials
- **Email**: `jack.sun121601@gmail.com`
- **Password**: `asdfasdf`

### What Happens When You Login
1. **Direct Redirect**: Takes you straight to `/admin/agencies` (Agency Management page)
2. **Developer Badge**: Shows "Developer Mode" badge in the interface
3. **Full Access**: You can create, manage, and delete agencies
4. **Logout Button**: Easy logout button for convenience

## 🎯 How to Use

### 1. Access Agency Management
1. Go to `http://localhost:5174/login`
2. Enter your developer credentials
3. You'll be automatically redirected to the Agency Management page

### 2. Create New Agencies
1. Click "Create New Agency"
2. Fill in:
   - **Agency Name**: e.g., "Client ABC Sales Team"
   - **Subdomain**: e.g., "client-abc"
3. Click "Create Agency"

### 3. Manage Existing Agencies
- **View all agencies** in the table
- **Activate/Deactivate** agencies
- **Copy agency URLs** for sharing
- **Delete agencies** (if needed)

### 4. Test Agency URLs
After creating an agency, you can test it:
- **Demo Agency**: `http://localhost:5174?agency=demo`
- **New Agency**: `http://localhost:5174?agency=client-abc`

## 🔒 Security Features

- **Developer-only access**: Only your email can access agency management
- **Super admin privileges**: Full control over all agencies
- **Agency isolation**: Each agency has completely separate data
- **Secure logout**: Clears session and returns to login

## 🚀 Production Deployment

For production with `agency.pypeflow.com` domains:

1. **Set up wildcard DNS**: `*.pypeflow.com` → your server
2. **Deploy your app**
3. **Each agency gets**: `agency.pypeflow.com` automatically
4. **Share agency URLs** with clients

## 📝 Agency Management Features

### Create Agency
- Unique subdomain validation
- Agency name and settings
- Automatic URL generation

### Manage Agencies
- View all agencies in a table
- Activate/deactivate agencies
- Copy agency URLs
- Agency creation timestamps

### Agency URLs
- **Development**: `http://localhost:5174?agency=subdomain`
- **Production**: `https://subdomain.pypeflow.com`

## 🎉 Benefits

- **Scalable**: Create unlimited agencies
- **Isolated**: Complete data separation
- **Secure**: Developer-only management access
- **Easy**: Simple interface for agency management
- **Flexible**: Support for custom domains

## 🔧 Troubleshooting

### If you can't access Agency Management:
1. Check you're using the correct developer email
2. Clear browser cache/localStorage
3. Try logging out and back in

### If agency URLs don't work:
1. Check the subdomain is correct
2. Verify the agency is active
3. Check browser console for errors

### If you need to reset:
1. Logout using the logout button
2. Clear localStorage: `localStorage.clear()`
3. Login again with developer credentials
