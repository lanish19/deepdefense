import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } from '@google/generative-ai';
import { RecursiveCharacterTextSplitter } from './text-splitter';
import { tokenTracker } from './tokenTracker';
// Rate limiting configuration using dual token bucket algorithm
class DualTokenBucket {
  private lastRefill = Date.now();
  private currentRequests: number;
  private currentTokens: number;
  private lastResponseTokens: number = 0;
  
  constructor(
    private requestLimit: number,
    private tokenLimit: number,
    private windowMs: number
  ) {
    this.currentRequests = requestLimit;
    this.currentTokens = tokenLimit;
    this.lastResponseTokens = 0;
  }

  // Update current capacity based on actual usage
  updateFromResponse(usageMetadata: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number }) {
    this.lastResponseTokens = usageMetadata.totalTokenCount;
  }

  // Get estimated tokens for next request based on last response
  getEstimatedTokens(): number {
    return this.lastResponseTokens ? Math.ceil(this.lastResponseTokens * 1.2) : 1000;
  }

  consume(requests: number, tokens: number): number {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const refillRatio = Math.min(1, elapsed / this.windowMs);

    // Refill buckets based on time elapsed
    this.currentRequests = Math.min(
      this.requestLimit,
      this.currentRequests + (this.requestLimit * refillRatio)
    );
    
    this.currentTokens = Math.min(
      this.tokenLimit,
      this.currentTokens + (this.tokenLimit * refillRatio)
    );

    // Check if we have enough capacity
    if (requests > this.currentRequests || tokens > this.currentTokens) {
      return Math.max(
        requests > this.currentRequests 
          ? ((requests - this.currentRequests) * this.windowMs / this.requestLimit)
          : 0,
        tokens > this.currentTokens 
          ? ((tokens - this.currentTokens) * this.windowMs / this.tokenLimit)
          : 0
      );
    }

    // Consume from buckets
    this.currentRequests -= requests;
    this.currentTokens -= tokens;
    this.lastRefill = now;
    return 0;
  }
}

// Initialize rate limiter with configurable limits
const rateLimiter = new DualTokenBucket(
  Number(process.env.GEMINI_REQUEST_LIMIT) || 2000,    // Default 2000 requests per minute
  Number(process.env.GEMINI_TOKEN_LIMIT) || 4000000,   // Default 4M tokens per minute
  Number(process.env.GEMINI_WINDOW_MS) || 60000        // Default 1-minute window
);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Safety settings - set to BLOCK_NONE for all categories
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  }
];

// Default generation config
const defaultConfig = {
  temperature: parseFloat(process.env.GEMINI_TEMPERATURE || "0.5"),
  topP: parseFloat(process.env.GEMINI_TOP_P || "0.95"),
  topK: Number(process.env.GEMINI_TOP_K || "40"),
  maxOutputTokens: Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || "8192"),
};

// Add after other type definitions
type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
};

type GeminiSchemaProperty = {
  type: SchemaType;
  description?: string;
  items?: {
    type: SchemaType;
    properties?: Record<string, GeminiSchemaProperty>;
  };
  properties?: Record<string, GeminiSchemaProperty>;
};

// Models
export const geminiModel = async (prompt: string, schema?: any, systemPrompt?: string): Promise<string> => {
  const model = genAI.getGenerativeModel({ 
    model: process.env.GEMINI_RESEARCH_MODEL || "gemini-2.5-flash",
    safetySettings,
    ...(systemPrompt && {
      systemInstruction: systemPrompt
    })
  });

  // Count tokens before making the request, including system instruction
  const countResult = await model.countTokens([
    ...(systemPrompt ? [systemPrompt] : []),
    prompt
  ]);
  
  console.log(`Pre-request token count:`, {
    totalTokens: countResult.totalTokens,
    systemInstructionTokens: systemPrompt ? (await model.countTokens([systemPrompt])).totalTokens : 0,
    promptTokens: await model.countTokens([prompt]).then(r => r.totalTokens)
  });

  // Get wait time from rate limiter using actual token count
  const waitMs = rateLimiter.consume(1, countResult.totalTokens);
  if (waitMs > 0) {
    await new Promise(resolve => setTimeout(resolve, waitMs));
  }

  const generationConfig = {
    ...defaultConfig,
    ...(schema && {
      responseMimeType: schema.responseMimeType,
      responseSchema: schema.responseSchema
    })
  };

  try {
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig,
    });

    if (result.response?.usageMetadata) {
      tokenTracker.updateUsage(result.response.usageMetadata);
    }

    return result.response.text();
  } catch (error: any) {
    if (error.status === 429) {
      const retryAfter = error.headers?.get('retry-after');
      const delayMs = retryAfter ? parseInt(retryAfter) * 1000 : 10000;
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return geminiModel(prompt, schema, systemPrompt);
    }
    throw error;
  }
};

const MinChunkSize = 140;

// trim prompt to maximum context size
export async function trimPrompt(
  prompt: string,
  contextSize = Number(process.env.CONTEXT_SIZE) || 1_048_576, // Gemini 2.0 Flash has 1M token context
  systemPrompt?: string
): Promise<string> {
  if (!prompt) {
    return '';
  }

  // Use Gemini's token counting
  const model = genAI.getGenerativeModel({ 
    model: process.env.GEMINI_RESEARCH_MODEL || "gemini-2.5-flash",
  });

  // Count tokens including system prompt if provided
  return model.countTokens([
    ...(systemPrompt ? [systemPrompt] : []),
    prompt
  ]).then(async result => {
    if (result.totalTokens <= contextSize) {
      return prompt;
    }

    // If over context limit, use character-based approximation for chunking
    // Account for system prompt tokens in available space
    const systemTokens = systemPrompt ? result.totalTokens - (await model.countTokens(prompt)).totalTokens : 0;
    const availableTokens = contextSize - systemTokens;
    const overflowTokens = result.totalTokens - availableTokens;
    const chunkSize = prompt.length - (overflowTokens * 4); // Gemini uses ~4 chars per token
    if (chunkSize < MinChunkSize) {
      return prompt.slice(0, MinChunkSize);
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap: 0,
    });
    const trimmedPrompt = splitter.splitText(prompt)[0] ?? '';

    if (trimmedPrompt.length === prompt.length) {
      return trimPrompt(prompt.slice(0, chunkSize), contextSize, systemPrompt);
    }

    return trimPrompt(trimmedPrompt, contextSize, systemPrompt);
  });
}

// Simplified provider implementation
export async function generateObject<T>({
  prompt,
  schema,
  systemPrompt,
}: {
  prompt: string;
  schema: any;
  systemPrompt?: string;
}) {
  // Add step indicators
  console.log('\n🔄 Generating response...');
  
  const model = genAI.getGenerativeModel({ 
    model: process.env.GEMINI_RESEARCH_MODEL || "gemini-2.5-flash",
    safetySettings,
    ...(systemPrompt && {
      systemInstruction: systemPrompt
    })
  });

  // Convert JSON schema to Gemini's SchemaType format
  const geminiSchema = {
    type: SchemaType.OBJECT,
    properties: Object.entries(schema.properties).reduce<Record<string, any>>((acc, [key, value]: [string, any]) => {
      acc[key] = {
        type: value.type === 'array' 
          ? SchemaType.ARRAY 
          : value.type === 'object'
          ? SchemaType.OBJECT
          : SchemaType.STRING,
        description: value.description,
        ...(value.type === 'array' && {
          items: {
            type: value.items.type === 'object' 
              ? SchemaType.OBJECT 
              : SchemaType.STRING,
            ...(value.items.properties && {
              properties: Object.entries(value.items.properties).reduce<Record<string, any>>((props, [pKey, pValue]: [string, any]) => {
                props[pKey] = {
                  type: SchemaType.STRING,
                  description: pValue.description
                };
                return props;
              }, {})
            })
          }
        }),
        ...(value.type === 'object' && value.properties && {
          properties: Object.entries(value.properties).reduce<Record<string, any>>((props, [pKey, pValue]: [string, any]) => {
            props[pKey] = {
              type: pValue.type === 'array'
                ? SchemaType.ARRAY
                : pValue.type === 'object'
                ? SchemaType.OBJECT
                : SchemaType.STRING,
              description: pValue.description
            };
            return props;
          }, {})
        })
      };
      return acc;
    }, {}),
    required: schema.required || []
  } as any;

  try {
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        ...defaultConfig,
        responseMimeType: "application/json",
        responseSchema: geminiSchema
      },
    });

    if (result.response?.usageMetadata) {
      tokenTracker.updateUsage(result.response.usageMetadata, true);
    }

    // Parse response as JSON
    const parsed = JSON.parse(result.response.text());

    console.log('✅ Response generated successfully');
    return {
      object: parsed,
      usageMetadata: result.response.usageMetadata
    };
  } catch (error: any) {
    console.log('❌ Error generating response');
    // Handle rate limiting
    if (error.status === 429) {
      const retryAfter = error.headers?.get('retry-after');
      const delayMs = retryAfter ? parseInt(retryAfter) * 1000 : 10000;
      console.log(`Rate limited, retrying after ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return generateObject({ prompt, schema, systemPrompt });
    }
    throw error;
  }
}

export { tokenTracker } from './tokenTracker';
