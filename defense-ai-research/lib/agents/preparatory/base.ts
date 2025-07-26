import { PreparatoryAgentOutput, StartupFirm } from '../../../types/agents';
import { GeminiClient } from '../../utils/gemini-client';
import FirecrawlApp from '@mendable/firecrawl-js';

export abstract class BasePreparatoryAgent {
  protected geminiClient: GeminiClient;
  protected firecrawl: FirecrawlApp;

  constructor(
    protected domainFocus: string,
    protected contextDetails?: string,
    protected startupFirms?: StartupFirm[]
  ) {
    this.geminiClient = new GeminiClient();
    this.firecrawl = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_KEY ?? '',
      apiUrl: process.env.FIRECRAWL_BASE_URL,
    });
  }

  abstract execute(): Promise<PreparatoryAgentOutput>;

  protected async performWebSearch(queries: string[]): Promise<any[]> {
    const results = [];
    
    for (const query of queries) {
      try {
        console.log(`🔍 Searching: ${query}`);
        const result = await this.firecrawl.search(query, {
          timeout: 30000,
          limit: 3,
          scrapeOptions: { formats: ['markdown'] },
        });
        
        if (result.data && result.data.length > 0) {
          results.push(...result.data);
        }
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Search error for query "${query}":`, error);
      }
    }
    
    return results;
  }

  protected getSystemInstruction(): string {
    return "You are working as part of an AI system, so no chit-chat and no explaining what you're doing and why. DO NOT start with 'Okay', or 'Alright' or any preambles. Just the output, please.";
  }

  protected getPreparatorySchema() {
    return {
      type: "object",
      properties: {
        coreConceptsRelationships: {
          type: "array",
          items: {
            type: "object",
            properties: {
              concept: { type: "string", description: "Core concept (10-20 words)" },
              description: { type: "string", description: "Brief description" }
            },
            required: ["concept", "description"]
          },
          description: "10 core concepts and relationships",
          minItems: 10,
          maxItems: 10
        },
        infoNeeds: {
          type: "array",
          items: {
            type: "object", 
            properties: {
              need: { type: "string", description: "Information need" },
              justification: { type: "string", description: "Why this is an info gap (20-40 words)" }
            },
            required: ["need", "justification"]
          },
          description: "10 information needs",
          minItems: 10,
          maxItems: 10
        },
        keySubQuestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string", description: "Key sub-question" },
              justification: { type: "string", description: "Justification for this question (20-40 words)" }
            },
            required: ["question", "justification"]
          },
          description: "10 key sub-questions",
          minItems: 10,
          maxItems: 10
        },
        implicitQuestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string", description: "Implicit question" },
              justification: { type: "string", description: "Justification for this question (20-40 words)" }
            },
            required: ["question", "justification"]
          },
          description: "5 implicit questions",
          minItems: 5,
          maxItems: 5
        }
      },
      required: ["coreConceptsRelationships", "infoNeeds", "keySubQuestions", "implicitQuestions"]
    };
  }
} 