# Deep Research Pipeline Setup

This project implements a comprehensive deep research pipeline using the AI SDK and Trigger.dev, inspired by the Together AI's Open Deep Research approach.

## Architecture Overview

The deep research pipeline follows a four-stage process:

1. **Planning** - AI analyzes the query and creates comprehensive search strategies
2. **Search** - Executes multiple targeted searches and gathers information (now with parallel execution)
3. **Reflection** - Identifies knowledge gaps and determines if additional research is needed (optional in quick mode)
4. **Writing** - Generates comprehensive reports with analysis and conclusions

## Research Modes

Choose the appropriate mode based on your time and depth requirements:

- **Quick Mode** 🚀
  - 1-2 focused search queries executed in parallel
  - No reflection phase for rapid results
  - Completion time: ~1-2 minutes
  - Best for: Quick answers, time-sensitive research

- **Surface Mode** ⚡
  - 3-5 search queries with parallel execution
  - Basic reflection and gap analysis
  - Completion time: ~3-5 minutes
  - Best for: Overview understanding, initial research

- **Deep Mode** 🔍 (Default)
  - 5-8 comprehensive search queries
  - Full reflection and iterative improvement
  - Completion time: ~5-10 minutes
  - Best for: Thorough analysis, decision-making

- **Comprehensive Mode** 🎯
  - 8-12 detailed search queries
  - Maximum iterations and reflection cycles
  - Completion time: ~10-15 minutes
  - Best for: Academic research, critical decisions

## Key Components

### Core Libraries
- **AI SDK** - For LLM interactions with GPT-4 and Claude
- **Trigger.dev** - For task orchestration and workflow management
- **Zod** - For data validation and type safety
- **Next.js** - For the web interface with App Router
- **Tailwind CSS** - For styling

### File Structure
```
lib/
├── research-types.ts     # Type definitions and Zod schemas
├── redis.ts              # Upstash Redis client and state management
└── exa.ts                # Exa search API client

trigger/
├── deep-research-pipeline.ts  # Main research orchestration tasks
└── search-web.ts              # Exa-powered web search task

app/
├── actions/research-actions.ts  # Next.js server actions
└── research/page.tsx           # React UI component
```

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file with the following variables:

```bash
# AI SDK Configuration
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Upstash Redis Configuration (required for state persistence)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url_here
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token_here

# Exa Search API Configuration (required for web search)
EXA_API_KEY=your_exa_api_key_here

# Trigger.dev Configuration
TRIGGER_SECRET_KEY=your_trigger_secret_key
```

### 2. API Keys Setup

#### OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to your `.env.local` as `OPENAI_API_KEY`

#### Anthropic API Key
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create a new API key
3. Add it to your `.env.local` as `ANTHROPIC_API_KEY`

#### Trigger.dev Setup
1. Sign up at [Trigger.dev](https://trigger.dev)
2. Create a new project
3. Get your secret key from the project settings
4. Update `trigger.config.ts` with your project ID

#### Upstash Redis Setup
1. Sign up at [Upstash](https://upstash.com)
2. Create a new Redis database
3. Get the REST URL and Token from the database details
4. Add them to your `.env.local` as `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

#### Exa Search API (Required)
For real web search and content extraction:
1. Sign up at [Exa](https://exa.ai)
2. Get your API key from the dashboard
3. Add it to your `.env.local` as `EXA_API_KEY`

### 3. Installation

```bash
# Install dependencies
bun install

# Start the development server
bun dev

# In another terminal, start Trigger.dev development
bunx trigger.dev@latest dev
```

## Usage

### Web Interface

1. Navigate to `/research` in your browser
2. Choose between "Deep Research" or "Quick Research"
3. Enter your research query
4. For deep research, select the depth level:
   - **Surface**: 3-5 queries, quick overview
   - **Deep**: 5-8 queries, comprehensive analysis
   - **Comprehensive**: 8-12 queries, exhaustive research

### API Usage

You can also trigger research programmatically:

```typescript
import { deepResearchPipeline } from '@/trigger/deep-research-pipeline';

// Start deep research
const handle = await deepResearchPipeline.trigger({
  query: "What are the latest developments in AI research?",
  depth: "deep"
});

// Get the research ID
console.log("Research started:", handle.id);
```

## Configuration

### Research Depth Settings

- **Surface**: 5 sources, 1-2 iterations
- **Deep**: 10 sources, 2-3 iterations
- **Comprehensive**: 15 sources, 3 iterations

### AI Models Used

- **Planning**: GPT-4o (for structured plan generation)
- **Reflection**: GPT-4o (for gap analysis)  
- **Writing**: Claude 3.5 Sonnet (for comprehensive reports)

**Telemetry**: All AI SDK calls include experimental telemetry for monitoring and debugging

### Customization

#### Adding New AI Models

Edit `lib/ai-service.ts` to add new models:

```typescript
import { openai } from '@ai-sdk/openai';

const CUSTOM_MODEL = openai('gpt-4-turbo');
```

#### Modifying Search Behavior

Edit `lib/search-service.ts` to customize:
- Number of results per query
- Relevance scoring algorithm
- Content extraction logic

#### Adjusting Task Timeouts

Edit `trigger/deep-research-pipeline.ts`:

```typescript
export const deepResearchPipeline = task({
  id: "deep-research-pipeline",
  maxDuration: 3600, // 1 hour
  // ... rest of configuration
});
```

## Architecture Decisions

### Why Trigger.dev?
- Reliable task orchestration
- Built-in retry mechanisms
- Scalable background processing
- Excellent monitoring and logging

### Why AI SDK?
- Unified interface for multiple LLM providers
- Built-in streaming and structured generation
- Type-safe integration with Zod
- Excellent Next.js integration

### Data Flow

1. User submits query via web interface
2. Server action validates input and triggers main orchestrator task
3. **Planning task** generates research strategy using GPT-4 (with retries)
4. **Search task** gathers information from multiple sources (with retries)
5. **Reflection task** analyzes results and identifies gaps using GPT-4 (with retries)
6. Additional search iterations if needed (orchestrated via tasks)
7. **Writing task** generates final comprehensive report using Claude 3.5 Sonnet (with retries)
8. All state persisted in Redis, results available via server actions

### Key Architectural Improvements

#### Task-Based Architecture
- **All AI logic is embedded in Trigger.dev tasks** (not separate services)
- Each task is self-contained with proper error handling and retries
- Tasks call other tasks via `triggerAndWait()` for reliable orchestration
- No direct service function calls - everything goes through Trigger.dev

#### Reliable State Management
- **Upstash Redis** for persistent state storage (24-hour TTL)
- State survives task failures and server restarts
- Real-time status tracking via Redis queries
- No in-memory storage that can be lost

#### Fault Tolerance
- Each task can retry independently on failure
- State is preserved between retry attempts
- Graceful degradation if individual tasks fail
- Comprehensive error logging and monitoring

#### Telemetry & Observability
- **AI SDK telemetry** enabled on all LLM calls for performance monitoring
- OpenTelemetry instrumentation for distributed tracing
- Detailed logging of AI model interactions and response times
- Real-time monitoring of research pipeline performance

#### Performance Optimizations
- **Parallel Search Execution** - Multiple search queries execute simultaneously for 2-3x speed improvement
- **Quick Mode** - Bypass reflection phase for rapid results when time is critical
- **Dynamic Iteration Limits** - Automatically adjust complexity based on research depth
- **Intelligent Resource Allocation** - Optimize search result counts per query based on mode
- **Provider-Specific Models** - Each AI provider uses optimized models for planning, reflection, and writing
- **Batch Task Execution** - Multi-provider research uses Trigger.dev's native batch API for true parallelism
- **Dynamic Model Loading** - Models are imported on-demand based on provider name for optimal performance

## Production Considerations

### Database Integration

Replace the in-memory storage with a real database:

```typescript
// Instead of Map
const researchStore = new Map<string, ResearchState>();

// Use database
import { db } from '@/lib/database';
await db.research.create({
  data: researchState
});
```

### Search API Integration

The pipeline now uses **Exa Search API** for real-time web search:
- Live crawling for fresh content
- Full content extraction
- High-quality relevance scoring
- Support for various content types
- No need for additional search API setup

### Monitoring and Logging

- Use Trigger.dev dashboard for task monitoring
- Add application logging with structured data
- Set up error tracking and alerting

### Rate Limiting

- Implement rate limiting for API calls
- Add queue management for concurrent research tasks
- Monitor AI API usage and costs

## Troubleshooting

### Common Issues

1. **AI API Errors**: Check API keys and rate limits
2. **Task Timeouts**: Increase maxDuration in task configuration
3. **Search Failures**: Verify search API configuration
4. **Type Errors**: Ensure Zod schemas match actual data

### Debug Mode

Enable debug logging:

```typescript
import { logger } from "@trigger.dev/sdk/v3";

logger.log("Debug info", { data: yourData });
```

## Contributing

1. Follow the established patterns for server actions
2. Add proper TypeScript types and Zod validation
3. Test both quick and deep research flows
4. Update documentation for new features

## License

This project is open source and available under the MIT License. 