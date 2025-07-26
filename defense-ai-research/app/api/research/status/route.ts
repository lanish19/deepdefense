import { NextRequest } from 'next/server';

// Store active workflows (shared reference from main route)
// In a production app, this would be stored in a database or Redis
const activeWorkflows = new Map();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const workflowId = searchParams.get('workflowId');

  if (!workflowId) {
    return new Response('Workflow ID is required', { status: 400 });
  }

  // Set up SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Import the orchestrator reference from the main route
      // Note: In production, this should use a proper shared state store
      const sendProgress = () => {
        try {
          // This is a simplified implementation
          // In production, you'd want to properly share state between routes
          send({
            type: 'progress',
            workflowId,
            message: 'Checking workflow status...',
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          send({
            type: 'error',
            message: 'Failed to get workflow status',
            timestamp: new Date().toISOString()
          });
        }
      };

      // Send initial status
      send({
        type: 'connected',
        workflowId,
        message: 'Connected to workflow status stream',
        timestamp: new Date().toISOString()
      });

      // Send periodic updates
      const interval = setInterval(sendProgress, 2000);

      // Clean up on close
      const cleanup = () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch (e) {
          // Stream already closed
        }
      };

      // Clean up after 10 minutes max
      setTimeout(cleanup, 10 * 60 * 1000);

      return cleanup;
    },
  });

  return new Response(stream, { headers });
} 