/**
 * Anthropic Quickstart — Complete working example
 * 
 * Copy, paste, and run this example to see CostPane in action.
 * 
 * Requirements:
 * - npm install @anthropic-ai/sdk @costpane/sdk
 * - Set COSTPANE_API_KEY and COSTPANE_URL env vars
 * - Set ANTHROPIC_API_KEY env var
 */

import Anthropic from '@anthropic-ai/sdk'
import { ProjectTracker } from '@costpane/sdk'

async function main() {
  // Initialize the tracker with attribution and budget alerts
  const tracker = new ProjectTracker({
    apiKey: process.env.COSTPANE_API_KEY!,
    baseUrl: process.env.COSTPANE_URL!,
    defaultAttribution: {
      feature: 'document-analysis',
      environment: process.env.NODE_ENV || 'development',
      costCentre: 'product-team',
    },
    budgetConfig: {
      hourlyLimitUsd: 5,
      dailyLimitUsd: 100,
      onBudgetAlert: (alert) => {
        console.warn(`⚠️  ${alert.type} budget: ${alert.percentUsed.toFixed(1)}% used ($${alert.currentUsd.toFixed(2)}/$${alert.limitUsd})`)
      },
      onBudgetExceeded: (alert) => {
        console.error(`🚨 ${alert.type} budget exceeded! $${alert.currentUsd.toFixed(2)}/$${alert.limitUsd}`)
      },
    },
  })

  // Wrap the Anthropic client — every call is now auto-tracked
  const anthropic = tracker.wrapAnthropic(new Anthropic())

  console.log('📞 Calling Anthropic Claude 3.5 Sonnet...\n')

  // Make a message — automatically tracked with cost attribution
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: 'Explain how CostPane helps developers track AI costs in 2-3 sentences.',
      },
    ],
  })

  const textContent = response.content.find((block) => block.type === 'text')
  if (textContent && textContent.type === 'text') {
    console.log('💬 Response:', textContent.text)
  }

  console.log('\n📊 Usage:', {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  })

  // Track a specific feature differently (override default attribution)
  console.log('\n🏷️  Tracking a custom feature...')
  tracker.trackLLM({
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    tokensPrompt: 250,
    tokensCompletion: 180,
    attribution: {
      feature: 'contract-review',
      workflow: 'legal-compliance',
      userId: 'user-123',
      tags: {
        documentType: 'nda',
        priority: 'high',
      },
    },
    metadata: {
      documentPages: 5,
      processingTimeMs: 3200,
    },
  })

  // Get estimated cost for a hypothetical call
  const estimatedCost = tracker.getEstimatedCost(
    'anthropic',
    'claude-3-5-sonnet-20241022',
    1000,
    500,
  )
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
