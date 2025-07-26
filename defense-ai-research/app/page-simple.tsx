export default function SimplePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Defense AI Research Platform
          </h1>
          <p className="text-lg text-gray-600">
            Multi-Agent AI Research for Defense/National Security Domains
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Simple Test Page</h2>
          <p className="text-gray-600 mb-4">
            This is a simplified version of the main page to test if the complex component was causing the 404 error.
          </p>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900">Test Links:</h3>
              <div className="mt-2 space-x-4">
                <a href="/test" className="text-blue-600 hover:underline">Test Page</a>
                <a href="/debug" className="text-blue-600 hover:underline">Debug Page</a>
                <a href="/api/test" className="text-blue-600 hover:underline">Test API</a>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900">Status:</h3>
              <p className="text-green-700">✅ Page is loading correctly</p>
              <p className="text-green-700">✅ Next.js App Router is working</p>
              <p className="text-green-700">✅ Tailwind CSS is working</p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold text-yellow-900">Next Steps:</h3>
              <p className="text-yellow-700">If you can see this page, the deployment is working. The issue was likely with the complex main page component.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 