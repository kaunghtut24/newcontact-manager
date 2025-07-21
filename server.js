#!/usr/bin/env node

/**
 * Simple HTTP server for local development
 * Serves static files and handles client-side routing
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }

    res.writeHead(200, { 
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000'
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  // Remove leading slash
  if (pathname.startsWith('/')) {
    pathname = pathname.substring(1);
  }

  // Default to index.html for root path
  if (pathname === '' || pathname === '/') {
    pathname = 'index.html';
  }

  const filePath = path.join(__dirname, pathname);

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File doesn't exist, serve index.html for client-side routing
      serveFile(path.join(__dirname, 'index.html'), res);
    } else {
      // Check if it's a directory
      fs.stat(filePath, (err, stats) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal server error');
          return;
        }

        if (stats.isDirectory()) {
          // Try to serve index.html from directory
          const indexPath = path.join(filePath, 'index.html');
          fs.access(indexPath, fs.constants.F_OK, (err) => {
            if (err) {
              // No index.html in directory, serve main index.html
              serveFile(path.join(__dirname, 'index.html'), res);
            } else {
              serveFile(indexPath, res);
            }
          });
        } else {
          // Serve the file
          serveFile(filePath, res);
        }
      });
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}/`);
  console.log(`📁 Serving files from: ${__dirname}`);
  console.log(`⏹️  Press Ctrl+C to stop the server`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
