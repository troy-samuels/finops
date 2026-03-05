<p align="center">
  <h1 align="center">💸 FinOps Tracker</h1>
  <p align="center"><strong>Know Your True AI Costs</strong></p>
  <p align="center">
    Drop-in SDK that auto-tracks every OpenAI, Anthropic, and Google AI call.<br/>
    Zero config. Zero crashes. Real-time dashboard.
  </p>
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://www.npmjs.com/package/@finops-tracker/sdk"><img src="https://img.shields.io/npm/v/@finops-tracker/sdk.svg" alt="npm version" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-strict-blue.svg" alt="TypeScript Strict" /></a>
</p>

---

## Why?

You're burning $500/month on AI calls and have **no idea** where it goes. OpenAI's billing page shows a total. That's it. No breakdown by feature, endpoint, or model.

FinOps Tracker wraps your existing AI clients with a single line of code. Every call is tracked, batched, and shipped to a dashboard — all without touching your application logic.

```
Your app → AI SDK → Proxy wrapper (invisible) → Telemetry queue → Dashboard
```

---

## Quick Start

```bash
npm install @finops-tracker/sdk
```

### OpenAI

```typescript
import OpenAI from "openai";
import { ProjectTracker } from "@finops-tracker/sdk";

const tracker = new ProjectTracker({
  apiKey: process.env.FINOPS_API_KEY!,
  baseUrl: process.env.FINOPS_BASE_URL!,
});

const openai = tracker.wrapOpenAI(new OpenAI());

// Use openai as normal — every call is tracked automatically
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
});
```

### Anthropic

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { ProjectTracker } from "@finops-tracker/sdk";

const tracker = new ProjectTracker({
  apiKey: process.env.FINOPS_API_KEY!,
  baseUrl: process.env.FINOPS_BASE_URL!,
});

const anthropic = tracker.wrapAnthropic(new Anthropic());

const message = await anthropic.messages.create({
  model: "claude-sonnet-4-5-20250514",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello!" }],
});
```

### Google AI

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ProjectTracker } from "@finops-tracker/sdk";

const tracker = new ProjectTracker({
  apiKey: process.env.FINOPS_API_KEY!,
  baseUrl: process.env.FINOPS_BASE_URL!,
});

const genAI = tracker.wrapGoogleAI(new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY!));
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const result = await model.generateContent("Hello!");
```

---

## Features

| Feature | Description |
|---------|-------------|
| **🔌 Auto-discovery** | Scans `process.env` for known provider keys on init |
| **📦 Batch queue** | Events are batched and flushed every 2s (configurable) |
| **🔥 Fire-and-forget** | `trackLLM()` is synchronous — enqueues and returns instantly |
| **🛡️ Zero-crash guarantee** | Every public method is try/caught. Network errors swallowed. Your app never dies because of us |
| **🪶 Lightweight** | Zero runtime dependencies. ~5KB minified |
| **💰 Pricing registry** | Built-in cost calculator for 20+ models across 5 providers |
| **🧩 Provider agnostic** | Works with OpenAI, Anthropic, Google, Cohere, Mistral, or any custom API |
| **📊 Real-time dashboard** | Next.js dashboard with per-model cost breakdowns |

---

## Built-in Pricing

The SDK ships with a pricing registry for cost estimation:

```typescript
import { getCostForTokens } from "@finops-tracker/sdk";

const cost = getCostForTokens("openai", "gpt-4o", 1000, 500);
// → $0.0075 (1000 × $2.50/M input + 500 × $10/M output)
```

Supported models: GPT-4o, GPT-4o-mini, o1, o3-mini, Claude Opus/Sonnet/Haiku, Gemini 2.0 Flash, Gemini 1.5 Pro, Command R+, Mistral Large, and more.

---

## Dashboard

<!-- TODO: Replace with actual screenshot -->
![Dashboard Screenshot](docs/dashboard-placeholder.png)

*Real-time cost tracking by provider, model, and time period.*

---

## Configuration

```typescript
const tracker = new ProjectTracker({
  apiKey: "your-api-key",           // Required
  baseUrl: "https://your.supabase.co", // Required
  flushIntervalMs: 2000,            // Default: 2000
  maxBatchSize: 50,                 // Triggers immediate flush
  maxQueueSize: 1000,               // Drop oldest when full
  autoDiscovery: true,              // Scan env for providers
});
```

### Graceful Shutdown

```typescript
// Before your process exits
await tracker.shutdown();
```

---

## How It Compares

| | **FinOps Tracker** | Helicone | LangSmith | Vantage |
|---|---|---|---|---|
| **Setup** | 1 line of code | Proxy URL swap | LangChain required | Cloud account |
| **Latency overhead** | Zero (async fork) | +50-100ms (proxy) | Varies | N/A |
| **Self-hosted** | ✅ Supabase | ❌ Cloud only | ❌ Cloud only | ❌ Cloud only |
| **Provider lock-in** | None | None | LangChain | AWS |
| **Open source** | ✅ MIT | ✅ Apache 2.0 | Partial | ❌ |
| **Pricing** | Free (self-host) | Free tier + paid | Free tier + paid | Per-resource |
| **Crash safety** | ✅ Guaranteed | ❌ Proxy can fail | ❌ | N/A |
| **Multi-provider** | ✅ OpenAI, Anthropic, Google, Cohere, Mistral | ✅ | ✅ (via LangChain) | ❌ |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                Your Application              │
│                                              │
│  openai = tracker.wrapOpenAI(new OpenAI())   │
│                    │                         │
│         ┌─────────▼──────────┐               │
│         │   Proxy Wrapper    │  ← Zero overhead  │
│         │  (intercepts calls)│               │
│         └─────────┬──────────┘               │
│                   │ fire-and-forget           │
│         ┌─────────▼──────────┐               │
│         │    Batch Queue     │  ← Drop oldest    │
│         │  (max 1000 items)  │               │
│         └─────────┬──────────┘               │
└───────────────────┼──────────────────────────┘
                    │ flush every 2s
          ┌─────────▼──────────┐
          │  Supabase Edge Fn  │
          │  (track-event)     │
          └─────────┬──────────┘
                    │
          ┌─────────▼──────────┐
          │  PostgreSQL        │
          │  (events table)    │
          └─────────┬──────────┘
                    │
          ┌─────────▼──────────┐
          │  Next.js Dashboard │
          └────────────────────┘
```

---

## Project Structure

```
├── apps/dashboard     → Next.js App Router frontend
├── packages/sdk       → TypeScript telemetry SDK (this package)
├── supabase/          → DB migrations + Edge Functions
├── turbo.json         → Turborepo config
└── pnpm-workspace.yaml
```

---

## Development

```bash
# Install dependencies
pnpm install

# Type check everything
pnpm typecheck

# Build all packages
pnpm build

# Run SDK tests
cd packages/sdk && pnpm test
```

---

## License

MIT © [Troy Samuels](https://github.com/troy-samuels)
