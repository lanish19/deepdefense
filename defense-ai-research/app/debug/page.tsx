export default function DebugPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔍 Deployment Debug Information</h1>
      
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div><strong>NODE_ENV:</strong> {process.env.NODE_ENV || 'Not set'}</div>
            <div><strong>VERCEL:</strong> {process.env.VERCEL || 'Not set'}</div>
            <div><strong>VERCEL_ENV:</strong> {process.env.VERCEL_ENV || 'Not set'}</div>
            <div><strong>VERCEL_URL:</strong> {process.env.VERCEL_URL || 'Not set'}</div>
            <div><strong>GEMINI_API_KEY:</strong> {process.env.GEMINI_API_KEY ? 'Set' : 'Not set'}</div>
            <div><strong>FIRECRAWL_KEY:</strong> {process.env.FIRECRAWL_KEY ? 'Set' : 'Not set'}</div>
            <div><strong>GEMINI_MODEL:</strong> {process.env.GEMINI_MODEL || 'Not set'}</div>
            <div><strong>GEMINI_PREP_MODEL:</strong> {process.env.GEMINI_PREP_MODEL || 'Not set'}</div>
            <div><strong>GEMINI_RESEARCH_MODEL:</strong> {process.env.GEMINI_RESEARCH_MODEL || 'Not set'}</div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">File System Check</h2>
          <div className="text-sm space-y-1">
            <div>✅ This page is loading (app/debug/page.tsx exists)</div>
            <div>✅ App Router is working</div>
            <div>✅ Next.js is running</div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Build Information</h2>
          <div className="text-sm space-y-1">
            <div><strong>Build Time:</strong> {new Date().toISOString()}</div>
            <div><strong>Next.js Version:</strong> 15.4.4</div>
            <div><strong>React Version:</strong> 19.1.0</div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Test Links</h2>
          <div className="space-y-2">
            <a href="/" className="block text-blue-600 hover:underline">🏠 Main Page</a>
            <a href="/test" className="block text-blue-600 hover:underline">🧪 Test Page</a>
            <a href="/api/test" className="block text-blue-600 hover:underline">🔌 Test API</a>
            <a href="/api/research" className="block text-blue-600 hover:underline">📊 Research API</a>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">If You See This Page</h2>
          <div className="text-sm space-y-2">
            <div>✅ Next.js is working correctly</div>
            <div>✅ App Router is functioning</div>
            <div>✅ The deployment is successful</div>
            <div>❓ If main page shows 404, check the main page component</div>
          </div>
        </div>
      </div>
    </div>
  );
} 