/**
 * Parse unified diff format from git
 */

import type { DiffLine, ParsedDiff } from '../types.js';

/**
 * Patterns to ignore (node_modules, lock files, minified files, test files)
 */
const IGNORE_PATTERNS = [
  /node_modules\//,
  /\.lock$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.min\.js$/,
  /\.min\.css$/,
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /__tests__\//,
  /__mocks__\//,
  /\.snap$/,
];

/**
 * Check if a file path should be ignored.
 * 
 * @param file File path
 * @returns True if the file should be ignored
 */
function shouldIgnoreFile(file: string): boolean {
  return IGNORE_PATTERNS.some((pattern) => pattern.test(file));
}

/**
 * Parse unified diff format from git diff output.
 * 
 * Extracts only ADDED lines (lines starting with +) from files that are not ignored.
 * 
 * @param diffText Unified diff text from git diff
 * @returns Parsed diff with lines and file metadata
 * 
 * @example
 * ```typescript
 * const diff = await exec('git diff origin/main...HEAD');
 * const parsed = parseDiff(diff);
 * console.log(`Changed ${parsed.files.length} files`);
 * console.log(`Added ${parsed.lines.filter(l => l.isAddition).length} lines`);
 * ```
 */
export function parseDiff(diffText: string): ParsedDiff {
  const lines: DiffLine[] = [];
  const filesSet = new Set<string>();
  
  let currentFile: string | null = null;
  let currentLineNumber = 0;
  
  const diffLines = diffText.split('\n');
  
  for (const line of diffLines) {
    // Check for file header: diff --git a/... b/...
    if (line.startsWith('diff --git')) {
      const match = line.match(/b\/(.+)$/);
      if (match) {
        currentFile = match[1];
      }
      continue;
    }
    
    // Check for +++ b/... (new file path)
    if (line.startsWith('+++')) {
      const match = line.match(/^\+\+\+ b\/(.+)$/);
      if (match) {
        currentFile = match[1];
      }
      continue;
    }
    
    // Check for hunk header: @@ -x,y +a,b @@
    if (line.startsWith('@@')) {
      const match = line.match(/\+(\d+)/);
      if (match) {
        currentLineNumber = parseInt(match[1], 10);
      }
      continue;
    }
    
    // Skip if we don't have a current file or should ignore it
    if (!currentFile || shouldIgnoreFile(currentFile)) {
      continue;
    }
    
    // Process content lines
    if (line.startsWith('+') && !line.startsWith('+++')) {
      // Added line
      filesSet.add(currentFile);
      lines.push({
        file: currentFile,
        lineNumber: currentLineNumber,
        content: line.slice(1), // Remove + prefix
        isAddition: true,
      });
      currentLineNumber++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      // Removed line (we track these but don't include in results)
      // Don't increment line number for removed lines
    } else if (!line.startsWith('\\')) {
      // Context line (no + or -)
      currentLineNumber++;
    }
  }
  
  return {
    lines,
    files: Array.from(filesSet).sort(),
  };
}

/**
 * Extract added lines from a diff, optionally filtered by file extension.
 * 
 * @param diff Parsed diff
 * @param extensions Optional array of file extensions to filter (e.g., ['.ts', '.js', '.py'])
 * @returns Array of added lines matching the filter
 * 
 * @example
 * ```typescript
 * const addedCodeLines = getAddedLines(parsed, ['.ts', '.js', '.tsx', '.jsx']);
 * ```
 */
export function getAddedLines(
  diff: ParsedDiff,
  extensions?: string[],
): DiffLine[] {
  let filtered = diff.lines.filter((line) => line.isAddition);
  
  if (extensions && extensions.length > 0) {
    filtered = filtered.filter((line) =>
      extensions.some((ext) => line.file.endsWith(ext)),
    );
  }
  
  return filtered;
}

/**
 * Check if a diff is empty (no files changed).
 * 
 * @param diff Parsed diff
 * @returns True if the diff is empty
 */
export function isDiffEmpty(diff: ParsedDiff): boolean {
  return diff.files.length === 0;
}

/**
 * Get files that match a specific pattern.
 * 
 * @param diff Parsed diff
 * @param pattern Regular expression pattern
 * @returns Array of matching file paths
 * 
 * @example
 * ```typescript
 * // Find package.json changes
 * const packageJsons = getFilesByPattern(parsed, /package\.json$/);
 * ```
 */
export function getFilesByPattern(
  diff: ParsedDiff,
  pattern: RegExp,
): string[] {
  return diff.files.filter((file) => pattern.test(file));
}
