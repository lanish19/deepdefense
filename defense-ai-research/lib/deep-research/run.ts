import * as fs from 'fs/promises';
import * as readline from 'readline';

import { deepResearch, generateReport } from './deep-research';
import { generateFeedback } from './feedback';
import { tokenTracker } from './ai/tokenTracker';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to get user input with validation
async function askQuestion(query: string, validator?: (input: string) => boolean): Promise<string> {
  return new Promise(resolve => {
    const ask = () => {
      rl.question(query, answer => {
        if (!validator || validator(answer)) {
          resolve(answer);
        } else {
          console.log('❌ Invalid input, please try again');
          ask();
        }
      });
    };
    ask();
  });
}

// run the agent
async function run() {
  // Get initial query
  const initialQuery = await askQuestion('What would you like to research? ');

  // Get breath and depth parameters
  const breadth = parseInt(
    await askQuestion(
      'Enter research breadth (2-10) [default: 4]: ',
      input => !input || (parseInt(input) >= 2 && parseInt(input) <= 10)
    ),
    10,
  ) || 4;
  const depth =
    parseInt(
      await askQuestion('Enter research depth (recommended 1-5, default 2): '),
      10,
    ) || 2;

  console.log(`Creating research plan...`);

  // Generate follow-up questions
  const feedback = await generateFeedback({
    query: initialQuery,
  });

  console.log(
    '\nTo better understand your research needs, please answer these follow-up questions:',
  );

  // Collect answers to follow-up questions
  const answers: string[] = [];
  for (const question of feedback.questions) {
    const answer = await askQuestion(`\n${question}\nYour answer: `);
    answers.push(answer);
  }

  // Combine all information for deep research
  const combinedQuery = `
Initial Query: ${initialQuery}
Follow-up Questions and Answers:
${feedback.questions.map((q: string, i: number) => `Q: ${q}\nA: ${answers[i]}`).join('\n')}
`;

  console.log('\nResearching your topic...');
  
  // Log initial state
  console.log('\n💰 Initial token usage:');
  tokenTracker.logTotal();

  const { learnings, visitedUrls } = await deepResearch({
    query: combinedQuery,
    breadth,
    depth,
  });

  // Log usage after research phase
  console.log('\n💰 Token usage after research:');
  tokenTracker.logTotal();

  console.log(`\n\nLearnings:\n\n${learnings.join('\n')}`);
  console.log(
    `\n\nVisited URLs (${visitedUrls.length}):\n\n${visitedUrls.join('\n')}`,
  );
  console.log('Writing final report...');

  const report = await generateReport({
    prompt: combinedQuery,
    learnings,
    visitedUrls,
  });

  // Final token usage report
  console.log('\n💰 Final token usage and costs:');
  tokenTracker.logTotal();

  // Save report to file
  await fs.writeFile('output.md', report, 'utf-8');

  console.log(`\n\nFinal Report:\n\n${report}`);
  console.log('\nReport has been saved to output.md');
  
  rl.close();
}

run().catch(console.error);
