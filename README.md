# DeepDefense: Multi-Agent AI Research System

A comprehensive multi-agent AI workflow application for analyzing AI autonomy within defense/national security domains. This system uses 12 specialized AI agents to conduct deep research, synthesize findings, and generate comprehensive HTML reports.

## 🚀 Quick Start

The main application is located in the `defense-ai-research/` directory. See the [defense-ai-research README](./defense-ai-research/README.md) for detailed setup and usage instructions.

## 📁 Repository Structure

```
├── defense-ai-research/          # Main Next.js application
│   ├── app/                     # Next.js App Router
│   ├── lib/                     # Core application logic
│   │   ├── agents/             # 12 AI agents implementation
│   │   ├── deep-research/      # Gemini Deep Research integration
│   │   ├── workflow/           # Orchestration and state management
│   │   └── utils/              # Utility functions
│   ├── types/                  # TypeScript type definitions
│   └── README.md               # Detailed setup instructions
├── gemini_deep_research_repo/   # Original deep research implementation
├── prompts_to_use.md           # All agent prompts and system instructions
├── todo.md                     # Original implementation roadmap
├── todo_mermaid.md             # Agent workflow visualization
└── README.md                   # This file
```

## 🎯 Features

### Multi-Agent Workflow
- **12 Specialized AI Agents**: Each focused on specific research domains
- **Preparatory Agents (G.1-G.5)**: Plan and prepare research strategies
- **Research Agents (G.6-G.10)**: Conduct deep research using Gemini Deep Research
- **Synthesis Agent (G.11)**: Synthesize findings into comprehensive analysis
- **HTML Generator (O.1)**: Generate beautiful, responsive HTML reports

### Technical Capabilities
- **Deep Research Integration**: Powered by Gemini Deep Research with web search
- **Real-time Progress Tracking**: Server-Sent Events for live status updates
- **File Upload Support**: CSV/JSON startup firms data processing
- **Modern UI**: Next.js 14+ with Tailwind CSS and responsive design
- **Vercel Deployment Ready**: Optimized for edge functions and serverless

### Model Configuration
- **Preparatory Agents**: `gemini-2.5-pro` for planning and analysis
- **Research Agents**: `gemini-2.5-flash` for deep research operations
- **Synthesis**: `gemini-2.5-pro` for comprehensive analysis
- **HTML Generation**: `gemini-2.5-flash` for content generation

## 🔧 Setup

1. **Navigate to the application directory**:
   ```bash
   cd defense-ai-research
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

## 📚 Documentation

- **[Application README](./defense-ai-research/README.md)**: Complete setup and usage guide
- **[Agent Prompts](./prompts_to_use.md)**: All system instructions and prompts
- **[Implementation Roadmap](./todo.md)**: Original development plan
- **[Workflow Visualization](./todo_mermaid.md)**: Agent interaction diagram

## 🌐 Live Demo

The application is designed for deployment on Vercel. Follow the deployment instructions in the [application README](./defense-ai-research/README.md).

## 🤝 Contributing

This is a research and development project. For questions or contributions, please refer to the main application documentation.

## 📄 License

This project is for research and educational purposes. Please ensure compliance with all applicable laws and regulations when using this system for defense/national security research.

---

**Built with Next.js, Gemini AI, and Firecrawl for comprehensive defense AI research.** 