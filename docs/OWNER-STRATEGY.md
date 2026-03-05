# FinOps Tracker — Owner's Strategy Document

> **Author:** Malcolm (owning this project)
> **Date:** 5 March 2026
> **Purpose:** Actionable strategy to get first 10 paying customers in 60 days

---

## 1. Brand Name Decision

### The Problem with "FinOps Tracker"
- Generic. Sounds like a spreadsheet plugin.
- "FinOps" is already a loaded term (FinOps Foundation, cloud FinOps). We'd constantly fight for SEO against the established cloud cost management category.
- "Tracker" implies passive monitoring. We're selling financial control.

### Recommended Name: **CostPane**

**Why:**
- **Short, memorable, easy to spell.** Two syllables. Sounds professional.
- **"Pane"** has double meaning: a dashboard pane (glass, window into your data) AND a pain pane (the pain we solve). Subtle but effective.
- **Finance-adjacent without being jargon.** CFOs understand "cost." Engineers understand "pane" (like a dashboard pane).
- **Not a made-up word** — it's two real English words combined. No explanation needed.
- **Sounds like a product, not a feature.** Helicone, Langfuse, Braintrust — these all sound like products. "FinOps Tracker" sounds like a column in Jira.

### Domain Availability (verified 5 March 2026)

| Domain | Status | Priority |
|--------|--------|----------|
| **costpane.com** | ✅ Available | Buy immediately |
| **costpane.io** | ✅ Available | Buy as primary |
| **costpane.ai** | ✅ Available | Buy for redirect |
| **costpane.dev** | ✅ Available | Buy for SDK docs |
| **costpane.co** | ✅ Available | Buy as backup |
| **costpane.co.uk** | ✅ Available | Buy for UK presence |

**Action:** Register all 6 domains. Total cost: ~£60-80/year. Use `costpane.io` as primary (dev tools convention), redirect `.com` and `.ai` to it.

### Runner-up Names

| Name | Domains Available | Notes |
|------|-------------------|-------|
| CostScope | .io, .ai, .dev, .co.uk | Good but sounds more like analytics than control |
| CostGrid | .io, .ai, .dev, .co.uk | Too infrastructure-y |
| InferCost | .io only | Great name but .ai and .com taken |
| SpendLens | .dev, .com | .io and .ai taken — dealbreaker |

---

## 2. Competitive Differentiation: Why CostPane Wins

### The Market Map (as of March 2026)

| Tool | Positioning | Pricing | Setup | Key Weakness |
|------|------------|---------|-------|-------------|
| **Helicone** | LLM observability for devs | $0-$799/mo | Proxy OR async import | Acquired by Mintlify. Product direction now unclear. Proxy adds latency. No finance features. |
| **Langfuse** | Open-source LLM tracing | $0-$2499/mo | SDK callbacks | Primarily LangChain ecosystem. Cost tracking is a side feature, not the product. |
| **Braintrust** | AI eval + observability | $0-$249/mo | SDK | Focused on evaluation, not costs. Cost is an afterthought in the UI. |
| **Vantage** | Cloud FinOps (broad) | $0-$200/mo | API key linking | Tracks 27 providers at BILLING level. Can't see per-request costs. AI is one tiny tab. |
| **Datadog LLM Obs** | Extension of Datadog | ~$200+/mo add-on | dd-trace agent | Requires full Datadog stack. Expensive. Limited to companies already paying Datadog. |
| **Provider dashboards** | Basic billing view | Free | N/A | Single-provider only. No per-feature breakdown. No team allocation. |

### CostPane's Unique Position

**Nobody occupies this specific square:**

```
                    Finance-first ←→ Engineering-first
                         │
    Deep AI-specific     │  CostPane        Helicone
    (request-level)      │  (VACANT)        LangSmith
                         │                  Langfuse
                         │                  Braintrust
                         │
    Broad cloud          │  Vantage         Datadog
    (billing-level)      │  CloudHealth     New Relic
                         │  Apptio
```

**CostPane is the only tool that is:**
1. AI-specific (not broad cloud)
2. Request-level (not billing-level)
3. Finance-first (not engineering-first)
4. SDK-native (not proxy-based)

This is a genuine whitespace position. Nobody else is here.

### Three Differentiation Pillars

#### Pillar 1: "No Proxy" Trust Model
Helicone's primary integration is a proxy — your API calls go through their servers. Langfuse requires callback hooks. Both require developers to trust a third party with their prompts and responses.

**CostPane's SDK wraps your existing client locally.** We never see your prompts. We never see your responses. We only receive: provider, model, token counts, timestamps, and cost. That's it.

This is our **#1 sales message to engineering leads who've rejected Helicone**: "We track your costs without seeing your data."

#### Pillar 2: "Cost per Feature" Attribution
This is the feature no competitor offers cleanly. A company using AI in customer support, search, and content generation needs to know: "How much does our AI-powered search cost per query?"

Helicone can tag requests with custom properties, but there's no built-in attribution engine. You'd need to build the analysis yourself.

**CostPane's tag-based allocation + chargeback reports do this out of the box.** Define cost centres (departments, features, products), set allocation rules, generate monthly internal billing reports. The CFO gets a PDF.

#### Pillar 3: "Pounds, Not Tokens"
Every competitor shows "1.2M tokens consumed." Nobody's mother knows what a token is.

**CostPane shows "£847 spent on AI this week."** Every metric, every alert, every report is in currency. This is the difference between a dev tool and a finance tool.

---

## 3. First 10 Customers: The Playbook

### Who Are the First 10?

**They are NOT enterprises.** They are:
- **Funded startups (Series A-B) with 5-20 engineers building AI features**
- Spending £2K-£20K/month on AI APIs
- Have hit the "surprise bill" moment at least once
- Using multiple providers (OpenAI + Anthropic minimum)
- Engineering lead or VP Eng is the buyer (not procurement)

**Why this profile:**
- They feel the pain (£2K+/mo is enough to care)
- They can make a purchase decision in 1 day (no procurement, no security review)
- They're on Reddit, HN, and Twitter/X (reachable)
- They'll give genuine feedback
- They'll become case studies

### The 60-Day Customer Acquisition Plan

#### Week 1-2: Foundation (before ANY marketing)

**Ship the missing table-stakes:**
1. Stripe billing integration (Team plan: £99/mo)
2. Free tier limits (25K requests, 7-day retention, 1 project)
3. Upgrade prompts when hitting limits
4. Working onboarding flow (signup → API key → SDK install → first event)
5. Data transparency page (`/transparency`) showing exact JSON payloads

**Deploy to production:**
- Dashboard live at costpane.io
- SDK published to npm as `@costpane/sdk`
- GitHub repo at `costpane/costpane` (public, MIT)

**Dogfood internally:**
- Install SDK in TutorLingua (real production app with real AI calls)
- Install SDK in OpenRole (another real production app)
- Screenshot real dashboards with real data for marketing

#### Week 3: Content-Led Launch (not product launch)

**Don't launch the product. Launch the data.**

Blog post: **"We tracked every AI API call for 30 days — here's what £4,200 actually bought us"**

Contents:
- Real cost data from dogfooding (TutorLingua + OpenRole)
- Breakdown by model: "GPT-4o cost us 4.1× more than Claude Haiku for summarisation with identical quality"
- Breakdown by feature: "Our game generation feature costs £0.03/play. Our content generation costs £2.40/article."
- The surprise: "43% of our spend was on embedding calls we'd forgotten about"
- Screenshot of the CostPane dashboard showing all this

**Distribution:**
- Post to HN as "Show HN" (6am PT, Tuesday/Wednesday)
- Reddit: r/programming, r/SaaS, r/devops, r/ExperiencedDevs (as discussion, not promo)
- Twitter/X: Thread with the best data points
- LinkedIn: Post targeting engineering leaders

**Why this works:**
- It's genuinely useful content (cost benchmarks are rare)
- It proves the product works (real data, not mock data)
- It's shareable ("look what AI actually costs")
- It positions CostPane as "the AI cost people" without being salesy

**Target: 200+ HN upvotes, 500 site visitors, 50 free signups, 5 install the SDK**

#### Week 4: Direct Outreach to Warm Leads

**From the HN/Reddit posts, identify:**
- Anyone who commented about their own AI costs
- Anyone who asked "how do you do this?"
- Anyone who upvoted (some profiles are public)

**DM them personally:**
> "Hey — saw your comment about tracking AI costs. We built CostPane specifically for this. It's an SDK wrapper (no proxy, no prompt access) that tracks per-request costs across OpenAI/Anthropic/Google. Free tier has 25K requests. Happy to help you set it up — takes about 60 seconds."

**Also search for:**
- Reddit threads asking about cost tracking (they exist — I found them: r/devops/comments/1q0ecii is literally our target user)
- OpenAI community forum threads about billing visibility
- Twitter/X threads about "surprise AI bills"

**Target: 10 personal conversations, 5 install SDK, 2 hit free limit**

#### Week 5-6: Convert Free to Paid

**By now we should have ~50 free users from HN + Reddit + outreach.**

Conversion triggers (built in week 1-2):
1. **Request limit banner** at 20K of 25K: "You've used 80% of your free requests"
2. **Retention cliff** at day 8: "Your data from last week is no longer available"
3. **Second user** request: "Add team members on the Team plan"
4. **Budget alerts**: "Set up cost alerts — available on Team"

**Email sequence (trigger-based, not time-based):**
- Day 1: Welcome + setup guide
- Day 7 (if tracking): "Your first week: you tracked X requests across Y models. Your top cost driver is Z."
- Day 14 (if approaching limit): "You're at 80% — upgrade for 500K requests/mo"
- Day 21: Case study email (from our dogfooding data)
- Day 28: "Your 7-day data just expired. Team plan keeps 90 days."

**Target: 5 free-to-paid conversions at £99/mo = £495 MRR**

#### Week 7-8: Second Wave + Enterprise Seed

**Second content piece:** "AI cost benchmarks: what we learned from our first 50 users"
- Aggregate (anonymised) data from actual users
- Industry benchmarks: average cost per AI interaction, cost by model, etc.
- This becomes a linkable SEO asset

**Enterprise seeding:**
- Identify 20 companies spending heavily on AI (from job posts mentioning "AI costs," "LLM budget," "API optimization")
- LinkedIn outreach to VP Eng / CTO:
  > "Most teams spending £10K+/mo on AI APIs have no visibility into which feature or team drives the cost. We've built a tool that solves this in 60 seconds — no proxy, no prompt access. Happy to run a free analysis if useful."
- Target: 3 demo calls, 1 pilot

**Target by day 60: 10 paying customers (8 Team + 2 Business), ~£1,400 MRR**

---

## 4. Where to Put the Project

### Hosting & Infrastructure

| Component | Where | Cost | Why |
|-----------|-------|------|-----|
| Dashboard (Next.js) | **Vercel** | Free (hobby) → $20/mo | Already know the platform, zero config deploys |
| Database | **Supabase** | Free → $25/mo | Already built, RLS, Edge Functions, Postgres |
| SDK | **npm** (@costpane/sdk) | Free | Standard distribution for JS/TS SDKs |
| Source code | **GitHub** (costpane org) | Free | Public repo for SDK, private for dashboard |
| Domains | **Cloudflare** | ~£10/yr each | DNS + free SSL + edge caching |
| Email | **Resend** | Free (100/day) | Transactional emails (signup, reports, alerts) |
| Payments | **Stripe** | 1.5% + 20p/txn | Standard for SaaS |

**Total infrastructure cost at launch: £0-50/month.**
**At 50 customers: ~£75/month.**

### Development Infrastructure

| Platform | Purpose | Priority |
|----------|---------|----------|
| **GitHub** (costpane org) | Source code, CI/CD, issues | Week 1 |
| **npm** (@costpane/sdk) | SDK distribution | Week 1 |
| **Vercel** | Dashboard hosting | Week 1 |
| **Product Hunt** | Launch platform (week 5-6) | Week 4 prep |
| **Hacker News** | Content distribution | Week 3 |
| **Reddit** | Community presence | Ongoing |
| **Twitter/X** | Brand presence | Week 2 |
| **LinkedIn** | Enterprise outreach | Week 4 |

---

## 5. The Honest Assessment

### Why This Could Work

1. **The pain is real and growing.** AI spend is doubling every 6 months for most companies. Every month, more engineering leads get their first surprise AI bill.
2. **The position is genuinely vacant.** Finance-first + AI-specific + SDK-native. Nobody's here.
3. **The setup is genuinely easy.** 1 line of code, no proxy, no prompt access. This removes the #1 objection.
4. **Small market entry, large expansion.** Start with "know your AI costs" → expand to "control your AI costs" → expand to "govern your AI costs." Each step justifies higher pricing.
5. **Chargeback reports are a genuine moat.** Once a finance team depends on monthly chargeback reports, switching costs are enormous. That's a 12+ month retention anchor.

### Why This Could Fail

1. **Provider dashboards get good enough.** If OpenAI ships per-project cost breakdowns with team allocation, our free tier value evaporates. Mitigation: move faster on finance features they'll never build.
2. **Helicone adds finance features.** They have distribution and YC backing (though Mintlify acquisition may shift focus). Mitigation: our "no proxy" trust model is structural — they can't match it without rebuilding.
3. **Nobody cares about AI costs enough to pay £99/mo.** If prices drop faster than usage grows, the total spend stays low enough that spreadsheets suffice. Mitigation: target companies spending £5K+/mo where £99 is trivial.
4. **One-man execution risk.** Building, marketing, selling, supporting — all Troy. Mitigation: automate everything possible, focus ruthlessly, use AI (ironically) to multiply output.

### The Honest Numbers

| Metric | Optimistic | Realistic | Pessimistic |
|--------|-----------|-----------|-------------|
| Free users (day 60) | 200 | 80 | 30 |
| Paying customers (day 60) | 15 | 8 | 3 |
| MRR (day 60) | £1,800 | £900 | £300 |
| Time to £10K MRR | 6 months | 9 months | 14 months |
| Time to £100K MRR | 12 months | 18 months | Never (pivot needed) |

---

## 6. Immediate Action Items (This Week)

| # | Action | Owner | When |
|---|--------|-------|------|
| 1 | Register costpane.com, .io, .ai, .dev, .co, .co.uk | Troy | Today |
| 2 | Create GitHub org: `costpane` | Troy | Today |
| 3 | Rename SDK package to `@costpane/sdk` | Malcolm | After domains secured |
| 4 | Create Stripe account for CostPane | Troy | Today |
| 5 | Set up Vercel project under costpane.io | Malcolm | After domains |
| 6 | Build Stripe billing integration (Team £99/mo) | Malcolm | Days 1-3 |
| 7 | Build free tier limits + upgrade prompts | Malcolm | Days 3-5 |
| 8 | Build onboarding flow (signup → API key → first event) | Malcolm | Days 5-7 |
| 9 | Build /transparency page (data contract) | Malcolm | Day 7 |
| 10 | Install SDK in TutorLingua + OpenRole for dogfooding | Malcolm | Day 7 |
| 11 | Create Twitter/X account: @costpane | Troy | This week |
| 12 | Write "30 days of AI costs" blog post with real data | Malcolm | Week 2-3 |

---

*This document should be reviewed weekly and updated as we learn from real user behaviour. The single most important metric to watch: SDK installs → free signups → conversion rate. If free-to-paid is below 5% after 30 days, revisit the free tier limits.*
