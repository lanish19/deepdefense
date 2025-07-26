import { PreparatoryAgentOutput } from '../../../types/agents';
import { BasePreparatoryAgent } from './base';
import { formatStartupFirmsForPrompt } from '../../utils/file-parser';

export class PreStartupFirmsAgent extends BasePreparatoryAgent {
  async execute(): Promise<PreparatoryAgentOutput> {
    console.log('🏭 Starting Pre-Startup Firms Agent (G.4)');

    const firmsData = this.startupFirms ? formatStartupFirmsForPrompt(this.startupFirms) : 'No startup firms data provided';

    const prompt = `Use following tools: "Search Web" and "Get Webpage" for this task seen below:

////

CONTEXT:  
You are an expert research analyst specializing in autonomous AI within the defense/national security/cyber domain. Your task is the first of many in a multi-step deep research ultimately aimed at meticulously extracting and synthesizing key findings, trends, policies, technology, firms, geopolitics, and strategies from dozens of reputable sources online into a comprehensive on artificial intelligence (AI) autonomous systems, products, and services within this specific US national security domain: ${this.domainFocus}. 

${this.contextDetails ? `(Note: additional research context on this process, if present, will be seen here: ${this.contextDetails})` : ''}

////

YOUR TASK:  
Since you are conducting the first step in this national security ai-autonomy research process, your task is only aimed at helping prepare, plan, and tee-up the following deep research phase. To do so, please take a deep breath and assess closely the specific firms and respective products/services in this domain along supplementing your research online (use tools: "Search Web" and "Get Webpage") and come up with a research plan for the following startup deep research task performing the following intent: conducting specialized research analysis focused the selected most active and relevant firms, and their respective products/services, in this domain (${this.domainFocus}......note: see below the specific firms and respective products/services to assess), investigating the trends, similarities, differences, overall insights regarding what these firms doing, how they are creating solutions and addressing market pain points, their go-to-market strategies, their inferred assumptions underlying their thesis and problem-product fit, any commentary about the market landscape from execs at the firm, where and how they are deploying their investments, highly specific ai tech application, initiatives, business model, and importantly how they are using autonomous ai systems in this domain based on the provided firm/product data below

////

OUTPUT:

1.) Identify 10 core concepts and relationships based on the provided file/data on these firms and products in this domain. List these 10, each 10-20 words.

2.) Identify 10 info needs (ie info gaps) or areas to investigate in deep detail the following research step must address to ensure analysis and research comparing/contrasting/analyzing these firms collectively is robust. List these 10, each 20-40 words, explaining why it is a info gap or an area to dig deeper.

3.) Research 10 key sub-questions that would generate highly insightful research prompts and subsequent outputs that specifically investigate the core similarities among these products/firms in this domain, with a focus on similarities regarding specific tech stack, assumptions about market pain points, go-to-market strategy, feature vs platform, extent to which ai is autonomous, human-ai relationship, and other highly specific areas. Provide these 10 in a list, along with short (20-40 word) description and justification for each why this prompt would be useful and how it interconnects more than two firms/products and how it would lead to useful outputs if answered

4.) Research 10 key sub-questions that would generate highly insightful research prompts and subsequent outputs that specifically investigate the core differences among these products/firms in this domain, with a focus on differences regarding specific tech stack, assumptions about market pain points, go-to-market strategy, feature vs platform, extent to which ai is autonomous, human-ai relationship, and other highly specific areas. Provide these 10 in a list, along with short (20-40 word) description and justification for each why this prompt would be useful and how it interconnects more than two firms/products and how it would lead to useful outputs if answered

5.) Identify 5 implicit questions that may generate highly impactful yet subtle, easily overlooked insights regarding the current state of play and outlook and trajectory of firm and product landscape in this domain regarding ai autonomy. Provide these 5 in a list, along with short (20-40 word) description and justification for each why this question would be useful.

/////

As stated above, here are the firms and products to analyze: ${firmsData}`;

    // Perform web searches to gather context
    const searchQueries = [
      `startup firms ${this.domainFocus} AI autonomous systems`,
      `AI startups ${this.domainFocus} defense technology`,
      `autonomous AI companies ${this.domainFocus} market analysis`,
      `startup ecosystem ${this.domainFocus} artificial intelligence trends`
    ];

    console.log('🔍 Performing web searches for startup firms context...');
    const searchResults = await this.performWebSearch(searchQueries);
    const searchContext = searchResults.map(result => result.markdown || result.content || '').join('\n\n');

    const enhancedPrompt = prompt + `\n\nWEB RESEARCH CONTEXT:\n${searchContext}\n\nUse this web research context to inform your analysis and recommendations.`;

    try {
      const result = await this.geminiClient.generateWithSchema<PreparatoryAgentOutput>(
        enhancedPrompt,
        this.getPreparatorySchema(),
        this.getSystemInstruction(),
        'prep'
      );

      console.log('✅ Pre-Startup Firms Agent completed');
      return result;
    } catch (error) {
      console.error('❌ Pre-Startup Firms Agent failed:', error);
      throw error;
    }
  }
}
