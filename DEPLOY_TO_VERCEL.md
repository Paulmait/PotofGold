# Deploy to Vercel - Quick Guide

## Step 1: Run the fix script
```bash
node scripts/fix-web-build.js
```

## Step 2: Test locally
```bash
npx serve web-build
# Open http://localhost:3000/test.html
```

## Step 3: Deploy to Vercel
```bash
vercel --prod
```

## If the page is still blank:

1. Check browser console for errors (F12)
2. Check network tab for failed requests
3. Try the test page: https://pofgold.com/test.html

## Common Issues:

- **Blank page**: Usually means JavaScript error or CSP blocking
- **404 errors**: Check that files were uploaded correctly
- **Firebase errors**: Check environment variables in Vercel dashboard
