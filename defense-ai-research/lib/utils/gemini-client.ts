import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } from '@google/generative-ai';

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

export class GeminiClient {
  async generateWithSchema<T>(
    prompt: string, 
    schema: any, 
    systemPrompt: string,
    modelType: 'prep' | 'research' | 'default' = 'default'
  ): Promise<T> {
    const modelName = this.getModelForType(modelType);
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      safetySettings,
      systemInstruction: systemPrompt
    });

    // Convert JSON schema to Gemini's SchemaType format
    const geminiSchema = this.convertToGeminiSchema(schema);

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

      return JSON.parse(result.response.text()) as T;
    } catch (error: any) {
      if (error.status === 429) {
        const retryAfter = error.headers?.get('retry-after');
        const delayMs = retryAfter ? parseInt(retryAfter) * 1000 : 10000;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.generateWithSchema<T>(prompt, schema, systemPrompt, modelType);
      }
      throw error;
    }
  }

  async generateText(
    prompt: string,
    systemPrompt?: string,
    modelType: 'prep' | 'research' | 'default' = 'default'
  ): Promise<string> {
    const modelName = this.getModelForType(modelType);
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      safetySettings,
      ...(systemPrompt && { systemInstruction: systemPrompt })
    });

    try {
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: defaultConfig,
      });

      return result.response.text();
    } catch (error: any) {
      if (error.status === 429) {
        const retryAfter = error.headers?.get('retry-after');
        const delayMs = retryAfter ? parseInt(retryAfter) * 1000 : 10000;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.generateText(prompt, systemPrompt, modelType);
      }
      throw error;
    }
  }

  private getModelForType(modelType: 'prep' | 'research' | 'default'): string {
    switch (modelType) {
      case 'prep':
        return process.env.GEMINI_PREP_MODEL || "gemini-2.5-pro";
      case 'research':
        return process.env.GEMINI_RESEARCH_MODEL || "gemini-2.5-flash";
      default:
        return process.env.GEMINI_MODEL || "gemini-2.0-flash";
    }
  }

  private convertToGeminiSchema(schema: any): any {
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

    return geminiSchema;
  }
} 