/**
 * Tests for diff parser
 */

import { describe, it, expect } from 'vitest';
import {
  parseDiff,
  getAddedLines,
  isDiffEmpty,
  getFilesByPattern,
} from '../src/parsers/diff-parser.js';

describe('diff-parser', () => {
  it('parses standard unified diff', () => {
    const diff = `diff --git a/src/app.ts b/src/app.ts
index 1234567..abcdefg 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -10,3 +10,5 @@ import OpenAI from 'openai';
 const client = new OpenAI();
+
+const model = 'gpt-4o';
+console.log('Using model:', model);`;
    
    const parsed = parseDiff(diff);
    
    expect(parsed.files).toContain('src/app.ts');
    expect(parsed.lines.length).toBeGreaterThan(0);
    
    const addedLines = parsed.lines.filter((l) => l.isAddition);
    expect(addedLines.length).toBe(3); // Empty line + 2 code lines
  });
  
  it('extracts only added lines', () => {
    const diff = `diff --git a/src/app.ts b/src/app.ts
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,5 +1,5 @@
 const oldCode = 'old';
-const removed = 'removed';
+const added = 'added';
 const unchanged = 'same';`;
    
    const parsed = parseDiff(diff);
    const addedLines = getAddedLines(parsed);
    
    expect(addedLines).toHaveLength(1);
    expect(addedLines[0].content).toBe("const added = 'added';");
  });
  
  it('tracks file paths correctly', () => {
    const diff = `diff --git a/src/file1.ts b/src/file1.ts
--- a/src/file1.ts
+++ b/src/file1.ts
@@ -1 +1,2 @@
+console.log('file1');
diff --git a/src/file2.ts b/src/file2.ts
--- a/src/file2.ts
+++ b/src/file2.ts
@@ -1 +1,2 @@
+console.log('file2');`;
    
    const parsed = parseDiff(diff);
    
    expect(parsed.files).toHaveLength(2);
    expect(parsed.files).toContain('src/file1.ts');
    expect(parsed.files).toContain('src/file2.ts');
    
    const file1Lines = parsed.lines.filter((l) => l.file === 'src/file1.ts');
    const file2Lines = parsed.lines.filter((l) => l.file === 'src/file2.ts');
    
    expect(file1Lines).toHaveLength(1);
    expect(file2Lines).toHaveLength(1);
  });
  
  it('ignores removed lines', () => {
    const diff = `diff --git a/src/app.ts b/src/app.ts
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,3 +1,2 @@
-const removed1 = 'old';
-const removed2 = 'old';
 const kept = 'same';`;
    
    const parsed = parseDiff(diff);
    const addedLines = getAddedLines(parsed);
    
    expect(addedLines).toHaveLength(0);
  });
  
  it('ignores node_modules paths', () => {
    const diff = `diff --git a/node_modules/package/index.js b/node_modules/package/index.js
--- a/node_modules/package/index.js
+++ b/node_modules/package/index.js
@@ -1 +1,2 @@
+const added = 'should be ignored';`;
    
    const parsed = parseDiff(diff);
    
    expect(parsed.files).toHaveLength(0);
    expect(parsed.lines).toHaveLength(0);
  });
  
  it('handles binary files gracefully', () => {
    const diff = `diff --git a/image.png b/image.png
Binary files a/image.png and b/image.png differ`;
    
    const parsed = parseDiff(diff);
    
    // Binary files don't produce line-based diffs
    expect(parsed.files).toHaveLength(0);
  });
  
  it('handles empty diffs', () => {
    const diff = '';
    
    const parsed = parseDiff(diff);
    
    expect(isDiffEmpty(parsed)).toBe(true);
    expect(parsed.files).toHaveLength(0);
    expect(parsed.lines).toHaveLength(0);
  });
  
  it('handles renamed files', () => {
    const diff = `diff --git a/old-name.ts b/new-name.ts
similarity index 100%
rename from old-name.ts
rename to new-name.ts
--- a/old-name.ts
+++ b/new-name.ts
@@ -1 +1,2 @@
 const code = 'same';
+const added = 'new';`;
    
    const parsed = parseDiff(diff);
    
    // Should track the new file name
    expect(parsed.files).toContain('new-name.ts');
    expect(parsed.lines).toHaveLength(1);
  });
  
  describe('getFilesByPattern', () => {
    it('finds files matching pattern', () => {
      const diff = `diff --git a/package.json b/package.json
--- a/package.json
+++ b/package.json
@@ -1 +1,2 @@
+  "openai": "^4.0.0"
diff --git a/src/app.ts b/src/app.ts
--- a/src/app.ts
+++ b/src/app.ts
@@ -1 +1,2 @@
+const x = 1;`;
      
      const parsed = parseDiff(diff);
      const packageJsons = getFilesByPattern(parsed, /package\.json$/);
      
      expect(packageJsons).toHaveLength(1);
      expect(packageJsons[0]).toBe('package.json');
    });
  });
  
  describe('getAddedLines with extension filter', () => {
    it('filters by extension', () => {
      const diff = `diff --git a/src/app.ts b/src/app.ts
--- a/src/app.ts
+++ b/src/app.ts
@@ -1 +1,2 @@
+const ts = 'typescript';
diff --git a/src/app.py b/src/app.py
--- a/src/app.py
+++ b/src/app.py
@@ -1 +1,2 @@
+py = 'python'`;
      
      const parsed = parseDiff(diff);
      const tsLines = getAddedLines(parsed, ['.ts']);
      const pyLines = getAddedLines(parsed, ['.py']);
      
      expect(tsLines).toHaveLength(1);
      expect(tsLines[0].file).toBe('src/app.ts');
      
      expect(pyLines).toHaveLength(1);
      expect(pyLines[0].file).toBe('src/app.py');
    });
  });
});
