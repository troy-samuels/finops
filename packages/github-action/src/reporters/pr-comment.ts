/**
 * Generate beautiful PR comments for CostPane analysis
 */

import type {
  StaticAnalysisResult,
  BudgetGateResult,
  DetectedModel,
  Provider,
} from '../types.js';
import { formatCurrency, formatPercentage } from '../modes/budget-gate.js';

/**
 * Hidden HTML marker for identifying CostPane comments
 */
export const COMMENT_MARKER = '<!-- costpane-cost-gate -->';

/**
 * Provider display names
 */
const PROVIDER_NAMES: Record<Provider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  bedrock: 'AWS Bedrock',
  'azure-openai': 'Azure OpenAI',
  unknown: 'Unknown',
};

/**
 * Get provider display name.
 * 
 * @param provider Provider identifier
 * @returns Human-readable provider name
 */
function getProviderName(provider: Provider): string {
  return PROVIDER_NAMES[provider] || 'Unknown';
}

/**
 * Generate a progress bar for budget status.
 * 
 * @param percentage Budget usage percentage (0-100)
 * @param width Bar width in characters
 * @returns ASCII progress bar
 * 
 * @example
 * ```
 * generateProgressBar(84, 20) // "████████████████░░░░"
 * ```
 */
function generateProgressBar(percentage: number, width: number = 20): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Generate models table markdown.
 * 
 * @param models Detected models
 * @returns Markdown table string
 */
function generateModelsTable(models: DetectedModel[]): string {
  if (models.length === 0) {
    return '*No AI models detected in this PR.*';
  }
  
  const lines: string[] = [
    '| File | Model | Provider | Est. Cost/Call | Monthly Impact |',
    '|------|-------|----------|----------------|----------------|',
  ];
  
  for (const model of models) {
    const costPerCall = model.costPerCall
      ? `$${model.costPerCall.toFixed(4)}`
      : '*unpriced*';
    const monthlyCost = model.monthlyCost
      ? `~${formatCurrency(model.monthlyCost)}/mo`
      : '*unpriced*';
    
    lines.push(
      `| \`${model.file}\` | ${model.model} | ${getProviderName(model.provider)} | ${costPerCall} | ${monthlyCost} |`,
    );
  }
  
  return lines.join('\n');
}

/**
 * Generate cost alerts section.
 * 
 * @param analysis Static analysis result
 * @returns Markdown string for alerts section
 */
function generateCostAlerts(analysis: StaticAnalysisResult): string {
  const alerts: string[] = [];
  
  // Model upgrades
  for (const upgrade of analysis.upgrades) {
    alerts.push(
      `- **Model upgrade detected:** \`${upgrade.from}\` → \`${upgrade.to}\` in \`${upgrade.file}\` (+${upgrade.costMultiplier}x cost increase)`,
    );
  }
  
  // New providers
  if (analysis.newProviders.length > 0) {
    const providerNames = analysis.newProviders
      .map((p) => getProviderName(p))
      .join(', ');
    alerts.push(`- **New provider added:** ${providerNames} SDK added to dependencies`);
  }
  
  if (alerts.length === 0) {
    return '';
  }
  
  return `### ⚠️ Cost Alerts\n\n${alerts.join('\n')}\n`;
}

/**
 * Generate budget status section.
 * 
 * @param budget Budget gate result
 * @returns Markdown string for budget section
 */
function generateBudgetStatus(budget: BudgetGateResult): string {
  if (budget.error) {
    return `### ⚠️ Budget Status\n\n*Unable to fetch budget data: ${budget.error}*\n`;
  }
  
  const statusEmoji = budget.status === 'ok' ? '✅' : budget.status === 'warning' ? '⚠️' : '🚨';
  const progressBar = generateProgressBar(budget.percentage);
  
  return `### ${statusEmoji} Budget Status\n\n${formatCurrency(budget.currentSpend)} / ${formatCurrency(budget.limit)} monthly budget (${formatPercentage(budget.percentage)})\n\n${progressBar} ${formatPercentage(budget.percentage)}\n`;
}

/**
 * Generate PR comment for no models detected scenario.
 * 
 * @returns Encouraging markdown comment
 */
function generateNoModelsComment(): string {
  return `${COMMENT_MARKER}
## 🔍 CostPane AI Cost Analysis

### No AI Models Detected

This PR doesn't appear to add any new AI model usage. Great job keeping costs in check! 🎉

---
<sub>Powered by <a href="https://costpane.com">CostPane</a> — Track every AI dollar. <a href="https://costpane.com/signup">Start free →</a></sub>`;
}

/**
 * Generate full PR comment markdown.
 * 
 * @param analysis Static analysis result (if analysis mode enabled)
 * @param budget Budget gate result (if budget mode enabled)
 * @returns Complete markdown comment
 * 
 * @example
 * ```typescript
 * const comment = generatePRComment(analysisResult, budgetResult);
 * await postOrUpdateComment(comment);
 * ```
 */
export function generatePRComment(
  analysis?: StaticAnalysisResult,
  budget?: BudgetGateResult,
): string {
  // Handle no models detected and no upgrades/providers
  if (
    (!analysis || (
      analysis.models.length === 0 &&
      analysis.upgrades.length === 0 &&
      analysis.newProviders.length === 0
    )) &&
    !budget
  ) {
    return generateNoModelsComment();
  }
  
  const sections: string[] = [
    COMMENT_MARKER,
    '## 🔍 CostPane AI Cost Analysis',
    '',
  ];
  
  // Models table (if analysis enabled and models detected)
  if (analysis && analysis.models.length > 0) {
    sections.push('### Models Detected in This PR', '');
    sections.push(generateModelsTable(analysis.models));
    sections.push('');
  }
  
  // Cost alerts (show even if no models detected, in case there are upgrades or new providers)
  if (analysis) {
    const alerts = generateCostAlerts(analysis);
    if (alerts) {
      sections.push(alerts);
    }
  }
  
  // Estimated impact
  if (analysis && analysis.totalMonthlyCost > 0) {
    sections.push('### 💰 Estimated Impact');
    sections.push('');
    sections.push(`**+${formatCurrency(analysis.totalMonthlyCost)}/month** in new AI costs`);
    sections.push('');
    sections.push('<sub>*Based on 1,000 calls/day at 500 prompt + 200 completion tokens*</sub>');
    sections.push('');
  }
  
  // Budget status (if budget mode enabled)
  if (budget) {
    sections.push(generateBudgetStatus(budget));
  }
  
  // Footer
  sections.push('---');
  sections.push(
    '<sub>Powered by <a href="https://costpane.com">CostPane</a> — Track every AI dollar. <a href="https://costpane.com/signup">Start free →</a></sub>',
  );
  
  return sections.join('\n');
}

/**
 * Generate error comment when analysis fails.
 * 
 * @param errors Array of error messages
 * @returns Markdown comment with errors
 */
export function generateErrorComment(errors: string[]): string {
  const errorList = errors.map((err) => `- ${err}`).join('\n');
  
  return `${COMMENT_MARKER}
## 🔍 CostPane AI Cost Analysis

### ⚠️ Analysis Failed

CostPane encountered errors while analysing this PR:

${errorList}

Please check the action logs for more details.

---
<sub>Powered by <a href="https://costpane.com">CostPane</a> — Track every AI dollar. <a href="https://costpane.com/signup">Start free →</a></sub>`;
}

/**
 * Extract the comment ID from a GitHub comment.
 * 
 * @param commentBody Comment body text
 * @returns True if this is a CostPane comment
 */
export function isCostPaneComment(commentBody: string): boolean {
  return commentBody.includes(COMMENT_MARKER);
}
