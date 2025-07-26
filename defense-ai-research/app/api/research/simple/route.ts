import { NextRequest, NextResponse } from 'next/server';

// Global variable that persists across function invocations within the same instance
// This is a workaround for serverless limitations
declare global {
  var __workflowStore: Map<string, any> | undefined;
}

// Initialize global store if it doesn't exist
if (!global.__workflowStore) {
  global.__workflowStore = new Map<string, any>();
}

const workflowStore = global.__workflowStore;

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Received simple research request');

    // Parse multipart form data
    const formData = await request.formData();
    
    const domainFocus = formData.get('domainFocus') as string;

    if (!domainFocus) {
      return NextResponse.json(
        { error: 'Domain focus is required' },
        { status: 400 }
      );
    }

    // Generate unique workflow ID
    const workflowId = `simple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🆔 Generated Simple Workflow ID: ${workflowId}`);
    
    // Create simple workflow state with timestamps
    const workflow = {
      id: workflowId,
      domainFocus,
      status: 'running',
      progress: 0,
      startTime: Date.now(),
      lastUpdated: Date.now(),
      agents: [
        { id: 'test-agent-1', status: 'pending', progress: 0 },
        { id: 'test-agent-2', status: 'pending', progress: 0 }
      ],
      // Add completion timestamps
      agent1CompleteTime: Date.now() + 2000,
      agent2CompleteTime: Date.now() + 4000
    };
    
    workflowStore.set(workflowId, workflow);
    
    console.log(`📊 Created workflow ${workflowId}, total workflows: ${workflowStore.size}`);

    return NextResponse.json({
      workflowId,
      message: 'Simple research workflow started',
      statusUrl: `/api/research/simple?workflowId=${workflowId}`
    });

  } catch (error) {
    console.error('❌ Simple API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Received simple status request');
    
    const searchParams = request.nextUrl.searchParams;
    const workflowId = searchParams.get('workflowId');

    console.log(`🔍 Looking for simple workflow: ${workflowId}`);

    if (!workflowId) {
      console.log('❌ No workflow ID provided');
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    console.log(`📊 Available workflows: ${Array.from(workflowStore.keys())}`);

    const workflow = workflowStore.get(workflowId);
    if (!workflow) {
      console.log(`❌ Simple workflow ${workflowId} not found`);
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Found simple workflow ${workflowId}`);

    // Update workflow state based on current time
    const now = Date.now();
    let updated = false;
    
    // Agent 1 completes at 2 seconds
    if (now >= workflow.agent1CompleteTime && workflow.agents[0].status === 'pending') {
      workflow.agents[0].status = 'completed';
      workflow.agents[0].progress = 100;
      workflow.progress = 50;
      workflow.lastUpdated = now;
      updated = true;
      console.log(`✅ Agent 1 completed`);
    }
    
    // Agent 2 completes at 4 seconds
    if (now >= workflow.agent2CompleteTime && workflow.agents[1].status === 'pending') {
      workflow.agents[1].status = 'completed';
      workflow.agents[1].progress = 100;
      workflow.progress = 100;
      workflow.status = 'completed';
      workflow.finalHTML = `<html><body><h1>Simple Report for ${workflow.domainFocus}</h1><p>This is a test report generated at ${new Date().toISOString()}</p></body></html>`;
      workflow.lastUpdated = now;
      updated = true;
      console.log(`✅ Agent 2 completed`);
    }

    // Clean up old workflows (older than 5 minutes)
    const cutoffTime = now - (5 * 60 * 1000);
    for (const [id, wf] of workflowStore.entries()) {
      if (wf.startTime < cutoffTime) {
        workflowStore.delete(id);
        console.log(`🗑️ Cleaned up old workflow ${id}`);
      }
    }

    const response = {
      workflowId,
      overallProgress: workflow.progress,
      progress: workflow.agents,
      finalHTML: workflow.finalHTML,
      completed: workflow.status === 'completed'
    };

    console.log(`📊 Simple status response:`, {
      workflowId,
      overallProgress: response.overallProgress,
      progressCount: response.progress.length,
      completed: response.completed,
      totalWorkflows: workflowStore.size
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Simple Status API Error:', error);
    return NextResponse.json(
      { error: 'Failed to get workflow status' },
      { status: 500 }
    );
  }
} 