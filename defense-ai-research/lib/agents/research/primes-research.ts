import { ResearchAgentOutput } from '../../../types/agents';
import { BaseResearchAgent } from './base';

export class PrimesResearchAgent extends BaseResearchAgent {
  async execute(): Promise<ResearchAgentOutput> {
    console.log('🏢 Starting Primes Research Agent (G.7)');

    const prompt = `BLUF: You are an expert research analyst specializing in autonomous AI within the defense/national security/cyber domain, with a specific research angle and focus that investigates this through the lens of the major, most active public firms in this domain. For this task, here is the specific domain area to focus on: ${this.domainFocus}
You can access to the following tools: "Search Web" and "Get Webpage" 

////

CONTEXT:  
You are an expert research analyst specializing in autonomous AI within the defense/national security/cyber domain. Your task is the midway through a multi-step deep research ultimately aimed at meticulously extracting and synthesizing key findings, trends, policies, technology, firms, geopolitics, and strategies from dozens of reputable sources online into a comprehensive on artificial intelligence (AI) autonomous systems, products, and services within this specific US national security domain: ${this.domainFocus}. 

${this.contextDetails ? `(Note: additional research context on this process, if present, will be seen here: ${this.contextDetails})` : ''}

Moreover, as mentioned above this is midway through the research process and the previous step already provided you research guidance, suggested questions to investigate, and other useful insights to help tee up and prepare this research task. Such info is provided below. You should closely look at this prepared info for you to help tailor and enhance your research. 

IMPORTANT: Do NOT be overly simple in research nor provide obvious, basic and surface-level insights. Assume you are writing for someone who is already an expert in ai autonomy and the specific domain, so please ensure you get in the weeds, your are clear in your writing when providing details, and capture deeper level nuances an expert would find helpful.

////

YOUR TASK:

Conduct a highly detailed and sourced research analysis on trends, policies, technology, firms, geopolitics, and strategies specifically regarding autonomous AI within the provided US defense domain area see above. For this task, your process will focused and specialized on this perspective: major public defense and/or cyber firms within this domain examining the go-to-market strategies, commentary, investments, new tech, and initiatives of these firms in the US and allied nations.

The overall process should break down the analysis, frame it, research, synthesize, find gaps, and send back a sources report with this structure:

25 unique and most important and relevant key detailed points with each point clearly numbered, and each with title of report from source, source name, date of publication, one sentence bottom line up front, and 50-70 word summary

////

Here is the prepared pre-research info to help tee up and prepare this research task. Again, you should closely look at this prepared info for you to help tailor and enhance your research, but you are not limited only using these questions, but should rather help provide the detailed framework guiding this task: ${this.formatPreparatoryData()}`;

    // Use deep research to gather comprehensive insights
    console.log('🔬 Conducting deep research on major defense firms...');
    const researchQuery = `
Major public defense and cyber firms perspective on autonomous AI systems in ${this.domainFocus} domain:
- Go-to-market strategies for AI systems
- Investment patterns and new technology initiatives
- Public firm commentary on market trends
- Strategic partnerships and acquisitions
- Technology development and product launches
    `.trim();

    const researchResult = await this.deepResearch.research({
      query: researchQuery,
      breadth: 4,
      depth: 2,
      context: this.formatPreparatoryData()
    });

    console.log('📊 Processing research results...');

    // Transform research learnings into structured findings
    const structurePrompt = `
Based on the comprehensive research conducted, create 25 unique and most important key detailed points about major public defense firms' activities in autonomous AI within the ${this.domainFocus} domain.

Research Findings:
${researchResult.learnings.map((learning, i) => `${i + 1}. ${learning}`).join('\n')}

Sources:
${researchResult.visitedUrls.join('\n')}

Format each finding with:
- Title of the finding/report
- Source name  
- Date of publication
- One sentence bottom line up front
- 50-70 word summary

Focus on major public defense contractors like Lockheed Martin, Raytheon, Boeing, Northrop Grumman, and their go-to-market strategies, investments, technology initiatives, and market commentary.
    `.trim();

    try {
      const result = await this.geminiClient.generateWithSchema<ResearchAgentOutput>(
        structurePrompt,
        this.getResearchSchema(),
        this.getSystemInstruction(),
        'research'
      );

      console.log('✅ Primes Research Agent completed');
      return result;
    } catch (error) {
      console.error('❌ Primes Research Agent failed:', error);
      throw error;
    }
  }
} 