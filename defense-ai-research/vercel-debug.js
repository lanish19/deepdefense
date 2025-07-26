#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Vercel Deployment Debug Analysis\n');

// Check if we're in the right directory
const currentDir = process.cwd();
const dirName = path.basename(currentDir);
console.log(`📁 Current Directory: ${currentDir}`);
console.log(`📁 Directory Name: ${dirName}`);

if (dirName !== 'defense-ai-research') {
  console.log('⚠️  WARNING: You should be in the defense-ai-research directory');
  console.log('   This might be why Vercel is not finding the project correctly');
}

// Check critical files
const criticalFiles = [
  'package.json',
  'next.config.js',
  'app/page.tsx',
  'app/layout.tsx',
  'public/favicon.ico',
  'vercel.json'
];

console.log('\n📋 Critical Files Check:');
criticalFiles.forEach(file => {
  const exists = fs.existsSync(file);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file}`);
});

// Check for conflicting directories
console.log('\n🔍 Directory Structure Check:');
const hasSrcApp = fs.existsSync('src/app');
const hasApp = fs.existsSync('app');
console.log(`${hasApp ? '✅' : '❌'} app/ directory exists`);
console.log(`${hasSrcApp ? '❌' : '✅'} src/app/ directory does NOT exist (good)`);

if (hasSrcApp) {
  console.log('🚨 CONFLICT: src/app/ directory exists - this will cause routing issues!');
}

// Check package.json
console.log('\n📦 Package.json Analysis:');
if (fs.existsSync('package.json')) {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`✅ Name: ${pkg.name}`);
  console.log(`✅ Version: ${pkg.version}`);
  console.log(`✅ Next.js: ${pkg.dependencies?.next || 'Not found'}`);
  console.log(`✅ React: ${pkg.dependencies?.react || 'Not found'}`);
  
  if (!pkg.dependencies?.next) {
    console.log('🚨 CRITICAL: Next.js not found in dependencies!');
  }
}

// Check vercel.json
console.log('\n⚙️  Vercel.json Analysis:');
if (fs.existsSync('vercel.json')) {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  console.log(`✅ Framework: ${vercelConfig.framework || 'Not specified'}`);
  console.log(`✅ Build Command: ${vercelConfig.buildCommand || 'Not specified'}`);
  console.log(`✅ Install Command: ${vercelConfig.installCommand || 'Not specified'}`);
  
  if (vercelConfig.framework !== 'nextjs') {
    console.log('⚠️  Framework not explicitly set to nextjs');
  }
}

// Check next.config.js
console.log('\n🔧 Next.js Config Analysis:');
if (fs.existsSync('next.config.js')) {
  const config = fs.readFileSync('next.config.js', 'utf8');
  console.log('✅ next.config.js exists');
  
  if (config.includes('output: \'standalone\'')) {
    console.log('✅ Standalone output configured');
  }
  
  if (config.includes('ignoreBuildErrors: true')) {
    console.log('✅ TypeScript errors ignored');
  }
  
  if (config.includes('ignoreDuringBuilds: true')) {
    console.log('✅ ESLint errors ignored');
  }
}

// Check app directory structure
console.log('\n📁 App Directory Structure:');
if (fs.existsSync('app')) {
  const appFiles = fs.readdirSync('app');
  console.log('✅ app/ directory exists');
  console.log(`📄 Files in app/: ${appFiles.join(', ')}`);
  
  if (appFiles.includes('page.tsx')) {
    console.log('✅ app/page.tsx exists');
  } else {
    console.log('❌ app/page.tsx missing!');
  }
  
  if (appFiles.includes('layout.tsx')) {
    console.log('✅ app/layout.tsx exists');
  } else {
    console.log('❌ app/layout.tsx missing!');
  }
  
  if (fs.existsSync('app/api')) {
    console.log('✅ app/api/ directory exists');
  }
}

// Check public directory
console.log('\n📁 Public Directory:');
if (fs.existsSync('public')) {
  const publicFiles = fs.readdirSync('public');
  console.log('✅ public/ directory exists');
  console.log(`📄 Files in public/: ${publicFiles.join(', ')}`);
  
  if (publicFiles.includes('favicon.ico')) {
    console.log('✅ favicon.ico exists');
  } else {
    console.log('⚠️  favicon.ico missing (may cause issues)');
  }
}

// Vercel-specific recommendations
console.log('\n🚀 Vercel Deployment Recommendations:');
console.log('1. Ensure Root Directory is set to: defense-ai-research');
console.log('2. Framework should be: Next.js');
console.log('3. Build Command should be: npm run build');
console.log('4. Output Directory should be: .next');
console.log('5. Install Command should be: npm install');

console.log('\n🔧 Environment Variables Required:');
console.log('- GEMINI_API_KEY');
console.log('- FIRECRAWL_KEY');
console.log('- GEMINI_MODEL=gemini-2.0-flash');
console.log('- GEMINI_PREP_MODEL=gemini-2.5-pro');
console.log('- GEMINI_RESEARCH_MODEL=gemini-2.5-flash');

console.log('\n🧪 Test URLs after deployment:');
console.log('- https://your-app.vercel.app/minimal');
console.log('- https://your-app.vercel.app/debug');
console.log('- https://your-app.vercel.app/test');
console.log('- https://your-app.vercel.app/api/test');

console.log('\n📊 Summary:');
console.log('If all critical files exist and no conflicts found,');
console.log('the issue is likely in Vercel configuration or environment variables.');
console.log('Check the Vercel dashboard build logs for specific error messages.'); 