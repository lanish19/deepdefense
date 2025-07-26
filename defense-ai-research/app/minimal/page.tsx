export default function MinimalPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Minimal Test Page</h1>
      <p>If you can see this, Next.js is working.</p>
      <p>Timestamp: {new Date().toISOString()}</p>
      <p>Environment: {process.env.NODE_ENV}</p>
    </div>
  );
} 