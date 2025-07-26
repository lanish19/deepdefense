import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for testing
const simpleWorkflows = new Map<string, any>();

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
    
    // Create simple workflow state
    const workflow = {
      id: workflowId,
      domainFocus,
      status: 'running',
      progress: 0,
      startTime: new Date().toISOString(),
      agents: [
        { id: 'test-agent-1', status: 'pending', progress: 0 },
        { id: 'test-agent-2', status: 'pending', progress: 0 }
      ]
    };
    
    simpleWorkflows.set(workflowId, workflow);
    
    console.log(`📊 Simple workflows count: ${simpleWorkflows.size}`);

    // Simulate some progress after a delay
    setTimeout(() => {
      const wf = simpleWorkflows.get(workflowId);
      if (wf) {
        wf.agents[0].status = 'completed';
        wf.agents[0].progress = 100;
        wf.progress = 50;
      }
    }, 2000);

    setTimeout(() => {
      const wf = simpleWorkflows.get(workflowId);
      if (wf) {
        wf.agents[1].status = 'completed';
        wf.agents[1].progress = 100;
        wf.progress = 100;
        wf.status = 'completed';
        wf.finalHTML = `<html><body><h1>Simple Report for ${domainFocus}</h1><p>This is a test report.</p></body></html>`;
      }
    }, 4000);

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

    console.log(`📊 Simple workflows: ${Array.from(simpleWorkflows.keys())}`);

    const workflow = simpleWorkflows.get(workflowId);
    if (!workflow) {
      console.log(`❌ Simple workflow ${workflowId} not found`);
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Found simple workflow ${workflowId}`);

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
      completed: response.completed
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