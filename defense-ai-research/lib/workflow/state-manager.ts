import { WorkflowState, AgentProgress } from '../../types/agents';

export class WorkflowStateManager {
  private state: WorkflowState;
  private listeners: Map<string, (update: AgentProgress) => void> = new Map();

  constructor(initialState: Partial<WorkflowState>) {
    this.state = {
      userInput: initialState.userInput!,
      preparatoryResults: {},
      researchResults: {},
      progress: [],
      ...initialState
    };
  }

  updateAgentProgress(agentId: string, progress: Partial<AgentProgress>) {
    const existingIndex = this.state.progress.findIndex(p => p.agentId === agentId);
    const updatedProgress: AgentProgress = {
      agentId,
      status: 'pending',
      progress: 0,
      ...(existingIndex >= 0 ? this.state.progress[existingIndex] : {}),
      ...progress
    };

    if (existingIndex >= 0) {
      this.state.progress[existingIndex] = updatedProgress;
    } else {
      this.state.progress.push(updatedProgress);
    }

    this.notifyListeners(agentId, updatedProgress);
  }

  setPreparatoryResult(agentType: string, result: any) {
    (this.state.preparatoryResults as any)[agentType] = result;
  }

  setResearchResult(agentType: string, result: any) {
    (this.state.researchResults as any)[agentType] = result;
  }

  setSynthesisResult(result: any) {
    this.state.synthesisResult = result;
  }

  setFinalHTML(html: string) {
    this.state.finalHTML = html;
  }

  getState(): WorkflowState {
    return { ...this.state };
  }

  subscribe(agentId: string, callback: (update: AgentProgress) => void) {
    this.listeners.set(agentId, callback);
  }

  subscribeToAll(callback: (update: AgentProgress) => void) {
    this.listeners.set('__all__', callback);
  }

  unsubscribe(agentId: string) {
    this.listeners.delete(agentId);
  }

  private notifyListeners(agentId: string, progress: AgentProgress) {
    // Notify specific agent listener
    const listener = this.listeners.get(agentId);
    if (listener) {
      listener(progress);
    }

    // Notify global listener
    const globalListener = this.listeners.get('__all__');
    if (globalListener) {
      globalListener(progress);
    }
  }

  getOverallProgress(): number {
    if (this.state.progress.length === 0) return 0;
    
    const totalProgress = this.state.progress.reduce((sum, p) => sum + p.progress, 0);
    return Math.round(totalProgress / this.state.progress.length);
  }

  getAllProgress(): AgentProgress[] {
    return [...this.state.progress];
  }
} 