/**
 * Google AI Quickstart — Complete working example
 * 
 * Copy, paste, and run this example to see CostPane in action.
 * 
 * Requirements:
 * - npm install @google/generative-ai @costpane/sdk
 * - Set COSTPANE_API_KEY and COSTPANE_URL env vars
 * - Set GOOGLE_API_KEY env var (from Google AI Studio)
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { ProjectTracker } from '@costpane/sdk'

async function main() {
  // Initialize the tracker with attribution and budget alerts
  const tracker = new ProjectTracker({
    apiKey: process.env.COSTPANE_API_KEY!,
    baseUrl: process.env.COSTPANE_URL!,
    defaultAttribution: {
      feature: 'content-generation',
      environment: process.env.NODE_ENV || 'development',
      costCentre: 'marketing-team',
    },
    budgetConfig: {
      dailyLimitUsd: 25,
      onBudgetAlert: (alert) => {
        console.warn(`⚠️  ${alert.type} budget: ${alert.percentUsed.toFixed(1)}% used ($${alert.currentUsd.toFixed(2)}/$${alert.limitUsd})`)
      },
      onBudgetExceeded: (alert) => {
        console.error(`🚨 ${alert.type} budget exceeded! $${alert.currentUsd.toFixed(2)}/$${alert.limitUsd}`)
      },
    },
  })

  // Wrap the Google AI client — every call is now auto-tracked
  const genAI = tracker.wrapGoogleAI(
    new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!),
  )

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

  console.log('📞 Calling Google Gemini 1.5 Pro...\n')

  // Generate content — automatically tracked with cost attribution
  const response = await model.generateContent(
    'Write a compelling 2-sentence pitch for CostPane, an AI cost tracking SDK.',
  )

  console.log('💬 Response:', response.response.text())

  // Access usage metadata (if available)
  const usageMetadata = response.response.usageMetadata
  if (usageMetadata) {
    console.log('\n📊 Usage:', {
      promptTokens: usageMetadata.promptTokenCount,
      candidatesTokens: usageMetadata.candidatesTokenCount,
      totalTokens: usageMetadata.totalTokenCount,
    })
  }

  // Track a specific feature differently (override default attribution)
  console.log('\n🏷️  Tracking a custom feature...')
  tracker.trackLLM({
    provider: 'google',
    model: 'gemini-1.5-pro',
    tokensPrompt: 150,
    tokensCompletion: 100,
    attribution: {
      feature: 'blog-post-generation',
      workflow: 'content-marketing',
      userId: 'content-writer-42',
      tags: {
        postType: 'how-to',
        targetAudience: 'developers',
      },
    },
    metadata: {
      wordCount: 500,
      generationTimeMs: 2500,
    },
  })

  // Get estimated cost for a hypothetical call
  const estimatedCost = tracker.getEstimatedCost(
    'google',
    'gemini-1.5-pro',
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
