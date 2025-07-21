#!/bin/bash

# Build script for AI Contact Manager
# This script prepares the static site for deployment

echo "🚀 Building AI Contact Manager..."

# Create build directory
mkdir -p dist

# Copy main files
echo "📁 Copying files..."
cp index.html dist/
cp app.js dist/
cp style.css dist/
cp manifest.json dist/
cp netlify.toml dist/
cp _redirects dist/

# Copy additional files if they exist
if [ -f "favicon.ico" ]; then
    cp favicon.ico dist/
fi

if [ -f "robots.txt" ]; then
    cp robots.txt dist/
fi

if [ -f "sitemap.xml" ]; then
    cp sitemap.xml dist/
fi

# Manifest.json is now copied from source

# Add manifest link to HTML if not present
if ! grep -q "manifest.json" dist/index.html; then
    sed -i 's|</head>|    <link rel="manifest" href="manifest.json">\n</head>|' dist/index.html
fi

# Add viewport meta tag if not present
if ! grep -q "viewport" dist/index.html; then
    sed -i 's|</head>|    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n</head>|' dist/index.html
fi

echo "✅ Build complete! Files are in the 'dist' directory."
echo "📦 Ready for deployment to Netlify or any static hosting service."
echo ""
echo "To deploy:"
echo "1. Drag the 'dist' folder to Netlify"
echo "2. Or run: netlify deploy --dir=dist --prod"
echo ""
