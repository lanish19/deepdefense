import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';
import { WorkflowState } from '../../types/agents';

// Default to /tmp to ensure write access in serverless environments
const WORKFLOW_DIR = process.env.WORKFLOW_DIR || '/tmp/deepdefense-workflows';

// If Vercel Redis (Upstash) environment variables are present, use Redis
const USE_REDIS =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

function ensureDir() {
  if (!fs.existsSync(WORKFLOW_DIR)) {
    fs.mkdirSync(WORKFLOW_DIR, { recursive: true });
  }
}

export async function saveWorkflowState(id: string, state: WorkflowState) {
  if (USE_REDIS) {
    try {
      await kv.set(id, JSON.stringify(state));
      return;
    } catch (err) {
      console.error(`Failed to save workflow state ${id} to Redis:`, err);
    }
  }
  try {
    ensureDir();
    const filePath = path.join(WORKFLOW_DIR, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error(`Failed to save workflow state ${id}:`, err);
  }
}

export async function loadWorkflowState(id: string): Promise<WorkflowState | null> {
  if (USE_REDIS) {
    try {
      const data = await kv.get<string>(id);
      return data ? (JSON.parse(data) as WorkflowState) : null;
    } catch (err) {
      console.error(`Failed to load workflow state ${id} from Redis:`, err);
    }
  }
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
