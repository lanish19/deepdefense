# Deployment Guide

## Vercel Deployment

### Prerequisites
1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Ensure your code is pushed to GitHub
3. **Environment Variables**: Set up required API keys

### Quick Deploy

1. **Connect Repository**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select the `defense-ai-research` directory as the root

2. **Configure Environment Variables**:
   - In Vercel dashboard, go to Project Settings → Environment Variables
   - Add the following variables:
     ```
     GEMINI_API_KEY=your_gemini_api_key
     FIRECRAWL_KEY=your_firecrawl_key
     GEMINI_MODEL=gemini-2.0-flash
     GEMINI_PREP_MODEL=gemini-2.5-pro
     GEMINI_RESEARCH_MODEL=gemini-2.5-flash
     ```

3. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete

### Troubleshooting

#### 404 Error
If you get a 404 error after deployment:

1. **Check Build Logs**:
   - Go to Vercel dashboard → Deployments
   - Click on the latest deployment
   - Check "Build Logs" for errors

2. **Common Issues**:
   - **Duplicate app directories**: Ensure only one `app/` directory exists
   - **Missing favicon**: Ensure `public/favicon.ico` exists
   - **Environment variables**: Verify all required env vars are set

3. **Test Routes**:
   - Visit `/test` to verify basic page routing
   - Visit `/api/test` to verify API routing

#### Build Errors
If build fails:

1. **TypeScript Errors**:
   - Check `next.config.js` has `typescript.ignoreBuildErrors: true`
   - Or fix TypeScript errors in code

2. **ESLint Errors**:
   - Check `next.config.js` has `eslint.ignoreDuringBuilds: true`
   - Or fix ESLint errors in code

3. **Missing Dependencies**:
   - Ensure `package.json` has all required dependencies
   - Run `npm install` locally to verify

#### Runtime Errors
If app runs but has errors:

1. **API Key Issues**:
   - Verify environment variables are set correctly
   - Check API key permissions and quotas

2. **Memory/Timeout Issues**:
   - Check `vercel.json` for function timeouts
   - Consider increasing `maxDuration` for long-running operations

### Local Testing

Before deploying, test locally:

```bash
cd defense-ai-research
npm install
cp .env.local.example .env.local
# Edit .env.local with your API keys
npm run build
npm run dev
```

### Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes | - |
| `FIRECRAWL_KEY` | Firecrawl API key | Yes | - |
| `GEMINI_MODEL` | Default Gemini model | No | `gemini-2.0-flash` |
| `GEMINI_PREP_MODEL` | Model for preparatory agents | No | `gemini-2.5-pro` |
| `GEMINI_RESEARCH_MODEL` | Model for research agents | No | `gemini-2.5-flash` |
| `GEMINI_TEMPERATURE` | Model temperature | No | `0.5` |
| `GEMINI_TOP_P` | Model top_p | No | `0.95` |
| `GEMINI_TOP_K` | Model top_k | No | `40` |
| `GEMINI_MAX_OUTPUT_TOKENS` | Max output tokens | No | `8192` |

### Performance Optimization

1. **Function Timeouts**:
   - Research workflows can take 5-10 minutes
   - Set appropriate timeouts in `vercel.json`

2. **Memory Usage**:
   - Monitor memory usage in Vercel dashboard
   - Consider breaking large operations into smaller chunks

3. **Rate Limiting**:
   - Implement proper rate limiting for API calls
   - Use exponential backoff for retries

### Monitoring

1. **Vercel Analytics**:
   - Enable Vercel Analytics for performance monitoring
   - Monitor function execution times

2. **Error Tracking**:
   - Check Vercel Function Logs for errors
   - Monitor API response times

3. **Usage Monitoring**:
   - Track API key usage and costs
   - Monitor function invocations

### Security

1. **Environment Variables**:
   - Never commit API keys to Git
   - Use Vercel's environment variable encryption

2. **API Security**:
   - Implement proper input validation
   - Use rate limiting to prevent abuse

3. **CORS**:
   - Configure CORS properly for API routes
   - Restrict origins as needed 