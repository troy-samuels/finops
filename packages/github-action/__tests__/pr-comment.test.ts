/**
 * Tests for PR comment generation
 */

import { describe, it, expect } from 'vitest';
import {
  generatePRComment,
  generateErrorComment,
  isCostPaneComment,
  COMMENT_MARKER,
} from '../src/reporters/pr-comment.js';
import type { StaticAnalysisResult, BudgetGateResult } from '../src/types.js';

describe('pr-comment', () => {
  it('generates correct markdown for models detected', () => {
    const analysis: StaticAnalysisResult = {
      models: [
        {
          file: 'src/chat.ts',
          line: 10,
          provider: 'openai',
          model: 'gpt-4o',
          costPerCall: 0.0035,
          monthlyCost: 105,
          isNew: true,
        },
        {
          file: 'src/search.ts',
          line: 20,
          provider: 'anthropic',
          model: 'claude-sonnet-4-5',
          costPerCall: 0.0054,
          monthlyCost: 162,
          isNew: true,
        },
      ],
      upgrades: [],
      newProviders: [],
      totalMonthlyCost: 267,
      totalCostPerCall: 0.0089,
    };
    
    const comment = generatePRComment(analysis);
    
    expect(comment).toContain('## 🔍 CostPane AI Cost Analysis');
    expect(comment).toContain('src/chat.ts');
    expect(comment).toContain('gpt-4o');
    expect(comment).toContain('OpenAI');
    expect(comment).toContain('$0.0035');
    expect(comment).toContain('~$105.00/mo');
    expect(comment).toContain('claude-sonnet-4-5');
    expect(comment).toContain('Anthropic');
    expect(comment).toContain('+$267.00/month');
  });
  
  it('generates correct budget progress bar', () => {
    const budget: BudgetGateResult = {
      currentSpend: 4200,
      limit: 5000,
      percentage: 84,
      status: 'warning',
    };
    
    const comment = generatePRComment(undefined, budget);
    
    expect(comment).toContain('$4,200.00 / $5,000.00 monthly budget');
    expect(comment).toContain('84.0%');
    expect(comment).toContain('█'); // Progress bar character
    expect(comment).toContain('░'); // Empty bar character
  });
  
  it('handles no models detected', () => {
    const comment = generatePRComment();
    
    expect(comment).toContain('No AI Models Detected');
    expect(comment).toContain('Great job keeping costs in check!');
  });
  
  it('handles model upgrade detection', () => {
    const analysis: StaticAnalysisResult = {
      models: [],
      upgrades: [
        {
          file: 'src/chat.ts',
          from: 'gpt-4o-mini',
          to: 'gpt-4o',
          costMultiplier: 17,
          oldCostPerCall: 0.0002,
          newCostPerCall: 0.0034,
        },
      ],
      newProviders: [],
      totalMonthlyCost: 0,
      totalCostPerCall: 0,
    };
    
    const comment = generatePRComment(analysis);
    
    expect(comment).toContain('⚠️ Cost Alerts');
    expect(comment).toContain('Model upgrade detected');
    expect(comment).toContain('gpt-4o-mini');
    expect(comment).toContain('gpt-4o');
    expect(comment).toContain('+17x cost increase');
  });
  
  it('includes hidden marker comment', () => {
    const comment = generatePRComment();
    
    expect(comment).toContain(COMMENT_MARKER);
    expect(isCostPaneComment(comment)).toBe(true);
  });
  
  it('handles multiple files', () => {
    const analysis: StaticAnalysisResult = {
      models: [
        {
          file: 'src/file1.ts',
          line: 1,
          provider: 'openai',
          model: 'gpt-4o',
          costPerCall: 0.0035,
          monthlyCost: 105,
          isNew: true,
        },
        {
          file: 'src/file2.ts',
          line: 1,
          provider: 'openai',
          model: 'gpt-4o-mini',
          costPerCall: 0.0002,
          monthlyCost: 6,
          isNew: true,
        },
      ],
      upgrades: [],
      newProviders: [],
      totalMonthlyCost: 111,
      totalCostPerCall: 0.0037,
    };
    
    const comment = generatePRComment(analysis);
    
    expect(comment).toContain('src/file1.ts');
    expect(comment).toContain('src/file2.ts');
  });
  
  it('handles unpriced models', () => {
    const analysis: StaticAnalysisResult = {
      models: [
        {
          file: 'src/app.ts',
          line: 1,
          provider: 'unknown',
          model: 'fake-model-2000',
          isNew: true,
        },
      ],
      upgrades: [],
      newProviders: [],
      totalMonthlyCost: 0,
      totalCostPerCall: 0,
    };
    
    const comment = generatePRComment(analysis);
    
    expect(comment).toContain('fake-model-2000');
    expect(comment).toContain('*unpriced*');
  });
  
  it('generates correct cost calculations', () => {
    const analysis: StaticAnalysisResult = {
      models: [
        {
          file: 'src/app.ts',
          line: 1,
          provider: 'openai',
          model: 'gpt-4o',
          costPerCall: 0.0035,
          monthlyCost: 105,
          isNew: true,
        },
      ],
      upgrades: [],
      newProviders: [],
      totalMonthlyCost: 105,
      totalCostPerCall: 0.0035,
    };
    
    const comment = generatePRComment(analysis);
    
    expect(comment).toContain('+$105.00/month');
    expect(comment).toContain('1,000 calls/day');
  });
  
  it('handles new provider detection', () => {
    const analysis: StaticAnalysisResult = {
      models: [],
      upgrades: [],
      newProviders: ['anthropic', 'google'],
      totalMonthlyCost: 0,
      totalCostPerCall: 0,
    };
    
    const comment = generatePRComment(analysis);
    
    expect(comment).toContain('New provider added');
    expect(comment).toContain('Anthropic');
    expect(comment).toContain('Google');
  });
  
  describe('generateErrorComment', () => {
    it('generates error comment with messages', () => {
      const errors = ['Failed to fetch diff', 'API timeout'];
      const comment = generateErrorComment(errors);
      
      expect(comment).toContain('Analysis Failed');
      expect(comment).toContain('Failed to fetch diff');
      expect(comment).toContain('API timeout');
      expect(isCostPaneComment(comment)).toBe(true);
    });
  });
  
  describe('isCostPaneComment', () => {
    it('identifies CostPane comments', () => {
      const costpaneComment = COMMENT_MARKER + '\n## CostPane Analysis';
      const regularComment = 'Just a regular comment';
      
      expect(isCostPaneComment(costpaneComment)).toBe(true);
      expect(isCostPaneComment(regularComment)).toBe(false);
    });
  });
});
