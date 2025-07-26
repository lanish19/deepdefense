import { NextRequest, NextResponse } from 'next/server';
import { ResearchWorkflowOrchestrator } from '../../../lib/workflow/orchestrator';
import { UserInput } from '../../../types/agents';
import { saveWorkflowState, loadWorkflowState } from '../../../lib/utils/workflow-store';

// Global variable that persists across function invocations within the same instance
declare global {
  var __activeWorkflows: Map<string, ResearchWorkflowOrchestrator> | undefined;
  var __workflowMetadata: Map<string, {
    startTime: number;
    lastAccessed: number;
    domainFocus: string;
  }> | undefined;
}

// Initialize global stores if they don't exist
if (!global.__activeWorkflows) {
  global.__activeWorkflows = new Map<string, ResearchWorkflowOrchestrator>();
}
if (!global.__workflowMetadata) {
  global.__workflowMetadata = new Map<string, {
    startTime: number;
    lastAccessed: number;
    domainFocus: string;
  }>();
}

const activeWorkflows = global.__activeWorkflows;
const workflowMetadata = global.__workflowMetadata;

// Clean up old workflows periodically
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

function cleanupOldWorkflows() {
  const cutoffTime = Date.now() - CLEANUP_INTERVAL;
  for (const [id, metadata] of workflowMetadata.entries()) {
    if (metadata.lastAccessed < cutoffTime) {
      activeWorkflows.delete(id);
      workflowMetadata.delete(id);
      console.log(`🗑️ Cleaned up old workflow ${id}`);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Received research request');

    // Clean up old workflows
    cleanupOldWorkflows();

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
    const orchestrator = new ResearchWorkflowOrchestrator(workflowId, userInput);
    saveWorkflowState(workflowId, orchestrator.getStateManager().getState());
    activeWorkflows.set(workflowId, orchestrator);
    
    // Store metadata for cleanup
    workflowMetadata.set(workflowId, {
      startTime: Date.now(),
      lastAccessed: Date.now(),
      domainFocus
    });
    
    console.log(`📊 Active workflows count: ${activeWorkflows.size}`);

    // Start workflow execution in background
    orchestrator.execute()
      .then((finalHTML) => {
        console.log(`✅ Workflow ${workflowId} completed successfully`);
        // Update metadata to prevent immediate cleanup
        const metadata = workflowMetadata.get(workflowId);
        if (metadata) {
          metadata.lastAccessed = Date.now();
        }
        saveWorkflowState(workflowId, orchestrator.getStateManager().getState());
      })
      .catch((error) => {
        console.error(`❌ Workflow ${workflowId} failed:`, error);
        // Keep workflow in memory to show error status
        const metadata = workflowMetadata.get(workflowId);
        if (metadata) {
          metadata.lastAccessed = Date.now();
        }
        saveWorkflowState(workflowId, orchestrator.getStateManager().getState());
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
    
    // Clean up old workflows
    cleanupOldWorkflows();
    
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

    console.log(`📊 Available workflows: ${Array.from(activeWorkflows.keys())}`);

    const orchestrator = activeWorkflows.get(workflowId);
    if (!orchestrator) {
      console.log(`⚠️ Workflow ${workflowId} not found in memory, checking disk`);
      const saved = loadWorkflowState(workflowId);
      if (saved) {
        console.log(`✅ Found saved workflow ${workflowId}`);
        const overall = saved.progress.length > 0
          ? Math.round(saved.progress.reduce((sum, p) => sum + p.progress, 0) / saved.progress.length)
          : 0;
        return NextResponse.json({
          workflowId,
          overallProgress: overall,
          progress: saved.progress,
          finalHTML: saved.finalHTML,
          completed: !!saved.finalHTML
        });
      }
      console.log(`❌ Workflow ${workflowId} not found`);
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Found workflow ${workflowId}`);

    // Update last accessed time
    const metadata = workflowMetadata.get(workflowId);
    if (metadata) {
      metadata.lastAccessed = Date.now();
    }

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
      completed: response.completed,
      totalWorkflows: activeWorkflows.size
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