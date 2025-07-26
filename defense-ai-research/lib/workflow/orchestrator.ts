import { UserInput, StartupFirm } from '../../types/agents';
import { WorkflowStateManager } from './state-manager';
import { parseStartupFirmsFile } from '../utils/file-parser';

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

  constructor(userInput: UserInput) {
    this.stateManager = new WorkflowStateManager({ userInput });
  }

  async execute(): Promise<string> {
    console.log('🚀 Starting Defense AI Research Workflow');
    console.log(`📋 Domain Focus: ${this.stateManager.getState().userInput.domainFocus}`);

    try {
      // Step 1: Parse startup firms file if provided
      await this.parseStartupFirmsFile();

      // Step 2: Run preparatory agents in parallel
      await this.runPreparatoryAgents();

      // Step 3: Run research agents with preparatory data
      await this.runResearchAgents();

      // Step 4: Run synthesis agent
      await this.runSynthesisAgent();

      // Step 5: Generate HTML report
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

    // Run agents in parallel
    const results = await Promise.all(
      agents.map(async ({ id, name, agent }) => {
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

          return { id, result };
        } catch (error) {
          this.stateManager.updateAgentProgress(id, {
            status: 'error',
            progress: 0,
            message: `${name} Agent failed`
          });
          throw error;
        }
      })
    );

    // Store results
    results.forEach(({ id, result }) => {
      const agentType = id.replace('pre-', '');
      this.stateManager.setPreparatoryResult(agentType, result);
    });

    console.log('✅ All preparatory agents completed');
  }

  private async runResearchAgents(): Promise<void> {
    console.log('🔬 Running research agents (G.6-G.10)...');
    
    const state = this.stateManager.getState();
    const { domainFocus, contextDetails } = state.userInput;
    const { preparatoryResults } = state;

    // Initialize research agents
    const agents = [
      { 
        id: 'policy-research', 
        name: 'Policy Research', 
        agent: new PolicyResearchAgent(domainFocus, preparatoryResults.prePolicy!, contextDetails) 
      },
      { 
        id: 'primes-research', 
        name: 'Primes Research', 
        agent: new PrimesResearchAgent(domainFocus, preparatoryResults.prePrimes!, contextDetails) 
      },
      { 
        id: 'startup-vc-research', 
        name: 'Startup/VC Research', 
        agent: new StartupVCResearchAgent(domainFocus, preparatoryResults.preStartupVC!, contextDetails) 
      },
      { 
        id: 'startup-firms-research', 
        name: 'Startup Firms Research', 
        agent: new StartupFirmsResearchAgent(domainFocus, preparatoryResults.preStartupFirms!, this.startupFirms, contextDetails) 
      },
      { 
        id: 'academic-research', 
        name: 'Academic Research', 
        agent: new AcademicResearchAgent(domainFocus, preparatoryResults.preAcademia!, contextDetails) 
      }
    ];

    // Set initial progress
    agents.forEach(({ id, name }) => {
      this.stateManager.updateAgentProgress(id, {
        status: 'pending',
        progress: 0,
        message: `Waiting to start ${name} Agent`
      });
    });

    // Run agents sequentially to avoid rate limits (deep research is intensive)
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

        // Store result
        const agentType = id.replace('-research', '').replace('-', '');
        this.stateManager.setResearchResult(agentType, result);
      } catch (error) {
        this.stateManager.updateAgentProgress(id, {
          status: 'error',
          progress: 0,
          message: `${name} Agent failed`
        });
        throw error;
      }
    }

    console.log('✅ All research agents completed');
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

    try {
      const synthesisAgent = new AnalysisSynthesisAgent(
        domainFocus,
        {
          policy: researchResults.policy!,
          primes: researchResults.primes!,
          startupVC: researchResults.startupVC!,
          startupFirms: researchResults.startupFirms!,
          academic: researchResults.academic!
        },
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
      this.stateManager.updateAgentProgress('synthesis', {
        status: 'error',
        progress: 0,
        message: 'Synthesis failed'
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
    
    try {
      const htmlGenerator = new HTMLGeneratorAgent();
      const finalHTML = await htmlGenerator.generateReport(state.synthesisResult!);
      
      this.stateManager.setFinalHTML(finalHTML);
      this.stateManager.updateAgentProgress('html-generator', {
        status: 'completed',
        progress: 100,
        message: 'HTML report generated'
      });

      console.log('✅ HTML report generated');
      return finalHTML;
    } catch (error) {
      this.stateManager.updateAgentProgress('html-generator', {
        status: 'error',
        progress: 0,
        message: 'HTML generation failed'
      });
      throw error;
    }
  }

  getStateManager(): WorkflowStateManager {
    return this.stateManager;
  }
} 