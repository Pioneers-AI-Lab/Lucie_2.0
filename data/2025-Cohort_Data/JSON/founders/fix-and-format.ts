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
          // Valid escape sequence - keep as is
          result.push('\\', nextChar);
          i += 2;
          continue;
        } else {
          // Invalid escape - escape the backslash
          result.push('\\\\');
          i++;
          continue;
        }
      } else {
        // Outside string or at end - keep as is
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
      // Control character must be escaped in JSON strings
      if (char === '\n') {
        result.push('\\n');
      } else if (char === '\r') {
        result.push('\\r');
      } else if (char === '\t') {
        result.push('\\t');
      } else {
        // Other control characters - replace with space
        result.push(' ');
      }
      i++;
      continue;
    }

    // Regular character
    result.push(char);
    i++;
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

    // Parse JSON with better error reporting
    let data: AirtableResponse;
    try {
      data = JSON.parse(fixedContent);
    } catch (parseError) {
      if (parseError instanceof SyntaxError) {
        const match = parseError.message.match(/position (\d+)/);
        if (match) {
          const pos = parseInt(match[1], 10);
          const start = Math.max(0, pos - 100);
          const end = Math.min(fixedContent.length, pos + 100);
          const snippet = fixedContent.substring(start, end);
          console.error(`JSON parse error at position ${pos}:`);
          console.error(`Context: ...${snippet}...`);
          console.error(
            `\nCharacter at position ${pos}: "${
              fixedContent[pos]
            }" (charCode: ${fixedContent.charCodeAt(pos)})`,
          );
        }
      }
      throw parseError;
    }
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
