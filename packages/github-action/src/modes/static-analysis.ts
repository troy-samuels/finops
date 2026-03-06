/**
 * Static cost analysis mode - analyse PR diff for AI model usage
 */

import type {
  StaticAnalysisResult,
  ModelUpgrade,
  DetectedModel,
} from '../types.js';
import type { ParsedDiff } from '../types.js';
import { detectModels, detectNewProviders } from '../parsers/model-detector.js';
import { getAddedLines } from '../parsers/diff-parser.js';

/**
 * Detect model upgrades by comparing models in the diff.
 * 
 * This is a simplified heuristic - in a real implementation, you'd want to:
 * - Parse the full file before and after
 * - Track variable assignments
 * - Handle more complex scenarios
 * 
 * For now, we detect when the same file mentions multiple models of the same provider
 * and one is significantly more expensive.
 * 
 * @param models Detected models
 * @param costThreshold Cost multiplier threshold to flag (e.g., 3 = 3x more expensive)
 * @returns Array of detected upgrades
 */
function detectModelUpgrades(
  models: DetectedModel[],
  costThreshold: number,
): ModelUpgrade[] {
  const upgrades: ModelUpgrade[] = [];
  
  // Group by file
  const byFile = new Map<string, DetectedModel[]>();
  for (const model of models) {
    const existing = byFile.get(model.file) || [];
    existing.push(model);
    byFile.set(model.file, existing);
  }
  
  // Check each file for upgrades
  for (const [file, fileModels] of byFile.entries()) {
    // Group by provider within this file
    const byProvider = new Map<string, DetectedModel[]>();
    for (const model of fileModels) {
      const existing = byProvider.get(model.provider) || [];
      existing.push(model);
      byProvider.set(model.provider, existing);
    }
    
    // Check each provider for cost increases
    for (const providerModels of byProvider.values()) {
      if (providerModels.length < 2) {
        continue;
      }
      
      // Sort by cost (ascending)
      const sorted = providerModels
        .filter((m) => m.costPerCall !== undefined)
        .sort((a, b) => (a.costPerCall || 0) - (b.costPerCall || 0));
      
      if (sorted.length < 2) {
        continue;
      }
      
      // Check if there's a significant cost increase
      const cheapest = sorted[0];
      const mostExpensive = sorted[sorted.length - 1];
      
      if (
        cheapest.costPerCall &&
        mostExpensive.costPerCall &&
        mostExpensive.costPerCall > cheapest.costPerCall
      ) {
        const multiplier = mostExpensive.costPerCall / cheapest.costPerCall;
        
        if (multiplier >= costThreshold) {
          upgrades.push({
            file,
            from: cheapest.model,
            to: mostExpensive.model,
            costMultiplier: Math.round(multiplier * 10) / 10,
            oldCostPerCall: cheapest.costPerCall,
            newCostPerCall: mostExpensive.costPerCall,
          });
        }
      }
    }
  }
  
  return upgrades;
}

/**
 * Run static analysis on a parsed diff.
 * 
 * Detects:
 * - AI models in code
 * - Model upgrades (cost increases)
 * - New provider dependencies
 * - Estimated cost impact
 * 
 * @param diff Parsed diff from git
 * @param costThreshold Cost multiplier threshold for upgrade detection
 * @returns Static analysis result
 * 
 * @example
 * ```typescript
 * const result = await runStaticAnalysis(parsedDiff, 3);
 * console.log(`Total monthly cost: $${result.totalMonthlyCost.toFixed(2)}`);
 * console.log(`Upgrades detected: ${result.upgrades.length}`);
 * ```
 */
export async function runStaticAnalysis(
  diff: ParsedDiff,
  costThreshold: number,
): Promise<StaticAnalysisResult> {
  try {
    // Get added lines (only code files)
    const codeExtensions = [
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.py',
      '.mjs',
      '.cjs',
    ];
    const addedLines = getAddedLines(diff, codeExtensions);
    
    // Detect models in the added lines
    const models = detectModels(addedLines);
    
    // Detect model upgrades
    const upgrades = detectModelUpgrades(models, costThreshold);
    
    // Detect new providers in package.json
    const newProviders = detectNewProviders(diff.lines);
    
    // Calculate total costs
    let totalMonthlyCost = 0;
    let totalCostPerCall = 0;
    
    for (const model of models) {
      if (model.monthlyCost !== undefined) {
        totalMonthlyCost += model.monthlyCost;
      }
      if (model.costPerCall !== undefined) {
        totalCostPerCall += model.costPerCall;
      }
    }
    
    return {
      models,
      upgrades,
      newProviders,
      totalMonthlyCost,
      totalCostPerCall,
    };
  } catch (error) {
    // Return empty result on error
    console.error('Error in static analysis:', error);
    return {
      models: [],
      upgrades: [],
      newProviders: [],
      totalMonthlyCost: 0,
      totalCostPerCall: 0,
    };
  }
}
