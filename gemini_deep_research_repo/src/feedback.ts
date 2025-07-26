import { generateObject } from './ai/providers';
import { tokenTracker } from './ai/tokenTracker';
import { systemPrompt } from './prompt';

export async function generateFeedback({
  query,
  numQuestions = 3,
}: {
  query: string;
  numQuestions?: number;
  previousLearnings?: string[];
}) {
  // Define schema for Gemini's structured output
  const schema = {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: { type: "string" },
        description: "Follow up questions to clarify the research direction",
        minItems: 1,
        maxItems: numQuestions
      },
      researchDirections: {
        type: "array", 
        items: { type: "string" },
        description: "Initial research directions to explore"
      }
    },
    required: ["questions", "researchDirections"]
  };

  const prompt = `Given the following query from the user, ask some follow up questions to clarify the research direction. Return a maximum of ${numQuestions} questions, but feel free to return less if the original query is clear: <query>${query}</query>`;

  const result = await generateObject({
    prompt,
    schema,
    systemPrompt: systemPrompt()
  });

  return result.object;
}
