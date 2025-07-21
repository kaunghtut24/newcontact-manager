# 🚀 Quick Start Guide

Get your AI Contact Manager up and running in minutes!

## 📋 Prerequisites

- A modern web browser (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- For local development: Python 3 or Node.js (optional)

## 🎯 Deploy to Netlify (2 minutes)

### Method 1: Drag & Drop (Easiest)
1. Visit [netlify.com](https://netlify.com) and sign up (free)
2. Run the build script: `./build.sh`
3. Drag the `dist` folder to Netlify's deploy area
4. 🎉 Your app is live!

### Method 2: Git Integration
1. Push this code to GitHub
2. Connect your GitHub repo to Netlify
3. Deploy automatically on every push

## 🖥️ Run Locally (30 seconds)

### Option 1: Python (No installation needed)
```bash
python3 -m http.server 3000
```
Open: http://localhost:3000

### Option 2: Node.js (If you have Node.js)
```bash
npm run start
```
Open: http://localhost:3000

## ✨ Features Ready to Use

- **📊 Dashboard**: Overview of your contacts
- **👥 Contact Management**: Add, edit, search contacts
- **📷 Business Card Scanning**: Upload card images for OCR
- **📁 Import/Export**: CSV, vCard, Excel support
- **🌙 Dark/Light Theme**: Automatic switching
- **💾 Local Storage**: All data stays in your browser

## 🔧 Customization

### Change App Name
Edit `index.html` line 6:
```html
<title>Your App Name</title>
```

### Modify Colors
Edit CSS variables in `style.css` starting at line 1:
```css
:root {
  --color-primary: #your-color;
}
```

### Add Analytics
Add tracking code before `</head>` in `index.html`

## 📱 Mobile Support

The app works perfectly on mobile devices:
- Responsive design
- Touch-friendly interface
- Camera access for card scanning
- Offline functionality

## 🆘 Need Help?

1. **App not loading?** Check browser console (F12)
2. **Card scanning not working?** Ensure HTTPS or localhost
3. **Data not saving?** Check if cookies/localStorage are enabled
4. **Deployment issues?** See `DEPLOYMENT.md`

## 🎉 You're Ready!

Your AI Contact Manager is now ready to use. Start by:
1. Adding your first contact
2. Trying the business card scanner
3. Exploring the import/export features

Enjoy managing your contacts with AI! 🤖
