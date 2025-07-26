import fs from 'fs';
import path from 'path';
import { WorkflowState } from '../../types/agents';

// Vercel's serverless functions have a read-only filesystem except for `/tmp`.
// Use that location by default so workflow state can be persisted without errors
// when no `WORKFLOW_DIR` is provided via environment variables.
const WORKFLOW_DIR = process.env.WORKFLOW_DIR || '/tmp/workflow-data';

function ensureDir() {
  if (!fs.existsSync(WORKFLOW_DIR)) {
    fs.mkdirSync(WORKFLOW_DIR, { recursive: true });
  }
}

export function saveWorkflowState(id: string, state: WorkflowState) {
  try {
    ensureDir();
    const filePath = path.join(WORKFLOW_DIR, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error(`Failed to save workflow state ${id}:`, err);
  }
}

export function loadWorkflowState(id: string): WorkflowState | null {
  try {
    const filePath = path.join(WORKFLOW_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data) as WorkflowState;
    }
  } catch (err) {
    console.error(`Failed to load workflow state ${id}:`, err);
  }
  return null;
}
