import { StartupFirmsOutput, PreparatoryAgentOutput, StartupFirm } from '../../../types/agents';
import { DeepResearchAgent } from '../../deep-research/agent-wrapper';
import { GeminiClient } from '../../utils/gemini-client';
import { formatStartupFirmsForPrompt } from '../../utils/file-parser';

export class StartupFirmsResearchAgent {
  protected deepResearch: DeepResearchAgent;
  protected geminiClient: GeminiClient;

  constructor(
    protected domainFocus: string,
    protected preparatoryData: PreparatoryAgentOutput,
    protected startupFirms: StartupFirm[],
    protected contextDetails?: string
  ) {
    this.deepResearch = new DeepResearchAgent(domainFocus, contextDetails);
    this.geminiClient = new GeminiClient();
  }

  async execute(): Promise<StartupFirmsOutput> {
    console.log('🏭 Starting Startup Firms Research Agent (G.9)');

    const firmsData = formatStartupFirmsForPrompt(this.startupFirms);

    const prompt = `BLUF: You are an expert research analyst specializing in autonomous AI within the defense/national security/cyber domain, with a specific research angle and focus that investigates this through the lens of select firms and their respective products in this domain. For this task, here is the specific domain area to focus on: ${this.domainFocus}
You can access to the following tools: "Search Web" and "Get Webpage" 

////

CONTEXT:  
You are an expert research analyst specializing in autonomous AI within the defense/national security/cyber domain. Your task is the midway through a multi-step deep research ultimately aimed at meticulously extracting and synthesizing key findings, trends, policies, technology, firms, geopolitics, and strategies from dozens of reputable sources online into a comprehensive on artificial intelligence (AI) autonomous systems, products, and services within this specific US national security domain: ${this.domainFocus}. 

${this.contextDetails ? `(Note: additional research context on this process, if present, will be seen here: ${this.contextDetails})` : ''}

Moreover, as mentioned above this is midway through the research process and the previous step already provided you research guidance, suggested questions to investigate, and other useful insights to help tee up and prepare this research task. Such info is provided below. You should closely look at this prepared info for you to help tailor and enhance your research. 

IMPORTANT: Do NOT be overly simple in research nor provide obvious, basic and surface-level insights. Assume you are writing for someone who is already an expert in ai autonomy and the specific domain, so please ensure you get in the weeds, your are clear in your writing when providing details, and capture deeper level nuances an expert would find helpful.

////

YOUR TASK:  
Conduct a highly detailed and sourced research on the startups & firms and their respective products/services in this domain with respect to ai autonomy. So you are conducting specialized research analysis focused the selected most active and relevant firms, and their respective products/services, in this domain (......note: see below the specific firms and respective products/services to assess), investigating the trends, similarities, differences, overall insights regarding what these firms doing, how they are creating solutions and addressing market pain points, their go-to-market strategies, their inferred assumptions underlying their thesis and problem-product fit, any commentary about the market landscape from execs at the firm, where and how they are deploying their investments, highly specific ai tech application, initiatives, business model, and importantly how they are using autonomous ai systems in this domain based on the provided firm/product data below.

////

OUTPUT:

1.) Identify 5 core key broad trends (collectively comparing/contrasting/analyzing, ect) based on the provided file/data on these firms and products in this domain. List these 5, with each 40-60 words explaining with additional details and nuances

2.) Research and identify 10 core similarities between a set of at least 2 firms/products in this domain, with a focus on similarities regarding specific tech stack, assumptions about market pain points, go-to-market strategy, feature vs platform, extent to which ai is autonomous, human-ai relationship, and other highly specific areas. Provide these 10 in a list, along with (40-60 word) detailed description and justification 

3.) Research and identify 10 core differences between a set of at least 2 firms/products in this domain, with a focus on differences/friction regarding specific tech stack, assumptions about market pain points, go-to-market strategy, feature vs platform, extent to which ai is autonomous, human-ai relationship, and other highly specific areas. Provide these 10 in a list, along with (40-60 word) detailed description and justification 

4.) Research and identify 10 notable absent applications and whitespace opportunities with a focus on similarities regarding specific tech stack, assumptions about market pain points, go-to-market strategy, feature vs platform, extent to which ai is autonomous, human-ai relationship, and other highly specific areas. Provide these 10 in a list, along with (40-60 word) detailed description and justification 

5.) Think deeply and in future mindset, and research and identify 5 possible future second order impacts in next 3-8 based on what these firms are doing (or not doing) and the possible inferred impacts, new opportunties or new pain pain points in this market, with a focus on similarities regarding specific tech stack, assumptions about market pain points, go-to-market strategy, feature vs platform, extent to which ai is autonomous, human-ai relationship, and other highly specific areas. Provide these 5 in a list, along with (40-60 word) detailed description and justification 

/////

////  
Below is the (A) prepared pre-research info and (B) firms and products to analyze:

(A): Here is the prepared pre-research info to help tee up and prepare this research task. Again, you should closely look at this prepared info for you to help tailor and enhance your research, but you are not limited only using these questions, but should rather help provide the detailed framework guiding this task: ${this.formatPreparatoryData()}

(B): Here are the firms and products to analyze: ${firmsData}`;

    // Use deep research to gather comprehensive insights about these specific firms
    console.log('🔬 Conducting deep research on specific startup firms...');
    const researchQuery = `
Deep analysis of specific startup firms in ${this.domainFocus} autonomous AI domain:
${this.startupFirms.map(firm => `- ${firm.name}: ${firm.description || 'No description'}`).join('\n')}

Research focus:
- Comparative analysis of technology stacks and AI autonomy approaches
- Go-to-market strategies and market positioning
- Business models and competitive advantages
- Market gaps and whitespace opportunities
- Future implications and trends
    `.trim();

    const researchResult = await this.deepResearch.research({
      query: researchQuery,
      breadth: 4,
      depth: 2,
      context: this.formatPreparatoryData()
    });

    console.log('📊 Processing research results...');

    // Custom schema for startup firms output
    const schema = {
      type: "object",
      properties: {
        trends: {
          type: "array",
          items: {
            type: "object",
            properties: {
              trend: { type: "string", description: "Broad trend description" },
              explanation: { type: "string", description: "40-60 word detailed explanation" }
            },
            required: ["trend", "explanation"]
          },
          description: "5 core key broad trends",
          minItems: 5,
          maxItems: 5
        },
        similarities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              similarity: { type: "string", description: "Core similarity description" },
              description: { type: "string", description: "40-60 word detailed description and justification" }
            },
            required: ["similarity", "description"]
          },
          description: "10 core similarities between firms",
          minItems: 10,
          maxItems: 10
        },
        differences: {
          type: "array",
          items: {
            type: "object",
            properties: {
              difference: { type: "string", description: "Core difference description" },
              description: { type: "string", description: "40-60 word detailed description and justification" }
            },
            required: ["difference", "description"]
          },
          description: "10 core differences between firms",
          minItems: 10,
          maxItems: 10
        },
        whitespace: {
          type: "array",
          items: {
            type: "object",
            properties: {
              opportunity: { type: "string", description: "Whitespace opportunity description" },
              description: { type: "string", description: "40-60 word detailed description and justification" }
            },
            required: ["opportunity", "description"]
          },
          description: "10 notable absent applications and whitespace opportunities",
          minItems: 10,
          maxItems: 10
        },
        futureImpacts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              impact: { type: "string", description: "Future impact description" },
              description: { type: "string", description: "40-60 word detailed description and justification" }
            },
            required: ["impact", "description"]
          },
          description: "5 possible future second order impacts",
          minItems: 5,
          maxItems: 5
        }
      },
      required: ["trends", "similarities", "differences", "whitespace", "futureImpacts"]
    };

    // Structure the research into the required format
    const structurePrompt = `
Based on the comprehensive research conducted, analyze the specific startup firms and their products/services in the ${this.domainFocus} autonomous AI domain.

Research Findings:
${researchResult.learnings.map((learning, i) => `${i + 1}. ${learning}`).join('\n')}

Firms being analyzed:
${firmsData}

Create the analysis following the exact output format specified, focusing on trends, similarities, differences, whitespace opportunities, and future impacts.
    `.trim();

    try {
      const result = await this.geminiClient.generateWithSchema<StartupFirmsOutput>(
        structurePrompt,
        this.getStartupFirmsSchema(),
        this.getSystemInstruction(),
        'research'
      );

      console.log('✅ Startup Firms Research Agent completed');
      return result;
    } catch (error) {
      console.error('❌ Startup Firms Research Agent failed:', error);
      throw error;
    }
  }

  private getSystemInstruction(): string {
    return "You are working as part of an AI system, so no chit-chat and no explaining what you're doing and why. DO NOT start with 'Okay', or 'Alright' or any preambles. Just the output, please.";
  }

  private getStartupFirmsSchema(): any {
    return {
      type: "object",
      properties: {
        trends: {
          type: "array",
          items: {
            type: "object",
            properties: {
              trend: { type: "string", description: "Broad trend identified" },
              explanation: { type: "string", description: "Detailed explanation (40-60 words)" }
            },
            required: ["trend", "explanation"]
          },
          description: "5 core key broad trends",
          minItems: 5,
          maxItems: 5
        },
        similarities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              similarity: { type: "string", description: "Similarity between firms" },
              description: { type: "string", description: "Detailed description (40-60 words)" }
            },
            required: ["similarity", "description"]
          },
          description: "10 core similarities between firms",
          minItems: 10,
          maxItems: 10
        },
        differences: {
          type: "array",
          items: {
            type: "object",
            properties: {
              difference: { type: "string", description: "Difference between firms" },
              description: { type: "string", description: "Detailed description (40-60 words)" }
            },
            required: ["difference", "description"]
          },
          description: "10 core differences between firms",
          minItems: 10,
          maxItems: 10
        },
        whitespace: {
          type: "array",
          items: {
            type: "object",
            properties: {
              opportunity: { type: "string", description: "Whitespace opportunity" },
              description: { type: "string", description: "Detailed description (40-60 words)" }
            },
            required: ["opportunity", "description"]
          },
          description: "10 notable absent applications and whitespace opportunities",
          minItems: 10,
          maxItems: 10
        },
        futureImpacts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              impact: { type: "string", description: "Future impact prediction" },
              description: { type: "string", description: "Detailed description (40-60 words)" }
            },
            required: ["impact", "description"]
          },
          description: "5 possible future second order impacts",
          minItems: 5,
          maxItems: 5
        }
      },
      required: ["trends", "similarities", "differences", "whitespace", "futureImpacts"]
    };
  }

  protected formatPreparatoryData(): string {
    return `
Preparatory Research Context:

Core Concepts & Relationships:
${this.preparatoryData.coreConceptsRelationships.map((item, i) => `${i + 1}. ${item.concept}: ${item.description}`).join('\n')}

Information Needs:
${this.preparatoryData.infoNeeds.map((item, i) => `${i + 1}. ${item.need} - ${item.justification}`).join('\n')}

Key Sub-Questions:
${this.preparatoryData.keySubQuestions.map((item, i) => `${i + 1}. ${item.question} - ${item.justification}`).join('\n')}

Implicit Questions:
${this.preparatoryData.implicitQuestions.map((item, i) => `${i + 1}. ${item.question} - ${item.justification}`).join('\n')}
    `.trim();
  }
} 