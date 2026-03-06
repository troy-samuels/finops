/**
 * Budget gate mode - check budget against CostPane API
 */

import type { BudgetGateResult, BudgetStatus } from '../types.js';

/**
 * API response from budget status endpoint
 */
interface BudgetStatusResponse {
  success: boolean;
  currentSpend: number;
  limit: number;
  percentage: number;
}

/**
 * Cache for API responses (5 minute TTL)
 */
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cachedResponse: BudgetGateResult | null = null;
let cacheTimestamp = 0;

/**
 * Check if cached response is still valid.
 * 
 * @returns True if cache is valid
 */
function isCacheValid(): boolean {
  return (
    cachedResponse !== null &&
    Date.now() - cacheTimestamp < CACHE_TTL_MS
  );
}

/**
 * Determine budget status based on percentage and thresholds.
 * 
 * @param percentage Budget usage percentage (0-100)
 * @param warnThreshold Warning threshold percentage
 * @param blockThreshold Block threshold percentage
 * @returns Budget status
 */
function determineBudgetStatus(
  percentage: number,
  warnThreshold: number,
  blockThreshold: number,
): BudgetStatus {
  if (blockThreshold > 0 && percentage >= blockThreshold) {
    return 'exceeded';
  }
  if (percentage >= warnThreshold) {
    return 'warning';
  }
  return 'ok';
}

/**
 * Fetch budget status from CostPane API.
 * 
 * @param apiKey CostPane API key
 * @param baseUrl CostPane API base URL
 * @returns Budget status response or null on error
 */
async function fetchBudgetStatus(
  apiKey: string,
  baseUrl: string,
): Promise<BudgetStatusResponse | null> {
  try {
    const url = `${baseUrl}/api/v1/budget/status`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      // Timeout after 10 seconds
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      console.error(
        `Budget API returned ${response.status}: ${response.statusText}`,
      );
      return null;
    }
    
    const data = (await response.json()) as {
      success?: boolean;
      currentSpend?: unknown;
      limit?: unknown;
      percentage?: unknown;
    };
    
    // Validate response structure
    if (
      typeof data.currentSpend !== 'number' ||
      typeof data.limit !== 'number'
    ) {
      console.error('Invalid budget API response structure');
      return null;
    }
    
    return data as BudgetStatusResponse;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Budget API error: ${error.message}`);
    } else {
      console.error('Budget API error:', error);
    }
    return null;
  }
}

/**
 * Run budget gate check.
 * 
 * Fetches current spend from CostPane API and compares against thresholds.
 * 
 * **Fail-open policy:** If the API is unreachable or returns an error, the gate
 * returns a warning status but doesn't block. This prevents CI failures due to
 * temporary API issues.
 * 
 * Results are cached for 5 minutes to avoid hammering the API on multiple pushes.
 * 
 * @param apiKey CostPane API key
 * @param apiUrl CostPane API base URL
 * @param warnThreshold Warning threshold percentage (0-100)
 * @param blockThreshold Block threshold percentage (0-100, 0 = never block)
 * @returns Budget gate result
 * 
 * @example
 * ```typescript
 * const result = await runBudgetGate(apiKey, apiUrl, 80, 100);
 * if (result.status === 'exceeded') {
 *   console.error('Budget exceeded! Blocking PR.');
 *   process.exit(1);
 * }
 * ```
 */
export async function runBudgetGate(
  apiKey: string,
  apiUrl: string,
  warnThreshold: number,
  blockThreshold: number,
): Promise<BudgetGateResult> {
  try {
    // Return cached result if valid
    if (isCacheValid() && cachedResponse) {
      console.log('Using cached budget status');
      return cachedResponse;
    }
    
    // Fetch from API
    const response = await fetchBudgetStatus(apiKey, apiUrl);
    
    if (!response) {
      // Fail-open: API error, return warning but don't block
      const result: BudgetGateResult = {
        currentSpend: 0,
        limit: 0,
        percentage: 0,
        status: 'warning',
        error: 'Failed to fetch budget status from API',
      };
      return result;
    }
    
    // Calculate percentage if not provided
    const percentage =
      response.percentage ||
      (response.limit > 0 ? (response.currentSpend / response.limit) * 100 : 0);
    
    // Determine status
    const status = determineBudgetStatus(
      percentage,
      warnThreshold,
      blockThreshold,
    );
    
    const result: BudgetGateResult = {
      currentSpend: response.currentSpend,
      limit: response.limit,
      percentage,
      status,
    };
    
    // Cache the result
    cachedResponse = result;
    cacheTimestamp = Date.now();
    
    return result;
  } catch (error) {
    // Fail-open: unexpected error, return warning but don't block
    console.error('Unexpected error in budget gate:', error);
    return {
      currentSpend: 0,
      limit: 0,
      percentage: 0,
      status: 'warning',
      error:
        error instanceof Error
          ? error.message
          : 'Unexpected error in budget gate',
    };
  }
}

/**
 * Clear the budget cache.
 * Useful for testing.
 */
export function clearBudgetCache(): void {
  cachedResponse = null;
  cacheTimestamp = 0;
}

/**
 * Format currency amount as USD.
 * 
 * @param amount Amount in USD
 * @returns Formatted string (e.g., "$1,234.56")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage with one decimal place.
 * 
 * @param percentage Percentage (0-100)
 * @returns Formatted string (e.g., "84.2%")
 */
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}
