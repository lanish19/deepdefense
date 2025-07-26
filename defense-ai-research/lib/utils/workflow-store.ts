import fs from 'fs';
import path from 'path';
import { WorkflowState } from '../../types/agents';

const WORKFLOW_DIR = process.env.WORKFLOW_DIR || '.workflow-data';

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
