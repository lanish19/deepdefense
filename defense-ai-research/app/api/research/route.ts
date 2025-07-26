import { NextRequest, NextResponse } from 'next/server';
import { ResearchWorkflowOrchestrator } from '../../../lib/workflow/orchestrator';
import { UserInput } from '../../../types/agents';

// Store active workflows
const activeWorkflows = new Map<string, ResearchWorkflowOrchestrator>();

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Received research request');

    // Parse multipart form data
    const formData = await request.formData();
    
    const domainFocus = formData.get('domainFocus') as string;
    const contextDetails = formData.get('contextDetails') as string | null;
    const startupFirmsFile = formData.get('startupFirmsFile') as File | null;

    if (!domainFocus) {
      return NextResponse.json(
        { error: 'Domain focus is required' },
        { status: 400 }
      );
    }

    // Create user input object
    const userInput: UserInput = {
      domainFocus,
      contextDetails: contextDetails || undefined,
      startupFirmsFile: startupFirmsFile || undefined
    };

    console.log(`🎯 Domain Focus: ${domainFocus}`);
    console.log(`📄 Context Details: ${contextDetails ? 'Provided' : 'None'}`);
    console.log(`📁 Startup Firms File: ${startupFirmsFile ? startupFirmsFile.name : 'None'}`);

    // Generate unique workflow ID
    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🆔 Generated Workflow ID: ${workflowId}`);
    
    // Create and store workflow orchestrator
    const orchestrator = new ResearchWorkflowOrchestrator(userInput);
    activeWorkflows.set(workflowId, orchestrator);
    
    console.log(`📊 Active workflows count: ${activeWorkflows.size}`);

    // Start workflow execution in background
    orchestrator.execute()
      .then((finalHTML) => {
        console.log(`✅ Workflow ${workflowId} completed successfully`);
        // Keep workflow in memory for a while to allow status checks
        setTimeout(() => {
          activeWorkflows.delete(workflowId);
          console.log(`🗑️ Cleaned up workflow ${workflowId}`);
        }, 10 * 60 * 1000); // Keep for 10 minutes
      })
      .catch((error) => {
        console.error(`❌ Workflow ${workflowId} failed:`, error);
        // Keep workflow in memory to show error status
        setTimeout(() => {
          activeWorkflows.delete(workflowId);
          console.log(`🗑️ Cleaned up failed workflow ${workflowId}`);
        }, 10 * 60 * 1000);
      });

    return NextResponse.json({
      workflowId,
      message: 'Research workflow started',
      statusUrl: `/api/research/status?workflowId=${workflowId}`
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Received status request');
    
    const searchParams = request.nextUrl.searchParams;
    const workflowId = searchParams.get('workflowId');

    console.log(`🔍 Looking for workflow: ${workflowId}`);

    if (!workflowId) {
      console.log('❌ No workflow ID provided');
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    console.log(`📊 Active workflows: ${Array.from(activeWorkflows.keys())}`);

    const orchestrator = activeWorkflows.get(workflowId);
    if (!orchestrator) {
      console.log(`❌ Workflow ${workflowId} not found`);
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Found workflow ${workflowId}`);

    const stateManager = orchestrator.getStateManager();
    const state = stateManager.getState();

    const response = {
      workflowId,
      overallProgress: stateManager.getOverallProgress(),
      progress: stateManager.getAllProgress(),
      finalHTML: state.finalHTML,
      completed: !!state.finalHTML
    };

    console.log(`📊 Status response:`, {
      workflowId,
      overallProgress: response.overallProgress,
      progressCount: response.progress.length,
      completed: response.completed
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Status API Error:', error);
    return NextResponse.json(
      { error: 'Failed to get workflow status' },
      { status: 500 }
    );
  }
} 