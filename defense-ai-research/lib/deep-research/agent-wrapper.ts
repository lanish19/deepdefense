import { deepResearch, generateReport } from './deep-research';

export interface ResearchParams {
  query: string;
  breadth?: number;
  depth?: number;
  context?: string;
}

export interface ResearchResult {
  learnings: string[];
  visitedUrls: string[];
  report?: string;
}

export class DeepResearchAgent {
  constructor(
    private domain: string,
    private context?: string
  ) {}

  async research(params: ResearchParams): Promise<ResearchResult> {
    const { query, breadth = 3, depth = 2 } = params;
    
    // Enhance query with domain context
    const enhancedQuery = `
${query}

Domain Focus: ${this.domain}
${this.context ? `Additional Context: ${this.context}` : ''}
    `.trim();

    console.log(`🔬 Starting deep research for domain: ${this.domain}`);
    console.log(`📋 Query: ${query}`);
    
    try {
      const result = await deepResearch({
        query: enhancedQuery,
        breadth,
        depth,
        learnings: [],
        visitedUrls: []
      });

      return {
        learnings: result.learnings,
        visitedUrls: result.visitedUrls
      };
    } catch (error) {
      console.error('Error in deep research:', error);
      return {
        learnings: [],
        visitedUrls: []
      };
    }
  }

  async generateReport(params: ResearchParams & { learnings: string[]; visitedUrls: string[] }): Promise<string> {
    const { query, learnings, visitedUrls } = params;
    
    // Enhance query with domain context
    const enhancedQuery = `
${query}

Domain Focus: ${this.domain}
${this.context ? `Additional Context: ${this.context}` : ''}
    `.trim();

    try {
      return await generateReport({
        prompt: enhancedQuery,
        learnings,
        visitedUrls
      });
    } catch (error) {
      console.error('Error generating report:', error);
      return `# Research Report\n\nError generating report: ${error}\n\n## Learnings\n${learnings.map(l => `- ${l}`).join('\n')}`;
    }
  }
} 