import { SynthesisOutput, ResearchAgentOutput, StartupFirmsOutput } from '../../../types/agents';
import { GeminiClient } from '../../utils/gemini-client';

export class AnalysisSynthesisAgent {
  private geminiClient: GeminiClient;

  constructor(
    private domainFocus: string,
    private allResearchOutputs: {
      policy: ResearchAgentOutput;
      primes: ResearchAgentOutput;
      startupVC: ResearchAgentOutput;
      startupFirms: StartupFirmsOutput;
      academic: ResearchAgentOutput;
    },
    private contextDetails?: string
  ) {
    this.geminiClient = new GeminiClient();
  }

  async execute(): Promise<SynthesisOutput> {
    console.log('🔬 Starting Analysis Synthesis Agent (G.11)');

    const prompt = `BLUF: You are an expert research analyst specializing in autonomous AI within the defense/national security/cyber domain.  For this task, here is the specific domain area to focus on: ${this.domainFocus}

////

CONTEXT:  
You are an expert research analyst specializing in autonomous AI within the defense/national security/cyber domain. Your task is the last step in a multi-step deep research process ultimately aimed at meticulously extracting and synthesizing key findings, trends, policies, technology, firms, geopolitics, and strategies from dozens of reputable sources online into a comprehensive on artificial intelligence (AI) autonomous systems, products, and services within this specific US national security domain: ${this.domainFocus}. 

${this.contextDetails ? `(Note: additional research context on this process, if present, will be seen here: ${this.contextDetails})` : ''}

Moreover, as mentioned above this the last step in the research process and the previous steps already provided you detailed research outputs each with their own unique focus: policy, major public firm trends, startup/VC trends, detailed analysis on specific firms/products in this space, and academic/think-tank insights. Such info is provided below, and you must closely look at this prepared research because it is the bedrock of this current task.

IMPORTANT: Do NOT be overly simple in research nor provide obvious, basic and surface-level insights. Assume you are writing for someone who is already an expert in ai autonomy and the specific domain, so please ensure you get in the weeds, your are clear in your writing when providing details, and capture deeper level nuances an expert would find helpful.

////

TASK:

You are an expert research analyst specializing in autonomous AI within the US defense domain. Your task is to meticulously extract and synthesize key findings, trends, policies, technology, firms, strategies, assumptions, whitespace opportunites, outlook factors, ect from the provided raw research outputs provided below into a synthesized, highly detailed, comprehensive, and well-sourced overarching analysis research report. The report must be structured logically to present a clear and insightful overview of the subject matter.

Step by Step instructions:  
1. Carefully read through ALL FIVE research reports provided that have 5 unique perspectives and analysis/research methodologies. Aim in this step is to understand the full scope of the research.  
2. Identify and extract all key findings related to autonomous AI, extracting 5 core insights into these categories: A: policy trends, B: major public firm trends C: startup/VC trends firms D: specific trends from the products/firms in this domain, E academic and think-tank research trends.....each of 5 should be explained in 30-40 words  
3. Create 10 cross-connecting insights based on similar or different or puzzling trends between at least 2 of the unique research reports....for each explain in 40-60 words  
4. Extract 10 of the highly detailed specifc cutting edge ai autonomy technology applications....for each explain in 40-60 words  
5. Begin structuring the analysis report by creating a heading for each category (e.g., "Policies," "Public Firms", etc.).  
6. Write a detailed analysis for each category, synthesizing the extracted information into coherent paragraphs. Ensure the analysis is comprehensive and insightful.  
7. After writing a section, review it to ensure it is highly detailed, well-sourced, and logically structured. If not, go back to step 2 for that section.  
8. Once all sections are complete, review the entire report to ensure overall comprehensiveness, logical flow, and adherence to the requirement of a highly detailed and well-sourced analysis report. 

Here are the 5 research reports:

"""

${this.formatAllResearchOutputs()}

"""`;

    try {
      const result = await this.geminiClient.generateWithSchema<SynthesisOutput>(
        prompt,
        this.getSynthesisSchema(),
        this.getSystemInstruction(),
        'prep'
      );

      console.log('✅ Analysis Synthesis Agent completed');
      return result;
    } catch (error) {
      console.error('❌ Analysis Synthesis Agent failed:', error);
      throw error;
    }
  }

  private formatAllResearchOutputs(): string {
    let output = '';

    // Policy Research Output
    output += '\n[G.6 Conduct Research: Policy]\n';
    output += this.allResearchOutputs.policy.findings.map((finding, i) => 
      `${i + 1}. ${finding.title} (${finding.source}, ${finding.date})\nBLUF: ${finding.bluf}\nSummary: ${finding.summary}`
    ).join('\n\n');

    // Primes Research Output
    output += '\n\n[G.7 Conduct Research: Primes]\n';
    output += this.allResearchOutputs.primes.findings.map((finding, i) => 
      `${i + 1}. ${finding.title} (${finding.source}, ${finding.date})\nBLUF: ${finding.bluf}\nSummary: ${finding.summary}`
    ).join('\n\n');

    // Startup/VC Research Output
    output += '\n\n[G.8 Conduct Research: Startup/VC]\n';
    output += this.allResearchOutputs.startupVC.findings.map((finding, i) => 
      `${i + 1}. ${finding.title} (${finding.source}, ${finding.date})\nBLUF: ${finding.bluf}\nSummary: ${finding.summary}`
    ).join('\n\n');

    // Startup Firms Research Output
    output += '\n\n[G.9 Conduct Research: Startup Firms]\n';
    output += 'Trends:\n' + this.allResearchOutputs.startupFirms.trends.map((trend, i) => 
      `${i + 1}. ${trend.trend}: ${trend.explanation}`
    ).join('\n');
    output += '\n\nSimilarities:\n' + this.allResearchOutputs.startupFirms.similarities.map((sim, i) => 
      `${i + 1}. ${sim.similarity}: ${sim.description}`
    ).join('\n');
    output += '\n\nDifferences:\n' + this.allResearchOutputs.startupFirms.differences.map((diff, i) => 
      `${i + 1}. ${diff.difference}: ${diff.description}`
    ).join('\n');
    output += '\n\nWhitespace:\n' + this.allResearchOutputs.startupFirms.whitespace.map((ws, i) => 
      `${i + 1}. ${ws.opportunity}: ${ws.description}`
    ).join('\n');
    output += '\n\nFuture Impacts:\n' + this.allResearchOutputs.startupFirms.futureImpacts.map((impact, i) => 
      `${i + 1}. ${impact.impact}: ${impact.description}`
    ).join('\n');

    // Academic Research Output
    output += '\n\n[G.10 Conduct Research: Academic]\n';
    output += this.allResearchOutputs.academic.findings.map((finding, i) => 
      `${i + 1}. ${finding.title} (${finding.source}, ${finding.date})\nBLUF: ${finding.bluf}\nSummary: ${finding.summary}`
    ).join('\n\n');

    return output;
  }

  private getSynthesisSchema(): any {
    return {
      type: "object",
      properties: {
        coreInsights: {
          type: "object",
          properties: {
            policyTrends: {
              type: "array",
              items: { type: "string" },
              description: "5 policy trend insights (30-40 words each)",
              minItems: 5,
              maxItems: 5
            },
            publicFirmTrends: {
              type: "array",
              items: { type: "string" },
              description: "5 major public firm trend insights (30-40 words each)",
              minItems: 5,
              maxItems: 5
            },
            startupVCTrends: {
              type: "array",
              items: { type: "string" },
              description: "5 startup/VC trend insights (30-40 words each)",
              minItems: 5,
              maxItems: 5
            },
            specificTrends: {
              type: "array",
              items: { type: "string" },
              description: "5 specific firm/product trend insights (30-40 words each)",
              minItems: 5,
              maxItems: 5
            },
            academicTrends: {
              type: "array",
              items: { type: "string" },
              description: "5 academic/think-tank trend insights (30-40 words each)",
              minItems: 5,
              maxItems: 5
            }
          },
          required: ["policyTrends", "publicFirmTrends", "startupVCTrends", "specificTrends", "academicTrends"]
        },
        crossConnections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              insight: { type: "string", description: "Cross-connecting insight title" },
              explanation: { type: "string", description: "40-60 word explanation of the connection" }
            },
            required: ["insight", "explanation"]
          },
          description: "10 cross-connecting insights between research reports",
          minItems: 10,
          maxItems: 10
        },
        techApplications: {
          type: "array",
          items: {
            type: "object",
            properties: {
              tech: { type: "string", description: "Technology application title" },
              explanation: { type: "string", description: "40-60 word detailed explanation" }
            },
            required: ["tech", "explanation"]
          },
          description: "10 cutting-edge AI autonomy technology applications",
          minItems: 10,
          maxItems: 10
        },
        structuredAnalysis: {
          type: "object",
          properties: {
            policies: { type: "string", description: "Comprehensive analysis of policy trends" },
            publicFirms: { type: "string", description: "Comprehensive analysis of public firm trends" },
            startupEcosystem: { type: "string", description: "Comprehensive analysis of startup/VC ecosystem" },
            specificFirms: { type: "string", description: "Comprehensive analysis of specific firms" },
            academicPerspectives: { type: "string", description: "Comprehensive analysis of academic insights" },
            synthesis: { type: "string", description: "Overall synthesis and key takeaways" }
          },
          required: ["policies", "publicFirms", "startupEcosystem", "specificFirms", "academicPerspectives", "synthesis"]
        }
      },
      required: ["coreInsights", "crossConnections", "techApplications", "structuredAnalysis"]
    };
  }

  private getSystemInstruction(): string {
    return "You are working as part of an AI system, so no chit-chat and no explaining what you're doing and why. DO NOT start with 'Okay', or 'Alright' or any preambles. Just the output, please.";
  }
} 