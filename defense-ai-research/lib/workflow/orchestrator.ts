import { UserInput, StartupFirm } from '../../types/agents';
import { WorkflowStateManager } from './state-manager';
import { parseStartupFirmsFile } from '../utils/file-parser';
import { saveWorkflowState } from '../utils/workflow-store';

// Import preparatory agents
import { PrePolicyAgent } from '../agents/preparatory/pre-policy';
import { PrePrimesAgent } from '../agents/preparatory/pre-primes';
import { PreStartupVCAgent } from '../agents/preparatory/pre-startup-vc';
import { PreStartupFirmsAgent } from '../agents/preparatory/pre-startup-firms';
import { PreAcademiaAgent } from '../agents/preparatory/pre-academia';

// Import research agents
import { PolicyResearchAgent } from '../agents/research/policy-research';
import { PrimesResearchAgent } from '../agents/research/primes-research';
import { StartupVCResearchAgent } from '../agents/research/startup-vc-research';
import { StartupFirmsResearchAgent } from '../agents/research/startup-firms-research';
import { AcademicResearchAgent } from '../agents/research/academic-research';

// Import synthesis and output agents
import { AnalysisSynthesisAgent } from '../agents/synthesis/analysis-synthesis';
import { HTMLGeneratorAgent } from '../agents/output/html-generator';

export class ResearchWorkflowOrchestrator {
  private stateManager: WorkflowStateManager;
  private startupFirms: StartupFirm[] = [];
  private workflowId: string;

  constructor(workflowId: string, userInput: UserInput) {
    this.workflowId = workflowId;
    this.stateManager = new WorkflowStateManager({ userInput });
    // Persist state on every update
    this.stateManager.subscribeToAll(() => {
      saveWorkflowState(this.workflowId, this.stateManager.getState());
    });
    saveWorkflowState(this.workflowId, this.stateManager.getState());
  }

  async execute(): Promise<string> {
    console.log('🚀 Starting Defense AI Research Workflow');
    console.log(`📋 Domain Focus: ${this.stateManager.getState().userInput.domainFocus}`);

    try {
      // Step 1: Parse startup firms file if provided
      await this.parseStartupFirmsFile();

      // Step 2: Run preparatory agents with error handling
      await this.runPreparatoryAgents();

      // Step 3: Run research agents with error handling
      await this.runResearchAgents();

      // Step 4: Run synthesis agent with error handling
      await this.runSynthesisAgent();

      // Step 5: Generate HTML report with error handling
      const finalHTML = await this.generateHTMLReport();

      console.log('✅ Workflow completed successfully');
      return finalHTML;

    } catch (error) {
      console.error('❌ Workflow failed:', error);
      throw error;
    }
  }

  private async parseStartupFirmsFile(): Promise<void> {
    const userInput = this.stateManager.getState().userInput;
    
    if (!userInput.startupFirmsFile) {
      console.log('📄 No startup firms file provided, proceeding without specific firm data');
      return;
    }

    this.stateManager.updateAgentProgress('file-parser', {
      status: 'running',
      progress: 50,
      message: 'Parsing startup firms file...'
    });

    try {
      this.startupFirms = await parseStartupFirmsFile(userInput.startupFirmsFile);
      console.log(`📄 Parsed ${this.startupFirms.length} startup firms from file`);

      this.stateManager.updateAgentProgress('file-parser', {
        status: 'completed',
        progress: 100,
        message: `Parsed ${this.startupFirms.length} firms`
      });
    } catch (error) {
      this.stateManager.updateAgentProgress('file-parser', {
        status: 'error',
        progress: 0,
        message: 'Failed to parse startup firms file'
      });
      throw error;
    }
  }

  private async runPreparatoryAgents(): Promise<void> {
    console.log('🔍 Running preparatory agents (G.1-G.5)...');
    
    const userInput = this.stateManager.getState().userInput;
    const { domainFocus, contextDetails } = userInput;

    // Initialize all preparatory agents
    const agents = [
      { id: 'pre-policy', name: 'Pre-Policy', agent: new PrePolicyAgent(domainFocus, contextDetails) },
      { id: 'pre-primes', name: 'Pre-Primes', agent: new PrePrimesAgent(domainFocus, contextDetails) },
      { id: 'pre-startup-vc', name: 'Pre-Startup/VC', agent: new PreStartupVCAgent(domainFocus, contextDetails) },
      { id: 'pre-startup-firms', name: 'Pre-Startup Firms', agent: new PreStartupFirmsAgent(domainFocus, contextDetails, this.startupFirms) },
      { id: 'pre-academia', name: 'Pre-Academia', agent: new PreAcademiaAgent(domainFocus, contextDetails) }
    ];

    // Set initial progress
    agents.forEach(({ id, name }) => {
      this.stateManager.updateAgentProgress(id, {
        status: 'pending',
        progress: 0,
        message: `Waiting to start ${name} Agent`
      });
    });

    // Run agents with individual error handling (not Promise.all)
    const results = [];
    for (const { id, name, agent } of agents) {
      this.stateManager.updateAgentProgress(id, {
        status: 'running',
        progress: 25,
        message: `Running ${name} Agent`
      });

      try {
        const result = await agent.execute();
        
        this.stateManager.updateAgentProgress(id, {
          status: 'completed',
          progress: 100,
          message: `${name} Agent completed`
        });

        results.push({ id, result });
      } catch (error) {
        console.error(`❌ ${name} Agent failed:`, error);
        this.stateManager.updateAgentProgress(id, {
          status: 'error',
          progress: 0,
          message: `${name} Agent failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        // Continue with other agents instead of failing completely
        results.push({ id, result: null });
      }
    }

    // Store results (only successful ones)
    const prepMap: Record<string, string> = {
      'pre-policy': 'policy',
      'pre-primes': 'primes',
      'pre-startup-vc': 'startupVC',
      'pre-startup-firms': 'startupFirms',
      'pre-academia': 'academia',
    };

    results.forEach(({ id, result }) => {
      if (result !== null) {
        const agentType = prepMap[id];
        if (agentType) {
          this.stateManager.setPreparatoryResult(agentType, result);
        } else {
          console.warn(`Unknown preparatory agent id: ${id}`);
        }
      }
    });

    console.log('✅ Preparatory agents completed (with error handling)');
  }

  private async runResearchAgents(): Promise<void> {
    console.log('🔬 Running research agents (G.6-G.10)...');
    
    const state = this.stateManager.getState();
    const { domainFocus, contextDetails } = state.userInput;
    const { preparatoryResults } = state;

    // Check which preparatory results are available
    const availablePreparatoryResults = {
      prePolicy: preparatoryResults.prePolicy,
      prePrimes: preparatoryResults.prePrimes,
      preStartupVC: preparatoryResults.preStartupVC,
      preStartupFirms: preparatoryResults.preStartupFirms,
      preAcademia: preparatoryResults.preAcademia
    };

    // Initialize research agents only for available preparatory results
    const agents = [];
    
    if (availablePreparatoryResults.prePolicy) {
      agents.push({
        id: 'policy-research',
        name: 'Policy Research',
        agent: new PolicyResearchAgent(domainFocus, availablePreparatoryResults.prePolicy, contextDetails)
      });
    }
    
    if (availablePreparatoryResults.prePrimes) {
      agents.push({
        id: 'primes-research',
        name: 'Primes Research',
        agent: new PrimesResearchAgent(domainFocus, availablePreparatoryResults.prePrimes, contextDetails)
      });
    }
    
    if (availablePreparatoryResults.preStartupVC) {
      agents.push({
        id: 'startup-vc-research',
        name: 'Startup/VC Research',
        agent: new StartupVCResearchAgent(domainFocus, availablePreparatoryResults.preStartupVC, contextDetails)
      });
    }
    
    if (availablePreparatoryResults.preStartupFirms) {
      agents.push({
        id: 'startup-firms-research',
        name: 'Startup Firms Research',
        agent: new StartupFirmsResearchAgent(domainFocus, availablePreparatoryResults.preStartupFirms, this.startupFirms, contextDetails)
      });
    }
    
    if (availablePreparatoryResults.preAcademia) {
      agents.push({
        id: 'academic-research',
        name: 'Academic Research',
        agent: new AcademicResearchAgent(domainFocus, availablePreparatoryResults.preAcademia, contextDetails)
      });
    }

    if (agents.length === 0) {
      console.log('⚠️ No preparatory results available, skipping research agents');
      return;
    }

    // Set initial progress
    agents.forEach(({ id, name }) => {
      this.stateManager.updateAgentProgress(id, {
        status: 'pending',
        progress: 0,
        message: `Waiting to start ${name} Agent`
      });
    });

    // Run agents sequentially to avoid rate limits (deep research is intensive)
    const results = [];
    for (const { id, name, agent } of agents) {
      this.stateManager.updateAgentProgress(id, {
        status: 'running',
        progress: 25,
        message: `Running ${name} Agent with deep research`
      });

      try {
        const result = await agent.execute();
        
        this.stateManager.updateAgentProgress(id, {
          status: 'completed',
          progress: 100,
          message: `${name} Agent completed`
        });

        results.push({ id, result });
      } catch (error) {
        console.error(`❌ ${name} Agent failed:`, error);
        this.stateManager.updateAgentProgress(id, {
          status: 'error',
          progress: 0,
          message: `${name} Agent failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        // Continue with other agents
        results.push({ id, result: null });
      }
    }

    // Store results (only successful ones)
    const researchMap: Record<string, string> = {
      'policy-research': 'policy',
      'primes-research': 'primes',
      'startup-vc-research': 'startupVC',
      'startup-firms-research': 'startupFirms',
      'academic-research': 'academic',
    };

    results.forEach(({ id, result }) => {
      if (result !== null) {
        const agentType = researchMap[id];
        if (agentType) {
          this.stateManager.setResearchResult(agentType, result);
        } else {
          console.warn(`Unknown research agent id: ${id}`);
        }
      }
    });

    console.log('✅ Research agents completed (with error handling)');
  }

  private async runSynthesisAgent(): Promise<void> {
    console.log('🧠 Running synthesis agent (G.11)...');
    
    this.stateManager.updateAgentProgress('synthesis', {
      status: 'running',
      progress: 50,
      message: 'Synthesizing all research findings'
    });

    const state = this.stateManager.getState();
    const { domainFocus, contextDetails } = state.userInput;
    const { researchResults } = state;

    // Check which research results are available
    const availableResearchResults = {
      policy: researchResults.policy,
      primes: researchResults.primes,
      startupVC: researchResults.startupVC,
      startupFirms: researchResults.startupFirms,
      academic: researchResults.academic
    };

    // Only proceed if we have at least some research results
    const availableResults = Object.values(availableResearchResults).filter(result => result !== undefined);
    
    if (availableResults.length === 0) {
      console.log('⚠️ No research results available, skipping synthesis');
      this.stateManager.updateAgentProgress('synthesis', {
        status: 'error',
        progress: 0,
        message: 'No research results available for synthesis'
      });
      return;
    }

    try {
      const synthesisAgent = new AnalysisSynthesisAgent(
        domainFocus,
        availableResearchResults,
        contextDetails
      );

      const synthesisResult = await synthesisAgent.execute();
      
      this.stateManager.setSynthesisResult(synthesisResult);
      this.stateManager.updateAgentProgress('synthesis', {
        status: 'completed',
        progress: 100,
        message: 'Synthesis completed'
      });

      console.log('✅ Synthesis agent completed');
    } catch (error) {
      console.error('❌ Synthesis agent failed:', error);
      this.stateManager.updateAgentProgress('synthesis', {
        status: 'error',
        progress: 0,
        message: `Synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      throw error;
    }
  }

  private async generateHTMLReport(): Promise<string> {
    console.log('📄 Generating HTML report (O.1)...');
    
    this.stateManager.updateAgentProgress('html-generator', {
      status: 'running',
      progress: 50,
      message: 'Generating HTML report'
    });

    const state = this.stateManager.getState();
    
    // Check if we have synthesis result
    if (!state.synthesisResult) {
      console.log('⚠️ No synthesis result available, generating minimal report');
      const minimalHTML = `
        <html>
          <head><title>Defense AI Research Report</title></head>
          <body>
            <h1>Defense AI Research Report</h1>
            <p>Domain: ${state.userInput.domainFocus}</p>
            <p>Status: Workflow completed with partial results</p>
            <p>Some agents failed during execution. Please check the logs for details.</p>
          </body>
        </html>
      `;
      
      this.stateManager.setFinalHTML(minimalHTML);
      this.stateManager.updateAgentProgress('html-generator', {
        status: 'completed',
        progress: 100,
        message: 'Minimal HTML report generated'
      });
      
      return minimalHTML;
    }
    
    try {
      const htmlGenerator = new HTMLGeneratorAgent();
      const finalHTML = await htmlGenerator.generateReport(state.synthesisResult);
      
      this.stateManager.setFinalHTML(finalHTML);
      this.stateManager.updateAgentProgress('html-generator', {
        status: 'completed',
        progress: 100,
        message: 'HTML report generated'
      });

      console.log('✅ HTML report generated');
      return finalHTML;
    } catch (error) {
      console.error('❌ HTML generation failed:', error);
      this.stateManager.updateAgentProgress('html-generator', {
        status: 'error',
        progress: 0,
        message: `HTML generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      throw error;
    }
  }

  getStateManager(): WorkflowStateManager {
    return this.stateManager;
  }
}
