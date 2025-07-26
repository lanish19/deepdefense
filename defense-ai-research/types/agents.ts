export interface UserInput {
  domainFocus: string;          // UI.1
  contextDetails?: string;      // UI.2
  startupFirmsFile?: File;      // UI.3
}

export interface PreparatoryAgentOutput {
  coreConceptsRelationships: Array<{ concept: string; description: string }>;
  infoNeeds: Array<{ need: string; justification: string }>;
  keySubQuestions: Array<{ question: string; justification: string }>;
  implicitQuestions: Array<{ question: string; justification: string }>;
}

export interface ResearchAgentOutput {
  findings: Array<{
    title: string;
    source: string;
    date: string;
    bluf: string;
    summary: string;
  }>;
}

export interface StartupFirmsOutput {
  trends: Array<{ trend: string; explanation: string }>;
  similarities: Array<{ similarity: string; description: string }>;
  differences: Array<{ difference: string; description: string }>;
  whitespace: Array<{ opportunity: string; description: string }>;
  futureImpacts: Array<{ impact: string; description: string }>;
}

export interface SynthesisOutput {
  coreInsights: {
    policyTrends: string[];
    publicFirmTrends: string[];
    startupVCTrends: string[];
    specificTrends: string[];
    academicTrends: string[];
  };
  crossConnections: Array<{ insight: string; explanation: string }>;
  techApplications: Array<{ tech: string; explanation: string }>;
  structuredAnalysis: { [section: string]: string };
}

export interface StartupFirm {
  name: string;
  description?: string;
  products?: string[];
  website?: string;
}

export interface AgentProgress {
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  message?: string;
  result?: any;
}

export interface WorkflowState {
  userInput: UserInput;
  preparatoryResults: {
    prePolicy?: PreparatoryAgentOutput;
    prePrimes?: PreparatoryAgentOutput;
    preStartupVC?: PreparatoryAgentOutput;
    preStartupFirms?: PreparatoryAgentOutput;
    preAcademia?: PreparatoryAgentOutput;
  };
  researchResults: {
    policy?: ResearchAgentOutput;
    primes?: ResearchAgentOutput;
    startupVC?: ResearchAgentOutput;
    startupFirms?: StartupFirmsOutput;
    academic?: ResearchAgentOutput;
  };
  synthesisResult?: SynthesisOutput;
  finalHTML?: string;
  progress: AgentProgress[];
} 