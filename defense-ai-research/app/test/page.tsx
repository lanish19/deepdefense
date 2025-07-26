export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <p>This is a test page to verify routing is working.</p>
      <p className="mt-4">Timestamp: {new Date().toISOString()}</p>
    </div>
  );
} 