# CostPane GitHub Action

> **Analyse PRs for AI cost impact. Budget enforcement and model change detection.**

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-CostPane%20Cost%20Gate-blue?logo=github)](https://github.com/marketplace/actions/costpane-ai-cost-gate)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Track AI costs in CI/CD. Get instant visibility into model upgrades, new dependencies, and estimated cost impact — right in your PRs.

**Works without a CostPane account** in analysis mode. Use it for free to detect AI cost changes in pull requests.

## 🚀 Quick Start

### Analysis Mode (No Account Needed)

Add this to `.github/workflows/costpane.yml`:

```yaml
name: CostPane Cost Analysis

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  analyse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Need full history for diff
      
      - uses: costpane/github-action@v1
        with:
          mode: 'analysis'  # Free tier - no API key needed
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Budget Mode (Requires CostPane Account)

```yaml
name: CostPane Budget Gate

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: costpane/github-action@v1
        with:
          mode: 'both'  # Both static analysis + budget check
          costpane-api-key: ${{ secrets.COSTPANE_API_KEY }}
          warn-threshold: 80   # Warn at 80% of budget
          block-threshold: 100 # Block at 100% of budget
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## 📊 What You Get

### In Every PR Comment:

**Models Detected:**

| File | Model | Provider | Est. Cost/Call | Monthly Impact |
|------|-------|----------|----------------|----------------|
| `src/chat.ts` | gpt-4o | OpenAI | $0.0035 | ~$105/mo |
| `src/search.ts` | claude-sonnet-4-5 | Anthropic | $0.0054 | ~$162/mo |

**Cost Alerts:**
- 🔴 **Model upgrade detected:** `gpt-4o-mini` → `gpt-4o` in `src/chat.ts` (+17x cost increase)
- 🟡 **New provider added:** Anthropic SDK added to dependencies

**Estimated Impact:**  
**+$267/month** in new AI costs

*Based on 1,000 calls/day at 500 prompt + 200 completion tokens*

**Budget Status (if enabled):**  
✅ $4,200 / $5,000 monthly budget (84%)  
████████████████░░░░ 84.0%

## 🎯 Operating Modes

### 1. Analysis Mode (FREE)

Analyses PR diffs for:
- ✅ New AI models added (OpenAI, Anthropic, Google, Bedrock, Azure)
- ✅ Model upgrades (e.g., `gpt-4o-mini` → `gpt-4o`)
- ✅ New provider dependencies in `package.json`
- ✅ Estimated cost impact (per-call and monthly)

**No CostPane account needed.** Perfect for getting started.

### 2. Budget Mode

Checks current spend against your monthly budget:
- ✅ Warn at configurable threshold (default: 80%)
- ✅ Block merges when budget exceeded (optional)
- ✅ Real-time budget status from CostPane API
- ✅ 5-minute caching to avoid API spam

**Requires CostPane account.** [Sign up free →](https://costpane.com/signup)

### 3. Both Mode

Runs both analysis AND budget check. Best of both worlds.

## ⚙️ Configuration

### Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `mode` | Operating mode: `analysis`, `budget`, or `both` | No | `analysis` |
| `costpane-api-key` | CostPane API key (required for budget mode) | No | — |
| `costpane-url` | CostPane API URL | No | `https://api.costpane.com` |
| `warn-threshold` | Budget percentage to trigger warning (0-100) | No | `80` |
| `block-threshold` | Budget percentage to block merge (0-100, 0 = never block) | No | `0` |
| `github-token` | GitHub token for PR comments | No | `${{ github.token }}` |
| `model-cost-threshold` | Flag model changes with cost increase above this multiplier | No | `3` |
| `fail-on-error` | Fail the action if analysis encounters errors | No | `false` |

### Outputs

| Output | Description |
|--------|-------------|
| `cost-impact` | Estimated monthly cost impact in USD |
| `budget-status` | Budget status: `ok`, `warning`, `exceeded` |
| `models-detected` | JSON array of AI models detected in the diff |

### Example: Block on Budget Exceeded

```yaml
- uses: costpane/github-action@v1
  with:
    mode: 'budget'
    costpane-api-key: ${{ secrets.COSTPANE_API_KEY }}
    block-threshold: 100  # Block merge at 100%
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Example: Warn at 70%, Block at 90%

```yaml
- uses: costpane/github-action@v1
  with:
    mode: 'budget'
    costpane-api-key: ${{ secrets.COSTPANE_API_KEY }}
    warn-threshold: 70   # Yellow flag at 70%
    block-threshold: 90  # Red flag at 90%
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Example: Flag Only Large Model Upgrades (5x+)

```yaml
- uses: costpane/github-action@v1
  with:
    mode: 'analysis'
    model-cost-threshold: 5  # Only flag 5x+ cost increases
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

## 🔍 How It Works

### Static Analysis (Mode 1)

1. **Fetch PR diff** — Uses `git diff` to get changes
2. **Parse added lines** — Extracts only new code (lines starting with `+`)
3. **Detect AI models** — Pattern-matches for OpenAI, Anthropic, Google, Bedrock, Azure
4. **Look up pricing** — Uses built-in pricing registry (27+ models)
5. **Calculate costs** — Estimates per-call and monthly costs (1000 calls/day baseline)
6. **Detect upgrades** — Compares models in the same file for cost increases
7. **Generate comment** — Posts beautiful markdown to PR

**Detects these patterns:**

**TypeScript/JavaScript:**
```typescript
model: "gpt-4o"
model: 'claude-sonnet-4-5'
getGenerativeModel({ model: "gemini-2.5-pro" })
modelId: "anthropic.claude"
deploymentName: "gpt-4-deployment"
```

**Python:**
```python
model="gpt-4o"
model="claude-sonnet-4-5"
```

### Budget Gate (Mode 2)

1. **Fetch budget status** — `GET /api/v1/budget/status` from CostPane API
2. **Compare thresholds** — Check current spend vs warn/block thresholds
3. **Cache for 5 minutes** — Avoid hammering API on multiple pushes
4. **Return status** — `ok`, `warning`, or `exceeded`
5. **Fail-open policy** — If API is down, warn but don't block (prevents CI breakage)

## 🧪 Supported Providers & Models

### OpenAI
`gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`, `o1`, `o1-mini`, `o3-mini`, `o3`, `o4-mini`, `gpt-4.1`, `gpt-4.1-mini`, `gpt-4.1-nano`

### Anthropic
`claude-opus-4-5`, `claude-opus-4-6`, `claude-sonnet-4-5`, `claude-sonnet-4-0`, `claude-3-5-haiku`

### Google
`gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-pro`, `gemini-1.5-flash`

### Cohere
`command-r-plus`, `command-r`

### Mistral
`mistral-large`, `mistral-medium`, `mistral-small`

### AWS Bedrock
Pattern-based detection for `anthropic.*`, `amazon.*`, `meta.*`, `cohere.*` model IDs

### Azure OpenAI
Detects `deploymentName` and `deployment_name` patterns (pricing requires manual mapping)

*Pricing data last updated: March 2026*

## 🛠️ Troubleshooting

### "Failed to get diff"

**Cause:** Not enough git history or wrong refs.

**Fix:** Ensure you fetch full history:
```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0  # Fetch all history
```

### "Budget API returned 401"

**Cause:** Invalid or missing API key.

**Fix:** Check that `COSTPANE_API_KEY` secret is set correctly in GitHub repo settings.

### "No models detected" (but there are models)

**Causes:**
- Models in removed lines (only added lines are scanned)
- Models in comments or strings
- Unsupported patterns

**Fix:** Check that your model references match the supported patterns above.

### PR comment not posted

**Causes:**
- Missing `github-token` input
- Insufficient permissions for the GitHub token

**Fix:**
```yaml
permissions:
  pull-requests: write  # Needed to post comments
```

### Action is slow

**Cause:** Large diffs take time to parse.

**Fix:** Consider limiting the action to specific file paths:
```yaml
on:
  pull_request:
    paths:
      - 'src/**/*.ts'
      - 'src/**/*.js'
      - 'src/**/*.py'
```

### False positives on model detection

**Cause:** Model names in strings, comments, or documentation.

**Fix:** The detector filters out comments and non-API strings, but may miss edge cases. Adjust `model-cost-threshold` to reduce noise:
```yaml
model-cost-threshold: 5  # Only flag 5x+ upgrades
```

## 📈 Best Practices

### 1. Start with Analysis Mode

No account needed. Get instant value:
```yaml
mode: 'analysis'
```

### 2. Add Budget Gate Later

Once you're tracking costs in the CostPane dashboard:
```yaml
mode: 'both'  # Analysis + Budget
```

### 3. Don't Block on First Week

Give your team time to understand the costs:
```yaml
warn-threshold: 80
block-threshold: 0  # Never block (just warn)
```

### 4. Set Realistic Thresholds

Start conservative, tighten over time:
```yaml
warn-threshold: 90   # Warn late
block-threshold: 110 # Block with buffer
```

### 5. Combine with Slack Notifications

Post alerts to Slack when budget is exceeded (use GitHub Actions + Slack webhook).

## 🔐 Security & Privacy

### No Prompts or Responses

The action **never** sees your AI prompts or responses. It only analyses:
- File paths
- Model identifiers
- Token counts (estimated)
- Costs (calculated locally)

### Fail-Open Policy

If the CostPane API is unreachable:
- Action returns `warning` status
- PR is NOT blocked
- Comment shows API error

This prevents CI breakage due to temporary API issues.

### Local Pricing

All pricing calculations happen locally. No network call needed for cost estimates.

## 📚 Examples

### Full CI/CD Pipeline

```yaml
name: CI

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test
  
  costpane:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: costpane/github-action@v1
        with:
          mode: 'both'
          costpane-api-key: ${{ secrets.COSTPANE_API_KEY }}
          warn-threshold: 80
          block-threshold: 100
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Conditional Blocking

Block only on main branch:

```yaml
- uses: costpane/github-action@v1
  with:
    mode: 'both'
    costpane-api-key: ${{ secrets.COSTPANE_API_KEY }}
    block-threshold: ${{ github.base_ref == 'main' && 100 || 0 }}
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Save Outputs for Later Steps

```yaml
- uses: costpane/github-action@v1
  id: costpane
  with:
    mode: 'analysis'
    github-token: ${{ secrets.GITHUB_TOKEN }}

- name: Check cost impact
  if: steps.costpane.outputs.cost-impact > 100
  run: |
    echo "High cost impact detected: $${{ steps.costpane.outputs.cost-impact }}/month"
    # Send to Slack, email, etc.
```

## 🆘 Support

- 📖 [Documentation](https://costpane.com/docs)
- 💬 [Discord](https://discord.gg/costpane)
- 🐛 [Issues](https://github.com/costpane/github-action/issues)
- ✉️ [Email](mailto:support@costpane.com)

## 📜 License

MIT

---

<p align="center">
  <strong>Built by <a href="https://costpane.com">CostPane</a> — Track every AI dollar.</strong>
</p>
