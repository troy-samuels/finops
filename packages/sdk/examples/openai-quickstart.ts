/**
 * OpenAI Quickstart — Complete working example
 * 
 * Copy, paste, and run this example to see CostPane in action.
 * 
 * Requirements:
 * - npm install openai @costpane/sdk
 * - Set COSTPANE_API_KEY and COSTPANE_URL env vars
 * - Set OPENAI_API_KEY env var
 */

import OpenAI from 'openai'
import { ProjectTracker } from '@costpane/sdk'

async function main() {
  // Initialize the tracker with attribution and budget alerts
  const tracker = new ProjectTracker({
    apiKey: process.env.COSTPANE_API_KEY!,
    baseUrl: process.env.COSTPANE_URL!,
    defaultAttribution: {
      feature: 'customer-support-bot',
      environment: process.env.NODE_ENV || 'development',
    },
    budgetConfig: {
      dailyLimitUsd: 50,
      onBudgetAlert: (alert) => {
        console.warn(`⚠️  ${alert.type} budget: ${alert.percentUsed.toFixed(1)}% used ($${alert.currentUsd.toFixed(2)}/$${alert.limitUsd})`)
      },
      onBudgetExceeded: (alert) => {
        console.error(`🚨 ${alert.type} budget exceeded! $${alert.currentUsd.toFixed(2)}/$${alert.limitUsd}`)
      },
    },
  })

  // Wrap the OpenAI client — every call is now auto-tracked
  const openai = tracker.wrapOpenAI(new OpenAI())

  console.log('📞 Calling OpenAI GPT-4o...\n')

  // Make a chat completion — automatically tracked with cost attribution
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that explains technical concepts concisely.',
      },
      {
        role: 'user',
        content: 'What is CostPane and why should I use it?',
      },
    ],
    temperature: 0.7,
    max_tokens: 150,
  })

  console.log('💬 Response:', response.choices[0].message.content)
  console.log('\n📊 Usage:', response.usage)

  // Track a specific feature differently (override default attribution)
  console.log('\n🏷️  Tracking a custom feature...')
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
    metadata: {
      searchQuery: 'best laptop for developers',
      resultsCount: 10,
    },
  })

  // Get estimated cost for a hypothetical call
  const estimatedCost = tracker.getEstimatedCost('openai', 'gpt-4o', 1000, 500)
  if (estimatedCost) {
    console.log(`\n💰 Estimated cost for 1000 prompt + 500 completion tokens: $${estimatedCost.toFixed(4)}`)
  }

  // Check which providers were auto-discovered
  const discovered = tracker.getDiscoveredProviders()
  console.log('\n🔍 Auto-discovered providers:', discovered.join(', ') || 'none')

  // Graceful shutdown — flush remaining events
  console.log('\n✅ Shutting down tracker...')
  await tracker.shutdown()
  console.log('✅ Done! Check your CostPane dashboard to see tracked costs.')
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
