/**
 * Types for the CostPane GitHub Action
 */

/** Operating mode for the action */
export type ActionMode = 'budget' | 'analysis' | 'both';

/** Budget status after checking thresholds */
export type BudgetStatus = 'ok' | 'warning' | 'exceeded';

/** AI provider identifier */
export type Provider = 'openai' | 'anthropic' | 'google' | 'bedrock' | 'azure-openai' | 'unknown';

/** Detected model in a file */
export interface DetectedModel {
  /** File path where the model was detected */
  file: string;
  /** Line number in the file */
  line: number;
  /** AI provider */
  provider: Provider;
  /** Model identifier */
  model: string;
  /** Estimated cost per call in USD (undefined if unpriced) */
  costPerCall?: number;
  /** Estimated monthly cost in USD (undefined if unpriced) */
  monthlyCost?: number;
  /** Whether this is a new model added in this PR */
  isNew: boolean;
}

/** Diff line with metadata */
export interface DiffLine {
  /** File path */
  file: string;
  /** Line number in the new file */
  lineNumber: number;
  /** Line content (without + prefix) */
  content: string;
  /** Whether this is an added line */
  isAddition: boolean;
}

/** Parsed diff result */
export interface ParsedDiff {
  /** All lines from the diff */
  lines: DiffLine[];
  /** Files changed */
  files: string[];
}

/** Model upgrade detection */
export interface ModelUpgrade {
  /** File where upgrade was detected */
  file: string;
  /** Old model identifier */
  from: string;
  /** New model identifier */
  to: string;
  /** Cost multiplier (e.g., 17 = 17x more expensive) */
  costMultiplier: number;
  /** Old cost per call in USD */
  oldCostPerCall?: number;
  /** New cost per call in USD */
  newCostPerCall?: number;
}

/** Budget gate result from API */
export interface BudgetGateResult {
  /** Current spend in USD */
  currentSpend: number;
  /** Budget limit in USD */
  limit: number;
  /** Percentage of budget used (0-100) */
  percentage: number;
  /** Budget status */
  status: BudgetStatus;
  /** Error message if API call failed */
  error?: string;
}

/** Static analysis result */
export interface StaticAnalysisResult {
  /** All detected models */
  models: DetectedModel[];
  /** Detected model upgrades */
  upgrades: ModelUpgrade[];
  /** New provider dependencies added */
  newProviders: Provider[];
  /** Total estimated monthly cost impact in USD */
  totalMonthlyCost: number;
  /** Total estimated cost per call in USD */
  totalCostPerCall: number;
}

/** Action configuration parsed from inputs */
export interface ActionConfig {
  mode: ActionMode;
  costpaneApiKey?: string;
  costpaneUrl: string;
  warnThreshold: number;
  blockThreshold: number;
  githubToken: string;
  modelCostThreshold: number;
  failOnError: boolean;
}

/** Final action result */
export interface ActionResult {
  /** Budget gate result (if budget mode enabled) */
  budgetGate?: BudgetGateResult;
  /** Static analysis result (if analysis mode enabled) */
  staticAnalysis?: StaticAnalysisResult;
  /** Whether the action should fail (block PR) */
  shouldFail: boolean;
  /** Error messages (if any) */
  errors: string[];
}
