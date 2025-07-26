import FirecrawlApp, { SearchResponse } from '@mendable/firecrawl-js';
import { compact } from 'lodash-es';
import pLimit from 'p-limit';
import { generateObject, trimPrompt } from './ai/providers';
import { systemPrompt } from './prompt';
import { tokenTracker } from './ai/tokenTracker';
import { generateFeedback } from './feedback';

type ResearchResult = {
  learnings: string[];
  visitedUrls: string[];
};

type SerpQuery = {
  query: string;
  researchGoal: string;
};


// Rate limiting configuration
const SearchLimit = Number(process.env.FIRECRAWL_SEARCH_LIMIT) || 5;
const ScrapeLimit = Number(process.env.FIRECRAWL_SCRAPE_LIMIT) || 10;
const CrawlLimit = Number(process.env.FIRECRAWL_CRAWL_LIMIT) || 1;

// Minimum delay between requests for each endpoint
const SearchDelay = 60_000 / SearchLimit;  // minimum delay for search requests
const ScrapeDelay = 60_000 / ScrapeLimit; // minimum delay for scrape requests
const CrawlDelay = 60_000 / CrawlLimit;   // minimum delay for crawl requests

// We're primarily using search endpoint, so base concurrency on that
const ConcurrencyLimit = Number(process.env.FIRECRAWL_CONCURRENCY_LIMIT) || 1;

// Initialize Firecrawl with required API key and optional base url
const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_KEY ?? '',
  apiUrl: process.env.FIRECRAWL_BASE_URL,
});

let searchCount = 0;
let lastResetTime = Date.now();
let resetTime = new Date(lastResetTime + 60_000);

async function searchWithRetry(query: string, retryCount = 0): Promise<SearchResponse> {
  try {
    // Reset counter if a minute has passed
    const now = Date.now();
    if (now - lastResetTime >= 60_000) {
      searchCount = 0;
      lastResetTime = now;
      resetTime.setTime(now + 60_000); // Update display time too
    }

    searchCount++;
    const remaining = SearchLimit - searchCount;
    console.log(`[Search ${searchCount}/${SearchLimit}] Executing query: "${query.slice(0, 100)}${query.length > 100 ? '...' : ''}"`);
    console.log(`Rate limit status: ${remaining} searches remaining this minute (resets at ${resetTime.toLocaleTimeString()})`);
    
    const result = await firecrawl.search(query, {
      timeout: 15000,
      limit: 5,
      scrapeOptions: { formats: ['markdown'] },
    });

    // Add delay after successful request based on search endpoint limit
    const delaySeconds = SearchDelay / 1000;
    console.log(`Waiting ${delaySeconds.toFixed(1)}s before next request...`);
    await new Promise(resolve => setTimeout(resolve, SearchDelay));
    return result;
  } catch (e: any) {
    if (e.statusCode === 429 && retryCount < 3) {
      // Parse the retry-after time from the error message
      const retryAfter = e.details?.match(/retry after (\d+)s/)?.[1];
      const delayMs = (retryAfter ? parseInt(retryAfter) : 60) * 1000; // Default to 60s if no retry-after
      console.log(`⚠️ Rate limited! Waiting ${delayMs/1000}s before retry ${retryCount + 1}/3...`);
      
      // Reset counter since we're being rate limited
      searchCount = 0;
      lastResetTime = Date.now();
      resetTime.setTime(lastResetTime + 60_000);
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return searchWithRetry(query, retryCount + 1);
    }
    throw e;
  }
}

// Schema definitions for structured output
const SerpResultSchema = {
  type: "object",
  properties: {
    learnings: {
      type: "array",
      items: { type: "string" },
      description: "Key factual learnings and insights from the search results"
    },
    researchDirections: {
      type: "array",
      items: { type: "string" },
      description: "Potential research directions identified from analyzing the learnings"
    },
    followUpQuestions: {
      type: "array",
      items: { type: "string" },
      description: "Specific follow-up questions to explore the identified research directions"
    }
  },
  required: ["learnings", "researchDirections", "followUpQuestions"]
};

const SerpQuerySchema = {
  type: "object",
  properties: {
    queries: {
      type: "array",
      items: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to use"
          },
          researchGoal: {
            type: "string",
            description: "The goal of this specific search query"
          }
        },
        required: ["query", "researchGoal"]
      },
      minItems: 1,
      description: "List of search queries to execute"
    }
  },
  required: ["queries"]
};

async function processSerpResult({
  query,
  result,
  numFollowUpQuestions,
}: {
  query: string;
  result: SearchResponse;
  numFollowUpQuestions: number;
}): Promise<{ learnings: string[]; followUpQuestions: string[] }> {
  const contents = compact(result.data.map(item => item.markdown)).map(
    content => trimPrompt(content, 25_000),
  );
  console.log(`Ran ${query}, found ${contents.length} contents`);
  
  try {
    const response = await generateObject({
      prompt: `Given the following contents from a SERP search for the query <query>${query}</query>, generate a list of learnings from the contents. Return a maximum of 3 learnings, but feel free to return less if the contents are clear. Make sure each learning is unique and not similar to each other. The learnings should be concise and to the point, as detailed and information dense as possible. Make sure to include any entities like people, places, companies, products, things, etc in the learnings, as well as any exact metrics, numbers, or dates. The learnings will be used to research the topic further.\n\n<contents>${contents
        .map(content => `<content>\n${content}\n</content>`)
        .join('\n')}</contents>`,
      schema: SerpResultSchema,
      systemPrompt: systemPrompt()
    });

    return {
      learnings: response.object.learnings,
      followUpQuestions: response.object.followUpQuestions.slice(0, numFollowUpQuestions),
    };
  } catch (error) {
    console.error('Error processing SERP result:', error);
    return {
      learnings: [],
      followUpQuestions: []
    };
  }
}

// take en user query, return a list of SERP queries
async function generateSerpQueries({
  query,
  numQueries = 3,
  learnings,
}: {
  query: string;
  numQueries?: number;
  learnings?: string[];
}): Promise<SerpQuery[]> {
  try {
    const response = await generateObject({
      prompt: `Given the following prompt from the user, generate a list of SERP queries to research the topic. Return a maximum of ${numQueries} queries, but feel free to return less if the original prompt is clear. Make sure each query is unique and not similar to each other: <prompt>${query}</prompt>\n\n${
        learnings ? `Here are some learnings from previous research, use them to generate more specific queries: ${learnings.join('\n')}` : ''
      }`,
      schema: SerpQuerySchema,
      systemPrompt: systemPrompt()
    });

    return response.object.queries.map((q: { query: string; researchGoal: string }) => ({
      query: q.query,
      researchGoal: q.researchGoal
    }));
  } catch (error) {
    console.error('Error generating SERP queries:', error);
    return [{
      query: `${query} research studies analysis`,
      researchGoal: "Gather general information and research about the topic"
    }];
  }
}

export async function deepResearch({
  query,
  breadth,
  depth,
  learnings = [],
  visitedUrls = [],
}: {
  query: string;
  breadth: number;
  depth: number;
  learnings?: string[];
  visitedUrls?: string[];
}): Promise<ResearchResult> {
  console.log(`\n📚 Starting research phase (depth: ${depth}, breadth: ${breadth})`);
  console.log(`Rate limits: ${SearchLimit}/min search, ${ScrapeLimit}/min scrape, ${CrawlLimit}/min crawl\n`);

  // Generate research questions based on current learnings
  const feedback = await generateFeedback({
    query,
    numQuestions: breadth,
    previousLearnings: learnings
  });

  const serpQueries = await generateSerpQueries({
    query,
    learnings,
    numQueries: breadth,
  });

  if (serpQueries.length === 0) {
    console.log('No valid search queries generated. Using default query.');
    serpQueries.push({
      query: `${query} research analysis studies`,
      researchGoal: 'Gather general information about the topic'
    });
  }

  const limit = pLimit(ConcurrencyLimit);
  console.log(`\n🔍 Executing ${serpQueries.length} search queries with ${ConcurrencyLimit} concurrent requests\n`);

  const results = await Promise.all(
    serpQueries.map(serpQuery =>
      limit(async () => {
        try {
          console.log(`\n📝 Executing query: "${serpQuery.query}"\nGoal: ${serpQuery.researchGoal}\n`);
          const result = await searchWithRetry(serpQuery.query);

          // Collect URLs from this search
          const newUrls = compact(result.data.map(item => item.url));
          console.log(`✓ Found ${newUrls.length} new sources`);

          const newBreadth = Math.ceil(breadth / 2);
          const newDepth = depth - 1;

          const newLearnings = await processSerpResult({
            query: serpQuery.query,
            result,
            numFollowUpQuestions: newBreadth,
          });
          
          if (newLearnings.learnings.length === 0) {
            console.log('No learnings extracted from search results. Skipping deeper research.');
            return {
              learnings: [],
              visitedUrls: newUrls
            };
          }

          const allLearnings = [...learnings, ...newLearnings.learnings];
          const allUrls = [...visitedUrls, ...newUrls];

          if (newDepth > 0) {
            return deepResearch({
              query: `${query}\n\nNew findings:\n${newLearnings.learnings.join('\n')}\n\nResearch direction: ${feedback.questions[serpQueries.indexOf(serpQuery)]}`,
              breadth: newBreadth,
              depth: newDepth,
              learnings: allLearnings,
              visitedUrls: allUrls,
            });
          } else {
            return {
              learnings: allLearnings,
              visitedUrls: allUrls,
            };
          }
        } catch (e: any) {
          console.error(
            `❌ Error running query: "${serpQuery.query}": `,
            e,
          );
          return {
            learnings: [],
            visitedUrls: [],
          };
        }
      }),
    ),
  );

  const finalLearnings = [...new Set(results.flatMap(r => r.learnings))];
  const finalUrls = [...new Set(results.flatMap(r => r.visitedUrls))];

  console.log(`\n📊 Research phase complete:`);
  console.log(`- ${finalLearnings.length} unique learnings`);
  console.log(`- ${finalUrls.length} unique sources\n`);

  return {
    learnings: finalLearnings,
    visitedUrls: finalUrls,
  };
}

export async function generateReport({
  prompt,
  learnings,
  visitedUrls,
}: {
  prompt: string;
  learnings: string[];
  visitedUrls: string[];
}): Promise<string> {
  const learningsString = await trimPrompt(
    learnings
      .map(learning => `<learning>\n${learning}\n</learning>`)
      .join('\n'),
    150_000,
  );
  
  const reportSchema = {
    type: "object",
    properties: {
      reportMarkdown: {
        type: "string",
        description: "The final research report in markdown format"
      }
    },
    required: ["reportMarkdown"]
  };

  const result = await generateObject({
    prompt: `Given the following prompt from the user, write a final report on the topic using the learnings from research. Make it as detailed as possible, aim for 3 or more pages, include ALL the learnings from research:\n\n<prompt>${prompt}</prompt>\n\nHere are all the learnings from previous research:\n\n<learnings>\n${learningsString}\n</learnings>`,
    schema: reportSchema,
    systemPrompt: systemPrompt()
  });

  // Append the visited URLs section to the report
  const urlsSection = `\n\n## Sources\n\n${visitedUrls.map(url => `- ${url}`).join('\n')}`;
  return result.object.reportMarkdown + urlsSection;
}
