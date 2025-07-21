# Deployment Guide for AI Contact Manager

This guide covers multiple deployment options for your AI Contact Manager static web application.

## 🚀 Netlify Deployment (Recommended)

### Option 1: Drag & Drop (Fastest)
1. Visit [netlify.com](https://netlify.com)
2. Sign up or log in
3. Drag your project folder to the deploy area
4. Your site will be live instantly!

### Option 2: Git Integration (Best for ongoing development)
1. Push your code to GitHub, GitLab, or Bitbucket
2. Go to [netlify.com](https://netlify.com) and click "New site from Git"
3. Connect your repository
4. Configure build settings:
   - **Build command**: Leave empty (or `echo 'Static site ready'`)
   - **Publish directory**: `.` (root directory)
   - **Branch**: `main` or `master`
5. Click "Deploy site"

### Option 3: Netlify CLI
```bash
# Install Netlify CLI (requires Node.js)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to a draft URL for testing
netlify deploy

# Deploy to production
netlify deploy --prod
```

## 🌐 Other Static Hosting Options

### Vercel
1. Visit [vercel.com](https://vercel.com)
2. Import your Git repository
3. Deploy with default settings

### GitHub Pages
1. Push code to GitHub repository
2. Go to repository Settings > Pages
3. Select source branch (usually `main`)
4. Your site will be available at `https://username.github.io/repository-name`

### Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init hosting

# Deploy
firebase deploy
```

## 🖥️ Local Development

### Using Python (No dependencies required)
```bash
# Python 3
python3 -m http.server 3000

# Python 2
python -m SimpleHTTPServer 3000
```

### Using Node.js (if available)
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or use the custom server
node server.js
```

### Using PHP (if available)
```bash
php -S localhost:3000
```

## 📁 Project Structure

```
ai-contact-manager/
├── index.html          # Main application file
├── app.js             # Application logic
├── style.css          # Styles and themes
├── server.js          # Local development server
├── package.json       # Node.js configuration
├── netlify.toml       # Netlify configuration
├── _redirects         # Netlify redirects
├── README.md          # Project documentation
├── DEPLOYMENT.md      # This file
└── .gitignore         # Git ignore rules
```

## ⚙️ Configuration Files

### netlify.toml
- Configures build settings
- Sets up security headers
- Handles client-side routing
- Optimizes caching

### _redirects
- Backup redirect rules for Netlify
- Ensures SPA routing works correctly

### package.json
- Defines development scripts
- Lists dependencies for local development
- Provides project metadata

## 🔒 Security Features

The deployment includes:
- Content Security Policy (CSP)
- XSS Protection
- Frame Options
- Content Type Options
- Referrer Policy

## 🎯 Performance Optimizations

- Static asset caching (1 year)
- HTML no-cache for updates
- Gzip compression (automatic on most platforms)
- Optimized image formats supported

## 🐛 Troubleshooting

### Common Issues

1. **404 errors on refresh**
   - Ensure `_redirects` file is present
   - Check `netlify.toml` redirect configuration

2. **CSP violations**
   - Check browser console for errors
   - Adjust CSP in `netlify.toml` if needed

3. **Local development issues**
   - Use `python3 -m http.server 3000` as fallback
   - Ensure files are in correct directory structure

### Testing Deployment

1. Test all navigation routes
2. Verify business card scanning works
3. Check import/export functionality
4. Test theme switching
5. Verify data persistence

## 📱 Mobile Compatibility

The application is fully responsive and works on:
- iOS Safari 13+
- Android Chrome 80+
- Mobile Firefox 75+

## 🔄 Updates

To update your deployed site:
1. Make changes to your code
2. Push to Git (for Git-connected deployments)
3. Or drag new files to Netlify (for manual deployments)

## 📊 Analytics (Optional)

Add analytics by including tracking code in `index.html`:
- Google Analytics
- Netlify Analytics
- Plausible Analytics

## 🆘 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all files are uploaded correctly
3. Test locally first
4. Check hosting platform documentation
