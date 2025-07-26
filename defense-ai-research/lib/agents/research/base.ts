import { PreparatoryAgentOutput, ResearchAgentOutput, StartupFirmsOutput } from '../../../types/agents';
import { DeepResearchAgent } from '../../deep-research/agent-wrapper';
import { GeminiClient } from '../../utils/gemini-client';

export abstract class BaseResearchAgent {
  protected deepResearch: DeepResearchAgent;
  protected geminiClient: GeminiClient;

  constructor(
    protected domainFocus: string,
    protected preparatoryData: PreparatoryAgentOutput,
    protected contextDetails?: string
  ) {
    this.deepResearch = new DeepResearchAgent(domainFocus, contextDetails);
    this.geminiClient = new GeminiClient();
  }

  abstract execute(): Promise<ResearchAgentOutput | StartupFirmsOutput>;

  protected getSystemInstruction(): string {
    return "You are working as part of an AI system, so no chit-chat and no explaining what you're doing and why. DO NOT start with 'Okay', or 'Alright' or any preambles. Just the output, please.";
  }

  protected getResearchSchema() {
    return {
      type: "object",
      properties: {
        findings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Title of the finding/report" },
              source: { type: "string", description: "Source name" },
              date: { type: "string", description: "Date of publication" },
              bluf: { type: "string", description: "One sentence bottom line up front" },
              summary: { type: "string", description: "50-70 word summary" }
            },
            required: ["title", "source", "date", "bluf", "summary"]
          },
          description: "25 unique and most important findings",
          minItems: 25,
          maxItems: 25
        }
      },
      required: ["findings"]
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