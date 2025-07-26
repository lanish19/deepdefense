import { PreparatoryAgentOutput } from '../../../types/agents';
import { BasePreparatoryAgent } from './base';

export class PreAcademiaAgent extends BasePreparatoryAgent {
  async execute(): Promise<PreparatoryAgentOutput> {
    console.log('🎓 Starting Pre-Academia Agent (G.5)');

    const prompt = `Use following tools: "Search Web" and "Get Webpage" for this task seen below:

////

CONTEXT:  
You are an expert research analyst specializing in autonomous AI within the defense/national security/cyber domain. Your task is the first of many in a multi-step deep research ultimately aimed at meticulously extracting and synthesizing key findings, trends, policies, technology, firms, geopolitics, and strategies from dozens of reputable sources online into a comprehensive on artificial intelligence (AI) autonomous systems, products, and services within this specific US national security domain: ${this.domainFocus}. 

${this.contextDetails ? `(Note: additional research context on this process, if present, will be seen here: ${this.contextDetails})` : ''}

////

YOUR TASK:  
Since you are conducting the first step in this national security ai-autonomy research process, your task is only aimed at helping prepare, plan, and tee-up the following deep research phase. To do so, please research online (use tools: "Search Web" and "Get Webpage") and come up with a plan for your academia & think-tank focused researcher colleague performing the following intent of conducting specialized research analysis focused academic and think tank insights and reports in this domain (${this.domainFocus}), exploring what academics, experts, and think tanks are saying with respect to the technology, trends, policy, and analysis in this space.

////

OUTPUT:

1.) Identify 10 core concepts and relationships based on the provided file/data on these firms and products in this domain. List these 10, each 10-20 words.

2.) Identify 10 info needs the gathered evidence and insights the following research step must address to ensure analysis and research is robust.  List these 10, each 20-40 words, explaining why it is a info gap or an area to dig deeper.

3.) Research online 10 key sub-questions that would generate highly insightful research outputs that are at a deep and expert (not simple and non-surface level). Provide these 10 in a list, along with short (20-40 word) description and justification for each why this question would be useful. 

4.) Identify 5 implicit questions that would generate highly insightful research outputs that are at a deep and expert (not simple and non-surface level). Provide these 5 in a list, along with short (20-40 word) description and justification for each why this question would be useful.`;

    // Perform web searches to gather context
    const searchQueries = [
      `${this.domainFocus} AI research universities think tanks`,
      `academic papers artificial intelligence ${this.domainFocus} defense`,
      `think tank reports autonomous systems ${this.domainFocus}`,
      `research institutions AI policy ${this.domainFocus} analysis`
    ];

    const searchResults = await this.performWebSearch(searchQueries);
    const searchContext = searchResults.map(result => result.markdown || result.content || '').join('\n\n');

    const enhancedPrompt = prompt + `\n\nContext from web research:\n${searchContext}`;

    try {
      const result = await this.geminiClient.generateWithSchema<PreparatoryAgentOutput>(
        enhancedPrompt,
        this.getPreparatorySchema(),
        this.getSystemInstruction(),
        'prep'
      );

      console.log('✅ Pre-Academia Agent completed');
      return result;
    } catch (error) {
      console.error('❌ Pre-Academia Agent failed:', error);
      throw error;
    }
  }
} 