/**
 * CostPane GitHub Action - Main Entry Point
 */

import * as core from '@actions/core';
import * as github from '@actions/github';
import type { ActionConfig, ActionResult } from './types.js';
import { parseDiff } from './parsers/diff-parser.js';
import { runStaticAnalysis } from './modes/static-analysis.js';
import { runBudgetGate } from './modes/budget-gate.js';
import {
  generatePRComment,
  generateErrorComment,
  isCostPaneComment,
} from './reporters/pr-comment.js';
import { execSync } from 'child_process';

/**
 * Parse action inputs into configuration.
 * 
 * @returns Parsed action configuration
 */
function parseInputs(): ActionConfig {
  const mode = core.getInput('mode') as 'budget' | 'analysis' | 'both';
  const costpaneApiKey = core.getInput('costpane-api-key');
  const costpaneUrl = core.getInput('costpane-url') || 'https://api.costpane.com';
  const warnThreshold = parseInt(core.getInput('warn-threshold') || '80', 10);
  const blockThreshold = parseInt(core.getInput('block-threshold') || '0', 10);
  const githubToken = core.getInput('github-token');
  const modelCostThreshold = parseFloat(
    core.getInput('model-cost-threshold') || '3',
  );
  const failOnError = core.getInput('fail-on-error') === 'true';
  
  return {
    mode,
    costpaneApiKey,
    costpaneUrl,
    warnThreshold,
    blockThreshold,
    githubToken,
    modelCostThreshold,
    failOnError,
  };
}

/**
 * Get the git diff for the PR.
 * 
 * @returns Diff text
 */
function getDiff(): string {
  try {
    // Get the base and head refs from the GitHub context
    const baseRef = github.context.payload.pull_request?.base?.ref || 'main';
    const headRef = github.context.payload.pull_request?.head?.ref || 'HEAD';
    
    core.info(`Fetching diff between ${baseRef} and ${headRef}`);
    
    // Fetch the base branch
    execSync(`git fetch origin ${baseRef}:${baseRef}`, {
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    
    // Get the diff
    const diff = execSync(`git diff origin/${baseRef}...${headRef}`, {
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    
    return diff;
  } catch (error) {
    core.warning('Failed to get diff via git, trying GitHub API');
    
    // Fallback: could implement GitHub API-based diff fetching here
    // For now, just throw
    throw new Error(
      `Failed to get diff: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Post or update a PR comment.
 * 
 * @param token GitHub token
 * @param comment Comment markdown
 */
async function postOrUpdateComment(
  token: string,
  comment: string,
): Promise<void> {
  try {
    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;
    const prNumber = github.context.payload.pull_request?.number;
    
    if (!prNumber) {
      core.warning('Not a pull request, skipping comment');
      return;
    }
    
    // Find existing CostPane comment
    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: prNumber,
    });
    
    const existingComment = comments.find((c) =>
      isCostPaneComment(c.body || ''),
    );
    
    if (existingComment) {
      // Update existing comment
      core.info(`Updating existing comment #${existingComment.id}`);
      await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: existingComment.id,
        body: comment,
      });
    } else {
      // Create new comment
      core.info('Creating new comment');
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: comment,
      });
    }
  } catch (error) {
    core.warning(
      `Failed to post/update comment: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Run the action.
 * 
 * @returns Action result
 */
async function runAction(): Promise<ActionResult> {
  const config = parseInputs();
  const errors: string[] = [];
  
  core.info(`Running in ${config.mode} mode`);
  
  // Validate inputs
  if (
    (config.mode === 'budget' || config.mode === 'both') &&
    !config.costpaneApiKey
  ) {
    errors.push('costpane-api-key is required for budget mode');
  }
  
  let result: ActionResult = {
    shouldFail: false,
    errors,
  };
  
  // Return early if validation failed
  if (errors.length > 0) {
    return result;
  }
  
  try {
    // Run static analysis if enabled
    if (config.mode === 'analysis' || config.mode === 'both') {
      core.info('Running static analysis...');
      
      const diffText = getDiff();
      const parsedDiff = parseDiff(diffText);
      
      core.info(`Parsed ${parsedDiff.files.length} changed files`);
      
      const analysis = await runStaticAnalysis(
        parsedDiff,
        config.modelCostThreshold,
      );
      
      core.info(`Detected ${analysis.models.length} AI models`);
      core.info(`Detected ${analysis.upgrades.length} model upgrades`);
      
      result.staticAnalysis = analysis;
      
      // Set outputs
      core.setOutput(
        'cost-impact',
        analysis.totalMonthlyCost.toFixed(2),
      );
      core.setOutput(
        'models-detected',
        JSON.stringify(analysis.models.map((m) => m.model)),
      );
    }
    
    // Run budget gate if enabled
    if (config.mode === 'budget' || config.mode === 'both') {
      core.info('Running budget gate...');
      
      const budget = await runBudgetGate(
        config.costpaneApiKey!,
        config.costpaneUrl,
        config.warnThreshold,
        config.blockThreshold,
      );
      
      core.info(
        `Budget status: ${budget.status} (${budget.percentage.toFixed(1)}%)`,
      );
      
      result.budgetGate = budget;
      
      // Set outputs
      core.setOutput('budget-status', budget.status);
      
      // Check if we should fail
      if (budget.status === 'exceeded' && config.blockThreshold > 0) {
        result.shouldFail = true;
        errors.push(
          `Budget exceeded: ${budget.currentSpend.toFixed(2)}/${budget.limit.toFixed(2)} (${budget.percentage.toFixed(1)}%)`,
        );
      }
    }
    
    // Generate and post PR comment
    const comment = generatePRComment(
      result.staticAnalysis,
      result.budgetGate,
    );
    
    await postOrUpdateComment(config.githubToken, comment);
    
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    core.error(`Action failed: ${errorMessage}`);
    errors.push(errorMessage);
    
    // Post error comment
    try {
      const errorComment = generateErrorComment(errors);
      await postOrUpdateComment(config.githubToken, errorComment);
    } catch (commentError) {
      core.warning('Failed to post error comment');
    }
    
    // Decide whether to fail based on config
    if (config.failOnError) {
      result.shouldFail = true;
    }
  }
  
  result.errors = errors;
  return result;
}

/**
 * Main entry point.
 */
async function main(): Promise<void> {
  try {
    const result = await runAction();
    
    // Log summary
    core.info('='.repeat(60));
    core.info('CostPane Analysis Complete');
    core.info('='.repeat(60));
    
    if (result.staticAnalysis) {
      core.info(`Models detected: ${result.staticAnalysis.models.length}`);
      core.info(
        `Estimated monthly cost: $${result.staticAnalysis.totalMonthlyCost.toFixed(2)}`,
      );
    }
    
    if (result.budgetGate) {
      core.info(
        `Budget: ${result.budgetGate.currentSpend.toFixed(2)}/${result.budgetGate.limit.toFixed(2)} (${result.budgetGate.percentage.toFixed(1)}%)`,
      );
    }
    
    if (result.errors.length > 0) {
      core.error('Errors encountered:');
      for (const error of result.errors) {
        core.error(`  - ${error}`);
      }
    }
    
    // Fail if needed
    if (result.shouldFail) {
      core.setFailed('CostPane gate failed');
    }
  } catch (error) {
    core.setFailed(
      `Action failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// Run the action
main().catch((error) => {
  core.setFailed(
    `Unhandled error: ${error instanceof Error ? error.message : String(error)}`,
  );
});
