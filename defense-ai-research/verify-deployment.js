#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying deployment configuration...\n');

const checks = [
  {
    name: 'package.json exists',
    check: () => fs.existsSync('package.json'),
    critical: true
  },
  {
    name: 'next.config.js exists',
    check: () => fs.existsSync('next.config.js'),
    critical: true
  },
  {
    name: 'app directory exists',
    check: () => fs.existsSync('app'),
    critical: true
  },
  {
    name: 'app/page.tsx exists',
    check: () => fs.existsSync('app/page.tsx'),
    critical: true
  },
  {
    name: 'app/layout.tsx exists',
    check: () => fs.existsSync('app/layout.tsx'),
    critical: true
  },
  {
    name: 'public directory exists',
    check: () => fs.existsSync('public'),
    critical: true
  },
  {
    name: 'public/favicon.ico exists',
    check: () => fs.existsSync('public/favicon.ico'),
    critical: false
  },
  {
    name: 'vercel.json exists',
    check: () => fs.existsSync('vercel.json'),
    critical: false
  },
  {
    name: 'No src/app directory (conflict)',
    check: () => !fs.existsSync('src/app'),
    critical: true
  },
  {
    name: 'lib directory exists',
    check: () => fs.existsSync('lib'),
    critical: true
  },
  {
    name: 'types directory exists',
    check: () => fs.existsSync('types'),
    critical: true
  },
  {
    name: 'API routes exist',
    check: () => fs.existsSync('app/api/research/route.ts'),
    critical: true
  },
  {
    name: 'Test routes exist',
    check: () => fs.existsSync('app/api/test/route.ts') && fs.existsSync('app/test/page.tsx'),
    critical: false
  }
];

let passed = 0;
let failed = 0;
let criticalFailures = 0;

checks.forEach(check => {
  const result = check.check();
  const status = result ? '✅' : '❌';
  const critical = check.critical ? ' (CRITICAL)' : '';
  
  console.log(`${status} ${check.name}${critical}`);
  
  if (result) {
    passed++;
  } else {
    failed++;
    if (check.critical) {
      criticalFailures++;
    }
  }
});

console.log('\n📊 Results:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`🚨 Critical Failures: ${criticalFailures}`);

if (criticalFailures > 0) {
  console.log('\n❌ DEPLOYMENT WILL FAIL - Critical issues found!');
  process.exit(1);
} else if (failed > 0) {
  console.log('\n⚠️  Warnings found, but deployment should work');
} else {
  console.log('\n✅ All checks passed! Ready for deployment.');
}

console.log('\n📋 Next Steps:');
console.log('1. Go to vercel.com/new');
console.log('2. Import your GitHub repository');
console.log('3. Set Root Directory to: defense-ai-research');
console.log('4. Add environment variables:');
console.log('   - GEMINI_API_KEY');
console.log('   - FIRECRAWL_KEY');
console.log('   - GEMINI_PREP_MODEL=gemini-2.5-pro');
console.log('   - GEMINI_RESEARCH_MODEL=gemini-2.5-flash');
console.log('5. Deploy!'); 