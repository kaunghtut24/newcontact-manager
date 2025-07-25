# AI Contact Manager

A modern, AI-powered contact management system with business card scanning capabilities. Built as a static web application that can be deployed to Netlify.

## Features

- 📊 **Dashboard** - Overview of contacts and quick actions
- 👥 **Contact Management** - Add, edit, delete, and organize contacts
- 📷 **Business Card Scanning** - OCR-powered extraction from business card images
- 📱 **Mobile Camera Access** - Direct camera capture for business cards on mobile
- 📁 **Import/Export** - Support for CSV, vCard, and Excel formats
- 🔍 **Search & Filter** - Find contacts quickly by name, company, or category
- 🌙 **Dark/Light Theme** - Automatic theme switching
- 💾 **Local Storage** - All data stored locally using IndexedDB
- 📱 **Mobile Optimized** - Touch-friendly interface with swipe gestures
- 🚀 **PWA Ready** - Installable as a Progressive Web App
- 🤖 **AI Enhancement** - LLM-powered OCR validation for improved accuracy

## 🤖 AI Enhancement Features

The AI Contact Manager includes optional LLM integration that dramatically improves OCR accuracy:

### Before AI Enhancement
```javascript
// Basic OCR might extract:
{
  firstName: "JOHN",           // ❌ All caps
  lastName: "",                // ❌ Missing
  company: "SMITH",            // ❌ Wrong field
  jobTitle: "SENIOR",          // ❌ Incomplete
}
```

### After AI Enhancement
```javascript
// AI-corrected extraction:
{
  firstName: "John",                          // ✅ Proper case
  lastName: "Smith",                         // ✅ Correctly extracted
  company: "Aminia Hospitality Pvt. Ltd",   // ✅ Complete company name
  jobTitle: "Senior Director",               // ✅ Full title
}
```

### Supported LLM Providers
- **OpenAI** (GPT-3.5, GPT-4) - Best quality
- **OpenRouter** (Multiple models) - Best cost/quality ratio
- **Together AI** (Llama, etc.) - Fastest & cheapest
- **Anthropic** (Claude) - High quality alternative

### Cost Comparison
| Provider | Cost per Business Card | Setup Difficulty |
|----------|----------------------|------------------|
| OpenRouter | ~$0.0005 | Easy |
| Together AI | ~$0.0002 | Easy |
| OpenAI | ~$0.001 | Easy |
| Anthropic | ~$0.0008 | Medium |

## Technologies Used

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **OCR**: Tesseract.js for business card text extraction
- **AI Enhancement**: OpenAI-compatible LLM integration for improved OCR accuracy
- **Storage**: IndexedDB for local data persistence
- **File Processing**: SheetJS for Excel import/export
- **Deployment**: Netlify, Vercel, Railway, Render static hosting

## Local Development

### Prerequisites
- Node.js 16+ (for development server)

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with live reload
- `npm run serve` - Serve on port 8080
- `npm run preview` - Preview build on port 4173

## 🚀 Deployment with AI Enhancement

The AI Contact Manager supports LLM integration for dramatically improved OCR accuracy. Set up environment variables for secure API key management.

### Quick Deploy to Netlify

1. **Get an API key** from your preferred LLM provider:
   - [OpenAI](https://platform.openai.com) (Recommended for quality)
   - [OpenRouter](https://openrouter.ai) (Recommended for cost)
   - [Together AI](https://api.together.xyz) (Fastest & cheapest)

2. **Add environment variable** in Netlify:
   ```
   LLM_API_KEY=your-api-key-here
   ```

3. **Deploy** - LLM will be automatically enabled!

### 📚 Deployment Guides

- **[🚀 QUICK_DEPLOY.md](QUICK_DEPLOY.md)** - Fast setup for common scenarios
- **[📖 DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Complete deployment guide
- **[🔧 TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions
- **[⚙️ ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)** - Environment variables reference

### Supported Platforms

| Platform | Guide | Auto-Deploy | Environment Variables |
|----------|-------|-------------|----------------------|
| **Netlify** | [Quick Deploy](QUICK_DEPLOY.md#netlify-most-popular) | ✅ | ✅ |
| **Vercel** | [Deployment Guide](DEPLOYMENT_GUIDE.md#vercel-deployment) | ✅ | ✅ |
| **Railway** | [Deployment Guide](DEPLOYMENT_GUIDE.md#railway-deployment) | ✅ | ✅ |
| **Render** | [Deployment Guide](DEPLOYMENT_GUIDE.md#render-deployment) | ✅ | ✅ |

## Deployment to Netlify

### Option 1: Drag & Drop
1. Build your project (if needed)
2. Drag the project folder to Netlify's deploy area
3. Your site will be live instantly!

### Option 2: Git Integration
1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repository to Netlify
3. Set build settings:
   - **Build command**: `echo 'Static site ready'`
   - **Publish directory**: `.` (root directory)
4. Deploy!

### Option 3: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to a draft URL
netlify deploy

# Deploy to production
netlify deploy --prod
```

## Configuration

The `netlify.toml` file includes:
- Security headers
- Client-side routing support
- Cache optimization
- Content Security Policy

## Browser Support

### Desktop
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Mobile
- iOS Safari 13+ (with camera access)
- Android Chrome 80+ (with camera access)
- Mobile Firefox 75+

## Mobile Features

- **Touch-Friendly Interface**: 44px minimum touch targets
- **Swipe Gestures**: Swipe to open/close mobile menu
- **Camera Integration**: Direct camera access for business card scanning
- **PWA Support**: Install as native-like app on mobile devices
- **Responsive Design**: Optimized for all screen sizes
- **Touch Feedback**: Visual feedback for all interactions

## Privacy & Security

- All data is stored locally in your browser
- No data is sent to external servers
- Business card images are processed locally using Tesseract.js
- Secure headers configured for production deployment

## 🚀 Quick Deploy to Netlify

### Option 1: One-Click Deploy
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/kaunghtut24/newcontact-manager)

### Option 2: Manual Deploy
1. Run the build script: `./build.sh`
2. Drag the `dist` folder to [netlify.com](https://netlify.com)
3. Your app is live!

## 📁 Project Structure

```
ai-contact-manager/
├── index.html          # Main application
├── app.js             # Core functionality
├── style.css          # Responsive styles
├── manifest.json      # PWA configuration
├── netlify.toml       # Deployment config
├── _redirects         # SPA routing
├── build.sh           # Build script
├── server.js          # Local dev server
├── package.json       # Dependencies
├── README.md          # Documentation
├── DEPLOYMENT.md      # Deploy guide
├── MOBILE_GUIDE.md    # Mobile features
├── QUICKSTART.md      # Quick start
└── dist/              # Built files
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly on mobile and desktop
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Submit a pull request

## 📄 License

MIT License - Feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- [Tesseract.js](https://tesseract.projectnaptha.com/) for OCR functionality
- [SheetJS](https://sheetjs.com/) for Excel file processing
- Modern web APIs for camera and file access
