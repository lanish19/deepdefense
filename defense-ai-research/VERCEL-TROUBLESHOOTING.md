# Vercel Deployment Troubleshooting Guide

## 🚨 404 Error - Step-by-Step Resolution

### Step 1: Verify Vercel Project Configuration

1. **Check Root Directory**:
   - Go to Vercel Dashboard → Your Project → Settings → General
   - Ensure "Root Directory" is set to `defense-ai-research`
   - If not, update it and redeploy

2. **Verify Framework Preset**:
   - Should be set to "Next.js"
   - If not, manually set it to Next.js

3. **Check Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### Step 2: Environment Variables

**Required Variables** (all must be set):
```
GEMINI_API_KEY=your_actual_gemini_api_key
FIRECRAWL_KEY=your_actual_firecrawl_key
GEMINI_MODEL=gemini-2.0-flash
GEMINI_PREP_MODEL=gemini-2.5-pro
GEMINI_RESEARCH_MODEL=gemini-2.5-flash
GEMINI_TEMPERATURE=0.5
GEMINI_TOP_P=0.95
GEMINI_TOP_K=40
GEMINI_MAX_OUTPUT_TOKENS=8192
```

**How to Set**:
1. Vercel Dashboard → Project Settings → Environment Variables
2. Add each variable with Production, Preview, and Development environments checked
3. Redeploy after adding variables

### Step 3: Check Build Logs

1. Go to Vercel Dashboard → Deployments
2. Click on the latest deployment
3. Check "Build Logs" for errors
4. Look for:
   - Missing dependencies
   - TypeScript errors
   - Environment variable issues
   - File not found errors

### Step 4: Test Routes

After deployment, test these URLs in order:

1. **Debug Page**: `https://your-app.vercel.app/debug`
   - Should show environment variables and system info
   - If this works, Next.js is running correctly

2. **Test Page**: `https://your-app.vercel.app/test`
   - Should show "Test Page" with timestamp
   - If this works, page routing is working

3. **Test API**: `https://your-app.vercel.app/api/test`
   - Should return JSON with message and timestamp
   - If this works, API routing is working

4. **Main Page**: `https://your-app.vercel.app/`
   - Should show the Defense AI Research Platform
   - If this fails but others work, main page has an issue

### Step 5: Common Issues and Solutions

#### Issue: "Root Directory Not Found"
**Solution**: 
- Ensure you're importing the correct repository
- Set Root Directory to exactly `defense-ai-research`
- Redeploy

#### Issue: "Build Failed - Missing Dependencies"
**Solution**:
- Check that `package.json` is in the `defense-ai-research` directory
- Verify all dependencies are listed
- Try clearing Vercel cache and redeploying

#### Issue: "Environment Variables Not Set"
**Solution**:
- Add all required environment variables
- Ensure they're set for Production, Preview, and Development
- Redeploy after adding variables

#### Issue: "TypeScript Errors"
**Solution**:
- Check `next.config.js` has `typescript.ignoreBuildErrors: true`
- Or fix TypeScript errors in the code

#### Issue: "ESLint Errors"
**Solution**:
- Check `next.config.js` has `eslint.ignoreDuringBuilds: true`
- Or fix ESLint errors in the code

### Step 6: Manual Redeploy

If automatic redeploy doesn't work:

1. **Force Redeploy**:
   - Vercel Dashboard → Deployments
   - Click "Redeploy" on the latest deployment

2. **Clear Cache and Redeploy**:
   - Vercel Dashboard → Settings → General
   - Scroll to "Build & Development Settings"
   - Click "Clear Build Cache"
   - Redeploy

3. **Delete and Recreate Project**:
   - Delete the current Vercel project
   - Create a new project
   - Import the repository again
   - Set Root Directory to `defense-ai-research`
   - Add environment variables
   - Deploy

### Step 7: Verify File Structure

Ensure your repository has this exact structure:
```
deepdefense/
└── defense-ai-research/
    ├── app/
    │   ├── page.tsx
    │   ├── layout.tsx
    │   ├── globals.css
    │   ├── api/
    │   │   ├── research/
    │   │   │   └── route.ts
    │   │   ├── research/
    │   │   │   └── status/
    │   │   │       └── route.ts
    │   │   └── test/
    │   │       └── route.ts
    │   ├── test/
    │   │   └── page.tsx
    │   └── debug/
    │       └── page.tsx
    ├── lib/
    ├── types/
    ├── public/
    │   └── favicon.ico
    ├── package.json
    ├── next.config.js
    ├── vercel.json
    └── tsconfig.json
```

### Step 8: Debug Commands

Run these locally to verify everything works:

```bash
cd defense-ai-research
npm run verify        # Check deployment readiness
npm run build         # Test build process
npm run dev          # Test locally
```

### Step 9: Contact Support

If all else fails:

1. **Check Vercel Status**: [vercel-status.com](https://vercel-status.com)
2. **Vercel Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
3. **Vercel Support**: [vercel.com/support](https://vercel.com/support)

### Quick Checklist

- [ ] Root Directory set to `defense-ai-research`
- [ ] All environment variables added
- [ ] Build logs show no errors
- [ ] `/debug` page loads
- [ ] `/test` page loads
- [ ] `/api/test` returns JSON
- [ ] Main page loads

If you check all these and still get 404, the issue is likely in the Vercel configuration or a caching problem. 