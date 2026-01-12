#!/usr/bin/env ts-node
import { readFileSync } from 'fs';

function fixJsonWithEmbeddedNewlines(content: string): string {
  const result: string[] = [];
  let inString = false;
  let i = 0;

  while (i < content.length) {
    const char = content[i];
    const charCode = char.charCodeAt(0);

    // Handle backslash (escape sequences)
    if (char === '\\') {
      if (inString && i + 1 < content.length) {
        const nextChar = content[i + 1];
        const validEscapes = new Set([
          'n',
          'r',
          't',
          '"',
          '\\',
          '/',
          'u',
          'b',
          'f',
        ]);

        if (validEscapes.has(nextChar)) {
          result.push('\\', nextChar);
          i += 2;
          continue;
        } else {
          result.push('\\\\');
          i++;
          continue;
        }
      } else {
        result.push('\\');
        i++;
        continue;
      }
    }

    // Handle quote (string delimiter)
    if (char === '"') {
      inString = !inString;
      result.push('"');
      i++;
      continue;
    }

    // Handle control characters inside strings
    if (inString && charCode < 32) {
      if (char === '\n') {
        result.push('\\n');
      } else if (char === '\r') {
        result.push('\\r');
      } else if (char === '\t') {
        result.push('\\t');
      } else {
        result.push(' ');
      }
      i++;
      continue;
    }

    result.push(char);
    i++;
  }

  return result.join('');
}

const csvFileName = process.argv[2];
if (!csvFileName) {
  console.error('Usage: npx tsx debug-json-error.ts <file>');
  process.exit(1);
}

const content = readFileSync(csvFileName, 'utf-8');
console.log('Original file size:', content.length);

const fixedContent = fixJsonWithEmbeddedNewlines(content);
console.log('Fixed content size:', fixedContent.length);

// Check around position 26680
const errorPos = 26680;
const contextSize = 200;

console.log('\n=== ORIGINAL CONTENT around position', errorPos, '===');
const origStart = Math.max(0, errorPos - contextSize);
const origEnd = Math.min(content.length, errorPos + contextSize);
const origSnippet = content.substring(origStart, origEnd);
console.log(origSnippet);
console.log('\nChar at position:', JSON.stringify(content[errorPos]), 'charCode:', content.charCodeAt(errorPos));

console.log('\n=== FIXED CONTENT around position', errorPos, '===');
const fixedStart = Math.max(0, errorPos - contextSize);
const fixedEnd = Math.min(fixedContent.length, errorPos + contextSize);
const fixedSnippet = fixedContent.substring(fixedStart, fixedEnd);
console.log(fixedSnippet);
console.log('\nChar at position:', JSON.stringify(fixedContent[errorPos]), 'charCode:', fixedContent.charCodeAt(errorPos));

// Try to parse and show error
try {
  JSON.parse(fixedContent);
  console.log('\n✓ JSON parsed successfully!');
} catch (err: any) {
  console.log('\n✗ JSON parse error:', err.message);
}
