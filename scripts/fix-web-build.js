#!/usr/bin/env node

/**
 * Fix Web Build Script
 * Fixes common issues with Expo web builds
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing web build issues...\n');

// Fix 1: Fix index.html paths
const indexPath = path.join(__dirname, '..', 'web-build', 'index.html');
if (fs.existsSync(indexPath)) {
  console.log('Fixing index.html paths...');
  let html = fs.readFileSync(indexPath, 'utf8');

  // Replace backslashes with forward slashes
  html = html.replace(/href="\\([^"]+)"/g, 'href="/$1"');
  html = html.replace(/src="\\([^"]+)"/g, 'src="/$1"');
  html = html.replace(/\\/g, '/');

  fs.writeFileSync(indexPath, html);
  console.log('✅ Fixed paths in index.html');
} else {
  console.log('❌ index.html not found');
}

// Fix 2: Create a simple test page
const testPath = path.join(__dirname, '..', 'web-build', 'test.html');
const testHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Pot of Gold - Test</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            text-align: center;
        }
        h1 {
            color: #FFD700;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .status {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        button {
            background: #FFD700;
            color: #1a1a2e;
            border: none;
            padding: 15px 30px;
            font-size: 18px;
            border-radius: 30px;
            cursor: pointer;
            font-weight: bold;
        }
        button:hover {
            background: #FFC700;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🍯 Pot of Gold</h1>
        <div class="status">
            <h2>Test Page</h2>
            <p>If you can see this, the web server is working!</p>
            <p>Main app status: <span id="app-status">Checking...</span></p>
        </div>
        <button onclick="testApp()">Test Main App</button>
        <div id="results"></div>
    </div>
    
    <script>
        function testApp() {
            const results = document.getElementById('results');
            results.innerHTML = '<p>Testing...</p>';
            
            // Try to load the main JavaScript
            const script = document.createElement('script');
            script.src = '/static/js/main.80994c0e.js';
            script.onload = () => {
                results.innerHTML = '<p style="color: #4CAF50;">✅ Main script loaded!</p>';
            };
            script.onerror = () => {
                results.innerHTML = '<p style="color: #f44336;">❌ Failed to load main script</p>';
            };
            document.head.appendChild(script);
        }
        
        // Check if scripts exist
        fetch('/static/js/vendor.6d45df40.js')
            .then(response => {
                if (response.ok) {
                    document.getElementById('app-status').innerHTML = '✅ Scripts found';
                } else {
                    document.getElementById('app-status').innerHTML = '❌ Scripts not found';
                }
            })
            .catch(() => {
                document.getElementById('app-status').innerHTML = '❌ Network error';
            });
    </script>
</body>
</html>`;

fs.writeFileSync(testPath, testHtml);
console.log('✅ Created test.html');

// Fix 3: Check for common issues
console.log('\n📋 Checking for common issues:');

// Check if static files exist
const vendorPath = path.join(__dirname, '..', 'web-build', 'static', 'js', 'vendor.6d45df40.js');
const mainPath = path.join(__dirname, '..', 'web-build', 'static', 'js');

if (fs.existsSync(vendorPath)) {
  console.log('✅ Vendor bundle exists');
} else {
  console.log('❌ Vendor bundle missing');
}

if (fs.existsSync(mainPath)) {
  const files = fs.readdirSync(mainPath);
  console.log(`✅ Found ${files.length} JS bundles:`, files);
} else {
  console.log('❌ Static JS directory missing');
}

// Fix 4: Create deployment instructions
const deployPath = path.join(__dirname, '..', 'DEPLOY_TO_VERCEL.md');
const deployInstructions = `# Deploy to Vercel - Quick Guide

## Step 1: Run the fix script
\`\`\`bash
node scripts/fix-web-build.js
\`\`\`

## Step 2: Test locally
\`\`\`bash
npx serve web-build
# Open http://localhost:3000/test.html
\`\`\`

## Step 3: Deploy to Vercel
\`\`\`bash
vercel --prod
\`\`\`

## If the page is still blank:

1. Check browser console for errors (F12)
2. Check network tab for failed requests
3. Try the test page: https://pofgold.com/test.html

## Common Issues:

- **Blank page**: Usually means JavaScript error or CSP blocking
- **404 errors**: Check that files were uploaded correctly
- **Firebase errors**: Check environment variables in Vercel dashboard
`;

fs.writeFileSync(deployPath, deployInstructions);
console.log('✅ Created DEPLOY_TO_VERCEL.md');

console.log('\n✅ Fix script completed!');
console.log('Next steps:');
console.log('1. Run: npx serve web-build');
console.log('2. Open: http://localhost:3000/test.html');
console.log('3. If working locally, deploy: vercel --prod');
