/**
 * Detect AI model references in code
 */

import type { DiffLine, DetectedModel, Provider } from '../types.js';
import { getCostForTokens } from '../pricing/registry.js';

/**
 * Default token counts for cost estimation
 * Based on typical usage patterns
 */
const DEFAULT_PROMPT_TOKENS = 500;
const DEFAULT_COMPLETION_TOKENS = 200;
const DEFAULT_CALLS_PER_DAY = 1000;
const DAYS_PER_MONTH = 30;

/**
 * Model detection patterns for different providers and languages
 */

// OpenAI patterns
const OPENAI_MODEL_PATTERNS = [
  // TypeScript/JavaScript: model: "gpt-4o"
  /model:\s*["']([^"']+)["']/,
  // TypeScript/JavaScript: model = "gpt-4o"
  /model\s*=\s*["']([^"']+)["']/,
  // Python: model="gpt-4o"
  /model\s*=\s*["']([^"']+)["']/,
  // Template literals: model: `gpt-4o`
  /model:\s*`([^`]+)`/,
  // Variable assignment with backticks: const model = `gpt-4o`
  /=\s*`([^`]+)`/,
];

// Anthropic patterns
const ANTHROPIC_MODEL_PATTERNS = [
  ...OPENAI_MODEL_PATTERNS, // Same patterns work for Anthropic
];

// Google patterns
const GOOGLE_MODEL_PATTERNS = [
  // getGenerativeModel({ model: "gemini-2.5-pro" })
  /getGenerativeModel\s*\(\s*{\s*model:\s*["']([^"']+)["']/,
  // model: "gemini-..."
  ...OPENAI_MODEL_PATTERNS,
];

// Bedrock patterns
const BEDROCK_MODEL_PATTERNS = [
  // modelId: "anthropic.claude"
  /modelId:\s*["']([^"']+)["']/,
  // modelId = "anthropic.claude"
  /modelId\s*=\s*["']([^"']+)["']/,
];

// Azure OpenAI patterns
const AZURE_MODEL_PATTERNS = [
  // deployment_name: "..."
  /deployment_name:\s*["']([^"']+)["']/,
  // deploymentName: "..."
  /deploymentName:\s*["']([^"']+)["']/,
];

/**
 * Provider client instantiation patterns
 */
const CLIENT_PATTERNS: Array<{ pattern: RegExp; provider: Provider }> = [
  { pattern: /new\s+OpenAI\s*\(/, provider: 'openai' },
  { pattern: /new\s+Anthropic\s*\(/, provider: 'anthropic' },
  { pattern: /new\s+GoogleGenerativeAI\s*\(/, provider: 'google' },
  { pattern: /new\s+AzureOpenAI\s*\(/, provider: 'azure-openai' },
  { pattern: /InvokeModelCommand/, provider: 'bedrock' },
  { pattern: /messages\.create\s*\(/, provider: 'anthropic' },
];

/**
 * Known model name patterns for each provider
 */
const KNOWN_MODEL_PATTERNS: Record<string, RegExp> = {
  openai: /^(gpt-|o\d+|o\d+-mini)/,
  anthropic: /^claude-/,
  google: /^gemini-/,
  bedrock: /^(anthropic\.|amazon\.|meta\.|cohere\.)/,
  'azure-openai': /.+/, // Azure uses deployment names, harder to validate
};

/**
 * Detect the provider from a model name.
 * 
 * @param model Model identifier
 * @returns Detected provider or 'unknown'
 */
function detectProvider(model: string): Provider {
  for (const [provider, pattern] of Object.entries(KNOWN_MODEL_PATTERNS)) {
    if (pattern.test(model)) {
      return provider as Provider;
    }
  }
  return 'unknown';
}

/**
 * Check if a line is a comment or string literal (not an API call).
 * 
 * @param line Line content
 * @returns True if the line should be ignored
 */
function isCommentOrLiteral(line: string): boolean {
  const trimmed = line.trim();
  
  // Comments
  if (
    trimmed.startsWith('//') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('*') ||
    trimmed.includes('/*')
  ) {
    return true;
  }
  
  // String literals that are clearly not API calls
  // (e.g., blog post content, documentation)
  if (
    !trimmed.includes('model') &&
    !trimmed.includes('modelId') &&
    !trimmed.includes('deployment')
  ) {
    return true;
  }
  
  return false;
}

/**
 * Extract model names from a line of code.
 * 
 * @param line Line content
 * @param provider Detected provider for this line
 * @returns Array of detected model names
 */
function extractModels(line: string, provider: Provider): string[] {
  if (isCommentOrLiteral(line)) {
    return [];
  }
  
  const models: string[] = [];
  let patterns: RegExp[];
  
  switch (provider) {
    case 'openai':
      patterns = OPENAI_MODEL_PATTERNS;
      break;
    case 'anthropic':
      patterns = ANTHROPIC_MODEL_PATTERNS;
      break;
    case 'google':
      patterns = GOOGLE_MODEL_PATTERNS;
      break;
    case 'bedrock':
      patterns = BEDROCK_MODEL_PATTERNS;
      break;
    case 'azure-openai':
      patterns = AZURE_MODEL_PATTERNS;
      break;
    default:
      patterns = OPENAI_MODEL_PATTERNS; // Default to OpenAI patterns
  }
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match && match[1]) {
      models.push(match[1]);
    }
  }
  
  return models;
}

/**
 * Detect provider from a line of code based on client instantiation patterns.
 * 
 * @param line Line content
 * @returns Detected provider or undefined
 */
function detectProviderFromLine(line: string): Provider | undefined {
  for (const { pattern, provider } of CLIENT_PATTERNS) {
    if (pattern.test(line)) {
      return provider;
    }
  }
  return undefined;
}

/**
 * Calculate estimated cost for a detected model.
 * 
 * @param provider Provider name
 * @param model Model identifier
 * @returns Object with per-call and monthly costs, or undefined if unpriced
 */
function calculateCost(
  provider: string,
  model: string,
): { costPerCall: number; monthlyCost: number } | undefined {
  const cost = getCostForTokens(
    provider,
    model,
    DEFAULT_PROMPT_TOKENS,
    DEFAULT_COMPLETION_TOKENS,
  );
  
  if (cost === undefined) {
    return undefined;
  }
  
  return {
    costPerCall: cost,
    monthlyCost: cost * DEFAULT_CALLS_PER_DAY * DAYS_PER_MONTH,
  };
}

/**
 * Detect AI models in diff lines.
 * 
 * Scans added lines for:
 * - OpenAI model references (gpt-4o, o3-mini, etc.)
 * - Anthropic model references (claude-sonnet-4-5, etc.)
 * - Google model references (gemini-2.5-pro, etc.)
 * - Bedrock model IDs (anthropic.claude, amazon.titan, etc.)
 * - Azure OpenAI deployment names
 * 
 * Returns an array of detected models with estimated costs.
 * 
 * @param lines Array of diff lines to scan
 * @returns Array of detected models
 * 
 * @example
 * ```typescript
 * const detected = detectModels(addedLines);
 * console.log(`Found ${detected.length} AI models`);
 * for (const model of detected) {
 *   console.log(`${model.file}: ${model.provider}/${model.model} - $${model.monthlyCost}/mo`);
 * }
 * ```
 */
export function detectModels(lines: DiffLine[]): DetectedModel[] {
  const detected: DetectedModel[] = [];
  const seenModels = new Set<string>(); // Deduplicate: "file::model"
  
  for (const line of lines) {
    // Try to detect provider from the line itself
    const providerFromLine = detectProviderFromLine(line.content);
    
    // Try all providers if we couldn't detect one
    const providersToTry: Provider[] = providerFromLine
      ? [providerFromLine]
      : ['openai', 'anthropic', 'google', 'bedrock', 'azure-openai'];
    
    for (const provider of providersToTry) {
      const models = extractModels(line.content, provider);
      
      for (const model of models) {
        const key = `${line.file}::${model}`;
        
        // Skip if we've already seen this model in this file
        if (seenModels.has(key)) {
          continue;
        }
        
        seenModels.add(key);
        
        // Detect provider from model name if not explicitly detected
        const finalProvider = providerFromLine || detectProvider(model);
        
        // Calculate costs
        const costs = calculateCost(finalProvider, model);
        
        detected.push({
          file: line.file,
          line: line.lineNumber,
          provider: finalProvider,
          model,
          costPerCall: costs?.costPerCall,
          monthlyCost: costs?.monthlyCost,
          isNew: true, // All detected models in diff are new
        });
      }
    }
  }
  
  return detected;
}

/**
 * Detect new provider dependencies in package.json changes.
 * 
 * @param lines Array of diff lines to scan
 * @returns Array of newly added providers
 * 
 * @example
 * ```typescript
 * const newProviders = detectNewProviders(addedLines);
 * if (newProviders.includes('anthropic')) {
 *   console.log('Anthropic SDK added to dependencies');
 * }
 * ```
 */
export function detectNewProviders(lines: DiffLine[]): Provider[] {
  const providers: Provider[] = [];
  const packageJsonLines = lines.filter((line) =>
    line.file.endsWith('package.json'),
  );
  
  const providerPatterns: Array<{ pattern: RegExp; provider: Provider }> = [
    { pattern: /"openai"/, provider: 'openai' },
    { pattern: /"@anthropic-ai\/sdk"/, provider: 'anthropic' },
    { pattern: /"@google\/generative-ai"/, provider: 'google' },
    { pattern: /"@aws-sdk\/client-bedrock-runtime"/, provider: 'bedrock' },
    { pattern: /"@azure\/openai"/, provider: 'azure-openai' },
  ];
  
  for (const line of packageJsonLines) {
    for (const { pattern, provider } of providerPatterns) {
      if (pattern.test(line.content) && !providers.includes(provider)) {
        providers.push(provider);
      }
    }
  }
  
  return providers;
}

/**
 * Group detected models by file.
 * 
 * @param models Array of detected models
 * @returns Map of file path to models
 */
export function groupModelsByFile(
  models: DetectedModel[],
): Map<string, DetectedModel[]> {
  const grouped = new Map<string, DetectedModel[]>();
  
  for (const model of models) {
    const existing = grouped.get(model.file) || [];
    existing.push(model);
    grouped.set(model.file, existing);
  }
  
  return grouped;
}
