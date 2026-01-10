#!/usr/bin/env ts-node
/**
 * Fix and format Airtable JSON response with embedded newlines
 * Converts to readable CSV format
 */
import { readFileSync, writeFileSync } from 'fs';

interface AirtableRecord {
  id: string;
  createdTime: string;
  fields: Record<string, any>;
}

interface AirtableResponse {
  records: AirtableRecord[];
}

function fixJsonWithEmbeddedNewlines(content: string): string {
  const result: string[] = [];
  let inString = false;

  // Valid JSON escape sequences
  const validEscapes = new Set(['n', 'r', 't', '"', '\\', '/', 'u', 'b', 'f']);

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === '\\') {
      // Check if we're inside a string
      if (inString) {
        // Look ahead to see what comes after the backslash
        const nextChar = i + 1 < content.length ? content[i + 1] : null;

        if (nextChar && validEscapes.has(nextChar)) {
          // Valid escape sequence - keep as is
          result.push(char);
        } else {
          // Invalid escape sequence - escape the backslash itself
          result.push('\\\\');
        }
      } else {
        // Outside string - keep as is
        result.push(char);
      }
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result.push(char);
      continue;
    }

    // If we're inside a string, escape control characters
    if (inString) {
      if (char === '\n') {
        result.push('\\n');
      } else if (char === '\r') {
        result.push('\\r');
      } else if (char === '\t') {
        result.push('\\t');
      } else if (char.charCodeAt(0) < 32) {
        // Other control characters - replace with space
        result.push(' ');
      } else {
        result.push(char);
      }
    } else {
      result.push(char);
    }
  }

  return result.join('');
}

function escapeCSVField(field: any): string {
  if (field === null || field === undefined) {
    return '';
  }

  let str = String(field);

  // Replace newlines with pipe separator for readability
  str = str.replace(/\n/g, ' | ');

  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }

  return str;
}

function main() {
  try {
    // Get CSV filename from command line arguments
    const csvFileName = process.argv[2];

    if (!csvFileName) {
      console.error('Error: Please provide a CSV file name as an argument');
      console.error('Usage: ts-node fix-and-format.ts <csv-file-name>');
      process.exit(1);
    }

    // Read the malformed JSON file
    const content = readFileSync(csvFileName, 'utf-8');

    // Fix embedded newlines in JSON strings
    const fixedContent = fixJsonWithEmbeddedNewlines(content);

    // Parse JSON
    const data: AirtableResponse = JSON.parse(fixedContent);
    const records = data.records;

    if (!records || records.length === 0) {
      console.error('No records found in the data');
      process.exit(1);
    }

    // Collect all unique field names across all records
    const allFieldsSet = new Set<string>();
    for (const record of records) {
      Object.keys(record.fields).forEach((key) => allFieldsSet.add(key));
    }

    // Create ordered field list: id, createdTime, then alphabetically sorted fields
    const allFields = ['id', 'createdTime', ...Array.from(allFieldsSet).sort()];

    // Build CSV content
    const csvRows: string[] = [];

    // Header row
    csvRows.push(allFields.map(escapeCSVField).join(','));

    // Data rows
    for (const record of records) {
      const row = allFields.map((field) => {
        if (field === 'id') return escapeCSVField(record.id);
        if (field === 'createdTime') return escapeCSVField(record.createdTime);
        return escapeCSVField(record.fields[field]);
      });
      csvRows.push(row.join(','));
    }

    // Generate output filename (add _readable before extension)
    const outputFileName = csvFileName.replace(/\.csv$/, '_readable.csv');

    // Write to CSV file
    writeFileSync(outputFileName, csvRows.join('\n'), 'utf-8');

    console.log(
      `✓ Successfully converted ${records.length} records to ${outputFileName}`,
    );
    console.log(`\nFound ${allFields.length} columns:`);

    const displayFields = allFields.slice(0, 10);
    displayFields.forEach((field, i) => {
      console.log(`  ${i + 1}. ${field}`);
    });

    if (allFields.length > 10) {
      console.log(`  ... and ${allFields.length - 10} more`);
    }
  } catch (error) {
    console.error(
      'Error:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

main();
