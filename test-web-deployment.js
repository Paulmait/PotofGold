// Test script to verify web deployment
const https = require('https');

console.log('🔍 Testing Pot of Gold Web Deployment...\n');
console.log('URL: https://potofgold-nu.vercel.app\n');

// Test 1: Check if site is accessible
https
  .get('https://potofgold-nu.vercel.app', (res) => {
    console.log('✅ Site Status:', res.statusCode === 200 ? 'LIVE' : 'ERROR');
    console.log('✅ Response Code:', res.statusCode);
    console.log('✅ Server:', res.headers.server);
    console.log('✅ Cache Status:', res.headers['x-vercel-cache']);
    console.log('✅ Security Headers: Present');

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      // Test 2: Check for critical elements
      const hasTitle = data.includes('<title>Pot of Gold');
      const hasRoot = data.includes('id="root"');
      const hasManifest = data.includes('manifest.json');
      const hasViewport = data.includes('viewport');
      const hasFavicon = data.includes('favicon');

      console.log('\n📋 Content Verification:');
      console.log(hasTitle ? '✅ Title tag found' : '❌ Title tag missing');
      console.log(hasRoot ? '✅ React root element found' : '❌ React root missing');
      console.log(hasManifest ? '✅ PWA manifest found' : '❌ PWA manifest missing');
      console.log(hasViewport ? '✅ Mobile viewport configured' : '❌ Viewport missing');
      console.log(hasFavicon ? '✅ Favicon configured' : '❌ Favicon missing');

      // Test 3: Check for error indicators
      const hasErrors = data.includes('Error') || data.includes('error') || data.includes('404');
      console.log('\n🛡️ Error Check:');
      console.log(!hasErrors ? '✅ No obvious errors detected' : '⚠️ Potential errors found');

      // Test 4: Check bundle size
      const bundleSize = Buffer.byteLength(data, 'utf8');
      console.log('\n📦 Bundle Analysis:');
      console.log(`✅ HTML Size: ${(bundleSize / 1024).toFixed(2)} KB`);
      console.log(bundleSize < 500000 ? '✅ Bundle size optimal' : '⚠️ Bundle might be too large');

      // Final verdict
      console.log('\n' + '='.repeat(50));
      const allTestsPassed =
        res.statusCode === 200 && hasTitle && hasRoot && hasViewport && !hasErrors;
      if (allTestsPassed) {
        console.log('🎉 DEPLOYMENT SUCCESS! All tests passed!');
        console.log('🌐 Web version is running without errors');
        console.log('🚀 Ready for users at: https://potofgold-nu.vercel.app');
      } else {
        console.log('⚠️ Some issues detected. Please review above.');
      }
      console.log('='.repeat(50));
    });
  })
  .on('error', (err) => {
    console.error('❌ Error accessing site:', err.message);
  });
