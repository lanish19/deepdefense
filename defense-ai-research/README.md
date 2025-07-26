# Defense AI Research Platform

A sophisticated multi-agent AI research application that analyzes AI autonomy in defense/national security domains using advanced AI agents to conduct specialized research, synthesize findings, and generate comprehensive HTML reports.

## Features

- **Multi-Agent Workflow**: 11 specialized AI agents (G.1-G.11) + HTML generator (O.1)
- **Deep Research Integration**: Uses Gemini Deep Research for thorough analysis
- **Domain-Specific Focus**: Cyber, maritime, space, electronic warfare, and other defense domains
- **File Upload Support**: Analyze specific startup/firm data
- **Real-time Progress Tracking**: Live updates during research execution
- **Comprehensive Reports**: Generated HTML reports with detailed insights
- **Vercel Deployment Ready**: Optimized for edge functions and serverless deployment

## Architecture

### Preparatory Agents (G.1-G.5)
- **G.1 Pre-Policy**: Government and policy lens preparation
- **G.2 Pre-Primes**: Major public defense firms preparation
- **G.3 Pre-Startup/VC**: Startup and VC ecosystem preparation
- **G.4 Pre-Startup Firms**: Specific firm analysis preparation
- **G.5 Pre-Academia**: Academic and think tank preparation

### Research Agents (G.6-G.10)
- **G.6 Policy Research**: Deep research on policy trends (25 findings)
- **G.7 Primes Research**: Analysis of major defense contractors (25 findings)
- **G.8 Startup/VC Research**: Emerging companies and investments (25 findings)
- **G.9 Startup Firms Research**: Comparative firm analysis (trends, similarities, differences)
- **G.10 Academic Research**: Think tank and academic insights (25 findings)

### Synthesis & Output
- **G.11 Analysis Synthesis**: Comprehensive analysis of all research
- **O.1 HTML Generator**: Beautiful, responsive HTML reports

## Setup

### Prerequisites

- Node.js 18+ 
- Gemini API key
- Firecrawl API key (for web research)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd defense-ai-research
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your API keys:
```env
# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash                    # Default model
GEMINI_PREP_MODEL=gemini-2.5-pro                # For preparatory agents (G.1-G.5)
GEMINI_RESEARCH_MODEL=gemini-2.5-flash          # For research agents (G.6-G.10)
GEMINI_TEMPERATURE=0.5
GEMINI_TOP_P=0.95
GEMINI_TOP_K=40
GEMINI_MAX_OUTPUT_TOKENS=8192

# Firecrawl Configuration (for Deep Research)
FIRECRAWL_KEY=your_firecrawl_key_here
FIRECRAWL_SEARCH_LIMIT=5
FIRECRAWL_SCRAPE_LIMIT=10
FIRECRAWL_CONCURRENCY_LIMIT=1

# Rate Limiting
GEMINI_REQUEST_LIMIT=2000
GEMINI_TOKEN_LIMIT=4000000
GEMINI_WINDOW_MS=60000
GEMINI_INPUT_COST_PER_MILLION=0.10
GEMINI_OUTPUT_COST_PER_MILLION=0.40
```

### Model Configuration

The application uses different Gemini models for different agent types:

- **Preparatory Agents (G.1-G.5)**: Use `gemini-2.5-pro` for planning and preparation tasks
- **Research Agents (G.6-G.10)**: Use `gemini-2.5-flash` for deep research operations
- **Synthesis Agent (G.11)**: Uses `gemini-2.5-pro` for analysis synthesis
- **HTML Generator (O.1)**: Uses `gemini-2.5-flash` for HTML generation

This configuration optimizes performance and cost while matching the original specification requirements.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Basic Research

1. **Enter Domain Focus**: Specify the defense domain (e.g., "cyber", "maritime", "space")
2. **Add Context** (Optional): Provide additional research context
3. **Upload Firm Data** (Optional): CSV/JSON file with startup/firm information
4. **Start Research**: Click "Start AI Research" to begin the multi-agent workflow

### Research Process

The system executes the following workflow:

1. **Preparatory Phase**: 5 agents analyze and prepare research plans
2. **Research Phase**: 5 agents conduct deep research using Gemini Deep Research
3. **Synthesis Phase**: 1 agent synthesizes all findings
4. **Report Generation**: 1 agent creates a comprehensive HTML report

### File Upload Format

For startup firms data, upload a CSV or JSON file with the following structure:

**CSV Format:**
```csv
name,description,products,website
Company A,AI defense contractor,Autonomous drones;Cyber security,https://example.com
Company B,Maritime AI systems,Navigation AI;Port security,https://example.com
```

**JSON Format:**
```json
[
  {
    "name": "Company A",
    "description": "AI defense contractor",
    "products": ["Autonomous drones", "Cyber security"],
    "website": "https://example.com"
  }
]
```

## Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `GEMINI_API_KEY`
   - `FIRECRAWL_KEY`
3. Deploy automatically with each push

### Manual Build

```bash
npm run build
npm run start
```

## API Endpoints

### POST /api/research
Start a new research workflow.

**Request:** FormData with:
- `domainFocus` (required): Domain area to research
- `contextDetails` (optional): Additional context
- `startupFirmsFile` (optional): File with firm data

**Response:** 
```json
{
  "workflowId": "workflow_123...",
  "message": "Research workflow started",
  "statusUrl": "/api/research/status?workflowId=workflow_123..."
}
```

### GET /api/research?workflowId=<id>
Get workflow status and results.

**Response:**
```json
{
  "workflowId": "workflow_123...",
  "overallProgress": 75,
  "progress": [
    {
      "agentId": "pre-policy",
      "status": "completed",
      "progress": 100,
      "message": "Pre-Policy Agent completed"
    }
  ],
  "finalHTML": "<html>...</html>",
  "completed": true
}
```

### GET /api/research/status?workflowId=<id>
Server-Sent Events endpoint for real-time progress updates.

## System Requirements

- **Memory**: Minimum 512MB, recommended 1GB+ for concurrent workflows
- **CPU**: Multi-core recommended for parallel agent execution
- **Network**: Stable internet connection for API calls
- **Storage**: Minimal, reports generated in-memory

## Rate Limiting

The application includes built-in rate limiting for API calls:
- Gemini API: 2000 requests/minute, 4M tokens/minute
- Firecrawl API: Configurable limits based on your plan

## Troubleshooting

### Common Issues

1. **API Rate Limits**: Reduce concurrency or add delays
2. **Memory Issues**: Restart the application, consider upgrading server
3. **File Upload Errors**: Check file format and size limits
4. **Network Timeouts**: Ensure stable internet connection

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Built with Next.js 14 and Tailwind CSS
- Powered by Google Gemini AI
- Web research via Firecrawl
- Inspired by multi-agent research methodologies
