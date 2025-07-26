import { WorkflowState, AgentProgress, PreparatoryAgentOutput, ResearchAgentOutput, StartupFirmsOutput } from '../../types/agents';

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

  setPreparatoryResult(agentType: string, result: PreparatoryAgentOutput) {
    switch (agentType) {
      case 'policy':
        this.state.preparatoryResults.prePolicy = result;
        break;
      case 'primes':
        this.state.preparatoryResults.prePrimes = result;
        break;
      case 'startupVC':
        this.state.preparatoryResults.preStartupVC = result;
        break;
      case 'startupFirms':
        this.state.preparatoryResults.preStartupFirms = result;
        break;
      case 'academia':
        this.state.preparatoryResults.preAcademia = result;
        break;
      default:
        console.warn(`Unknown preparatory agent type: ${agentType}`);
    }
  }

  setResearchResult(agentType: string, result: ResearchAgentOutput | StartupFirmsOutput) {
    switch (agentType) {
      case 'policy':
        this.state.researchResults.policy = result as ResearchAgentOutput;
        break;
      case 'primes':
        this.state.researchResults.primes = result as ResearchAgentOutput;
        break;
      case 'startupVC':
        this.state.researchResults.startupVC = result as ResearchAgentOutput;
        break;
      case 'startupFirms':
        this.state.researchResults.startupFirms = result as StartupFirmsOutput;
        break;
      case 'academic':
        this.state.researchResults.academic = result as ResearchAgentOutput;
        break;
      default:
        console.warn(`Unknown research agent type: ${agentType}`);
    }
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
