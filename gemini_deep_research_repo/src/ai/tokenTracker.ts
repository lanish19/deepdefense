import { EventEmitter } from 'events';

type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
};

export class TokenTracker extends EventEmitter {
  private totalUsage: TokenUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    estimatedCost: 0
  };

  updateUsage(usageMetadata: { 
    promptTokenCount: number; 
    candidatesTokenCount: number; 
    totalTokenCount: number;
  }, logIndividual: boolean = true) {
    this.totalUsage.promptTokens += usageMetadata.promptTokenCount;
    this.totalUsage.completionTokens += usageMetadata.candidatesTokenCount;
    this.totalUsage.totalTokens += usageMetadata.totalTokenCount;
    
    // Get pricing from environment variables (fallbacks provided)
    const inputCostRate = parseFloat(process.env.GEMINI_INPUT_COST_PER_MILLION || "0.10");
    const outputCostRate = parseFloat(process.env.GEMINI_OUTPUT_COST_PER_MILLION || "0.40");
    
    const inputCost = (usageMetadata.promptTokenCount / 1_000_000) * inputCostRate;
    const outputCost = (usageMetadata.candidatesTokenCount / 1_000_000) * outputCostRate;
    this.totalUsage.estimatedCost += inputCost + outputCost;

    if (logIndividual) {
      console.log(`🔤 Token usage for request:`, {
        promptTokens: usageMetadata.promptTokenCount,
        outputTokens: usageMetadata.candidatesTokenCount,
        totalTokens: usageMetadata.totalTokenCount,
        cost: `$${(inputCost + outputCost).toFixed(6)}`
      });
    }

    this.emit('usage', this.totalUsage);
  }

  getTotal(): TokenUsage {
    return { ...this.totalUsage };
  }

  logTotal() {
    // Add a visual separator for better readability
    console.log('\n' + '='.repeat(50));
    console.log('💰 Token Usage Summary:');
    console.log('-'.repeat(30));
    console.log(`📥 Input Tokens:  ${this.totalUsage.promptTokens.toLocaleString()}`);
    console.log(`📤 Output Tokens: ${this.totalUsage.completionTokens.toLocaleString()}`);
    console.log(`📊 Total Tokens:  ${this.totalUsage.totalTokens.toLocaleString()}`);
    console.log(`💵 Total Cost:    $${this.totalUsage.estimatedCost.toFixed(4)}`);
    console.log('='.repeat(50) + '\n');
  }

  reset() {
    this.totalUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCost: 0
    };
  }
}

// Export a singleton instance
export const tokenTracker = new TokenTracker(); 