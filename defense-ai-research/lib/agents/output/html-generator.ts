import { SynthesisOutput } from '../../../types/agents';
import { GeminiClient } from '../../utils/gemini-client';

export class HTMLGeneratorAgent {
  private geminiClient: GeminiClient;

  constructor() {
    this.geminiClient = new GeminiClient();
  }

  async generateReport(synthesis: SynthesisOutput): Promise<string> {
    console.log('📄 Starting HTML Generator Agent (O.1)');

    const prompt = `Generate a complete HTML webpage to display a comprehensive analysis report. The webpage should feature a clean, modern, and responsive layout that adapts well to different screen sizes. It should include a sticky header with a title and navigation links, a main content area for the detailed report, and a footer with copyright information. The report content should be presented in an easily readable format, utilizing appropriate headings (H1, H2, H3), paragraphs, bullet points, and potentially interactive data tables or charts for clarity. Implement smooth scrolling for navigation links and a 'back to top' button for long reports.   
Synthesize_research_report: ${this.formatSynthesisData(synthesis)}`;

    const systemPrompt = `You are an AI Web Developer. Your task is to generate a single, self-contained HTML document for rendering in an iframe, based on user instructions and data.

**Visual aesthetic:**  
    * Aesthetics are crucial. Make the page look amazing, especially on mobile.  
    * Respect any instructions on style, color palette, or reference examples provided by the user.  
**Design and Functionality:**  
    * Thoroughly analyze the user's instructions to determine the desired type of webpage, application, or visualization. What are the key features, layouts, or functionality?  
    * Analyze any provided data to identify the most compelling layout or visualization of it. For example, if the user requests a visualization, select an appropriate chart type (bar, line, pie, scatter, etc.) to create the most insightful and visually compelling representation. Or if user instructions say \`use a carousel format\`, you should consider how to break the content and any media into different card components to display within the carousel.  
    * If requirements are underspecified, make reasonable assumptions to complete the design and functionality. Your goal is to deliver a working product with no placeholder content.  
    * Ensure the generated code is valid and functional. Return only the code, and open the HTML codeblock with the literal string "\`\`\`html".  
    * The output must be a complete and valid HTML document with no placeholder content for the developer to fill in.

**Libraries:**  
  Unless otherwise specified, use:  
    * Tailwind for CSS`;

    try {
      const result = await this.geminiClient.generateText(prompt, systemPrompt, 'research');
      const htmlMatch = result.match(/```html\n([\s\S]*)\n```/);
      const htmlContent = htmlMatch ? htmlMatch[1] : result;
      return htmlContent;
    } catch (error) {
      console.error('Error generating HTML report:', error);
      return `<html><body><h1>Error generating report</h1><p>${error}</p></body></html>`;
    }
  }

  private formatSynthesisData(synthesis: SynthesisOutput): string {
    return `
# Comprehensive AI Autonomy Analysis Report

## Core Insights by Category

### Policy Trends
${synthesis.coreInsights.policyTrends.map((trend, i) => `${i + 1}. ${trend}`).join('\n')}

### Major Public Firm Trends
${synthesis.coreInsights.publicFirmTrends.map((trend, i) => `${i + 1}. ${trend}`).join('\n')}

### Startup/VC Trends
${synthesis.coreInsights.startupVCTrends.map((trend, i) => `${i + 1}. ${trend}`).join('\n')}

### Specific Firm/Product Trends
${synthesis.coreInsights.specificTrends.map((trend, i) => `${i + 1}. ${trend}`).join('\n')}

### Academic/Think-Tank Trends
${synthesis.coreInsights.academicTrends.map((trend, i) => `${i + 1}. ${trend}`).join('\n')}

## Cross-Connecting Insights
${synthesis.crossConnections.map((connection, i) => `${i + 1}. **${connection.insight}**: ${connection.explanation}`).join('\n')}

## Cutting-Edge Technology Applications
${synthesis.techApplications.map((tech, i) => `${i + 1}. **${tech.tech}**: ${tech.explanation}`).join('\n')}

## Detailed Analysis

### Policies
${synthesis.structuredAnalysis.policies}

### Public Firms
${synthesis.structuredAnalysis.publicFirms}

### Startup Ecosystem
${synthesis.structuredAnalysis.startupEcosystem}

### Specific Firms Analysis
${synthesis.structuredAnalysis.specificFirms}

### Academic Perspectives
${synthesis.structuredAnalysis.academicPerspectives}

### Executive Summary
${synthesis.structuredAnalysis.synthesis}
    `.trim();
  }
} 