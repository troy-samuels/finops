# @costpane/sdk

Track every AI API call. See costs in real-time. No proxy, no config, no drama.

[![npm version](https://badge.fury.io/js/@costpane%2Fsdk.svg)](https://www.npmjs.com/package/@costpane/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Install

```bash
npm install @costpane/sdk
```

> **Note:** Package is also available as `@finops-tracker/sdk` during transition period.

## Quick Start (60 seconds)

### OpenAI

```typescript
import OpenAI from 'openai'
import { ProjectTracker } from '@costpane/sdk'

const tracker = new ProjectTracker({
  apiKey: process.env.COSTPANE_API_KEY!,
  baseUrl: process.env.COSTPANE_URL!,
})

const openai = tracker.wrapOpenAI(new OpenAI())

// Every call is now auto-tracked with cost attribution
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
})
```

### Anthropic

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { ProjectTracker } from '@costpane/sdk'

const tracker = new ProjectTracker({
  apiKey: process.env.COSTPANE_API_KEY!,
  baseUrl: process.env.COSTPANE_URL!,
})

const anthropic = tracker.wrapAnthropic(new Anthropic())

// Auto-tracked
const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello!' }],
})
```

### Google AI

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'
import { ProjectTracker } from '@costpane/sdk'

const tracker = new ProjectTracker({
  apiKey: process.env.COSTPANE_API_KEY!,
  baseUrl: process.env.COSTPANE_URL!,
})

const genAI = tracker.wrapGoogleAI(new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!))
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

// Auto-tracked
const response = await model.generateContent('Hello!')
```

## Track Costs by Feature

**This is the killer feature.** See which parts of your app cost the most.

```typescript
const tracker = new ProjectTracker({
  apiKey: process.env.COSTPANE_API_KEY!,
  baseUrl: process.env.COSTPANE_URL!,
  defaultAttribution: {
    feature: 'customer-support-bot',
    environment: process.env.NODE_ENV,
    costCentre: 'engineering',
  },
})

// All calls inherit default attribution
const openai = tracker.wrapOpenAI(new OpenAI())

// Override per-call when needed
tracker.trackLLM({
  provider: 'openai',
  model: 'gpt-4o',
  tokensPrompt: 100,
  tokensCompletion: 50,
  attribution: {
    feature: 'search-reranking',
    workflow: 'product-search',
    costCentre: 'ml-team',
  },
})
```

**Attribution fields:**
- `feature` — Feature name (e.g., "chat-assistant", "document-analysis")
- `workflow` — Use-case identifier (e.g., "onboarding", "support-ticket")
- `costCentre` — Department (e.g., "engineering", "customer-success")
- `userId` — User or customer identifier
- `environment` — Environment (e.g., "production", "staging", "development")
- `tags` — Custom key-value tags for flexible attribution

## Budget Alerts

Get notified before you blow your budget.

```typescript
const tracker = new ProjectTracker({
  apiKey: process.env.COSTPANE_API_KEY!,
  baseUrl: process.env.COSTPANE_URL!,
  budgetConfig: {
    hourlyLimitUsd: 10,
    dailyLimitUsd: 100,
    onBudgetAlert: (alert) => {
      // Fires at 80% of limit
      console.warn(`⚠️ ${alert.type} budget: ${alert.percentUsed}% used ($${alert.currentUsd.toFixed(2)}/$${alert.limitUsd})`)
      // Send to Slack, PagerDuty, etc.
    },
    onBudgetExceeded: (alert) => {
      // Fires at 100% of limit
      console.error(`🚨 ${alert.type} budget exceeded! $${alert.currentUsd.toFixed(2)}/$${alert.limitUsd}`)
      // Disable features, send alerts, etc.
    },
  },
})
```

Budget windows reset automatically:
- **Hourly:** Rolling 1-hour windows
- **Daily:** Rolling 24-hour windows

## Configuration

```typescript
interface ProjectTrackerConfig {
  /** API key from your CostPane dashboard */
  apiKey: string
  
  /** CostPane project base URL (e.g., "https://your-project.supabase.co") */
  baseUrl: string
  
  /** Interval (ms) between automatic queue flushes. Default: 2000 */
  flushIntervalMs?: number
  
  /** Queue length that triggers an immediate flush. Default: 50 */
  maxBatchSize?: number
  
  /** Hard cap on queue length. Oldest items dropped when full. Default: 1000 */
  maxQueueSize?: number
  
  /** Run environment variable discovery on init. Default: true */
  autoDiscovery?: boolean
  
  /** 
   * Tracking mode controls what data is transmitted:
   * - 'full' (default): all data (tokens, cost, metadata, provider, model)
   * - 'cost-only': provider, model, cost — strips metadata and token counts
   * - 'tokens-only': provider, model, token counts — no metadata
   */
  trackingMode?: 'full' | 'cost-only' | 'tokens-only'
  
  /** Default attribution merged with per-call attribution (per-call wins) */
  defaultAttribution?: Attribution
  
  /** Budget limits and alert callbacks */
  budgetConfig?: BudgetConfig
}
```

## API Reference

### `wrapOpenAI<T>(client: T, attribution?: Attribution): T`

Wrap an OpenAI client to auto-track `chat.completions.create()` calls. Returns a proxied version. The original client is not modified.

```typescript
const openai = tracker.wrapOpenAI(new OpenAI(), {
  feature: 'customer-chat',
})
```

### `wrapAnthropic<T>(client: T, attribution?: Attribution): T`

Wrap an Anthropic client to auto-track `messages.create()` calls.

```typescript
const anthropic = tracker.wrapAnthropic(new Anthropic(), {
  feature: 'document-analysis',
})
```

### `wrapGoogleAI<T>(client: T, attribution?: Attribution): T`

Wrap a Google GenerativeAI client (or model instance) to auto-track `generateContent()` calls.

```typescript
const genAI = tracker.wrapGoogleAI(new GoogleGenerativeAI(apiKey), {
  feature: 'content-generation',
})
```

### `trackLLM(params: TrackLLMParams): void`

Manually track an LLM call. Useful for providers without wrappers or custom tracking logic.

```typescript
tracker.trackLLM({
  provider: 'openai',
  model: 'gpt-4o',
  tokensPrompt: 100,
  tokensCompletion: 50,
  attribution: { feature: 'my-feature' },
  metadata: { userId: '123', requestType: 'chat' },
})
```

### `trackAPI(params: TrackAPIParams): void`

Track a generic API call (non-LLM). Useful for tracking related API costs.

```typescript
tracker.trackAPI({
  provider: 'custom',
  endpoint: '/api/embeddings',
  tokensPrompt: 1000,
  tokensCompletion: 0,
  attribution: { feature: 'semantic-search' },
})
```

### `getEstimatedCost(provider: string, model: string, promptTokens: number, completionTokens: number): number | undefined`

Calculate estimated cost for a given number of tokens. Returns cost in USD, or `undefined` if the model is not in the pricing registry.

```typescript
const cost = tracker.getEstimatedCost('openai', 'gpt-4o', 1000, 500)
console.log(`Estimated cost: $${cost?.toFixed(4)}`)
```

### `setAttribution(attrs: Partial<Attribution>): void`

Update the default attribution fields. Merged with per-call attribution (per-call wins).

```typescript
// Set default attribution for all subsequent calls
tracker.setAttribution({
  environment: 'production',
  costCentre: 'ml-team',
})
```

### `flush(): Promise<TrackEventResponse | undefined>`

Manually flush the queue. Sends all queued items to the backend. Returns the API response or `undefined` on error/empty queue.

```typescript
await tracker.flush()
```

### `shutdown(): Promise<void>`

Gracefully shut down the tracker. Stops the periodic timer and performs a final flush. After shutdown, track calls are no-ops.

```typescript
// At process exit
process.on('SIGINT', async () => {
  await tracker.shutdown()
  process.exit(0)
})
```

### `getDiscoveredProviders(): string[]`

Get the list of providers discovered during initialisation (via environment variable scanning). Discovery results are stored **locally** and **never transmitted** to the server.

```typescript
const providers = tracker.getDiscoveredProviders()
console.log('Detected providers:', providers) // ['openai', 'anthropic']
```

## How It Works

CostPane uses **proxy-based wrapping** to intercept API calls:

1. **You wrap your client** — `tracker.wrapOpenAI(new OpenAI())`
2. **We intercept calls** — When you call `openai.chat.completions.create()`, we capture tokens and model
3. **We calculate cost locally** — No network call needed for cost calculation
4. **We batch events** — Events queue locally, flush every 2 seconds (configurable)
5. **We send metadata only** — Just tokens, model, cost, and attribution. **Never prompts or responses.**

The SDK operates in **fire-and-forget** mode:
- ✅ **Never crashes your app** — All public methods wrapped in try/catch
- ✅ **Network failures are silent** — If CostPane is down, your app keeps running
- ✅ **Auto-retries with backoff** — 429/500 errors retry up to 5 times with exponential backoff
- ✅ **Queue overflow protection** — Oldest events dropped if queue hits max size

## Privacy & Security

### No Proxy

CostPane does **not** proxy your API calls. We don't sit between you and OpenAI/Anthropic/Google. Your API keys go directly to the provider, just like before.

### No Prompt/Response Data

We **never** see your prompts or responses. Ever. We only track:
- Provider (e.g., "openai")
- Model (e.g., "gpt-4o")
- Token counts (prompt + completion)
- Cost (calculated locally)
- Attribution fields (feature, workflow, etc.)
- Optional metadata (only what you explicitly pass)

### Local-Only Discovery

When `autoDiscovery: true` (default), the SDK scans your environment variables for known provider prefixes (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.) to detect which providers you're using.

**This data is stored locally only** and **never transmitted** to CostPane servers. You can disable it:

```typescript
const tracker = new ProjectTracker({
  apiKey: process.env.COSTPANE_API_KEY!,
  baseUrl: process.env.COSTPANE_URL!,
  autoDiscovery: false, // Disable env scanning
})
```

### Tracking Modes

Control what data is sent:

- **`'full'`** (default): All data (tokens, cost, metadata, provider, model)
- **`'cost-only'`**: Only provider, model, and cost — strips metadata and token counts
- **`'tokens-only'`**: Provider, model, and token counts — no metadata

```typescript
const tracker = new ProjectTracker({
  apiKey: process.env.COSTPANE_API_KEY!,
  baseUrl: process.env.COSTPANE_URL!,
  trackingMode: 'cost-only', // Minimal data transmission
})
```

## Examples

See [examples/](./examples/) for complete working examples:
- [OpenAI Quickstart](./examples/openai-quickstart.ts)
- [Anthropic Quickstart](./examples/anthropic-quickstart.ts)
- [Google AI Quickstart](./examples/google-quickstart.ts)

## TypeScript

Fully typed with TypeScript. All public APIs have complete type definitions.

```typescript
import type { 
  ProjectTrackerConfig,
  Attribution,
  BudgetConfig,
  BudgetAlert,
  TrackLLMParams,
  TrackAPIParams,
} from '@costpane/sdk'
```

## License

MIT

## Support

- 📖 [Documentation](https://costpane.com/docs)
- 💬 [Discord](https://discord.gg/costpane)
- 🐛 [Issues](https://github.com/costpane/sdk/issues)
- ✉️ [Email](mailto:support@costpane.com)
