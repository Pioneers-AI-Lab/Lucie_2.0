#!/usr/bin/env ts-node
/**
 * Convert Airtable JSON responses to clean JSON format
 * with IDs as top-level keys
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

interface OutputFormat {
  [id: string]: {
    createdTime: string;
    fields: Record<string, any>;
  };
}

function fixJsonWithEmbeddedNewlines(content: string): string {
  const result: string[] = [];
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (escapeNext) {
      result.push(char);
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      result.push(char);
      escapeNext = true;
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

function convertFromCSV(inputFile: string, outputFile: string) {
  const content = readFileSync(inputFile, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    console.error(`  ✗ CSV file has no data rows`);
    return;
  }

  // Parse CSV header
  const headers = lines[0].split(',');
  const idIndex = headers.indexOf('id');
  const createdTimeIndex = headers.indexOf('createdTime');

  if (idIndex === -1) {
    console.error(`  ✗ CSV missing 'id' column`);
    return;
  }

  const output: OutputFormat = {};

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    // Parse CSV line handling quoted fields
    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      if (char === '"') {
        if (insideQuotes && line[j + 1] === '"') {
          currentValue += '"';
          j++; // Skip next quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue); // Push last value

    const id = values[idIndex];
    if (!id) continue;

    const fields: Record<string, any> = {};

    // Build fields object
    for (let j = 0; j < headers.length; j++) {
      if (j === idIndex || j === createdTimeIndex) continue;
      const header = headers[j];
      const value = values[j] || '';

      if (value) {
        // Convert pipe separators back to newlines if needed
        fields[header] = value.replace(/ \| /g, '\n');
      }
    }

    output[id] = {
      createdTime: values[createdTimeIndex] || '',
      fields,
    };
  }

  writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`  ✓ Converted ${Object.keys(output).length} records to ${outputFile}`);
  console.log(`  ✓ IDs: ${Object.keys(output).slice(0, 3).join(', ')}...`);
}

function convertFromJSON(inputFile: string, outputFile: string) {
  // Read the malformed JSON file
  const content = readFileSync(inputFile, 'utf-8');

  // Fix embedded newlines in JSON strings
  const fixedContent = fixJsonWithEmbeddedNewlines(content);

  // Parse JSON
  const data: AirtableResponse = JSON.parse(fixedContent);
  const records = data.records;

  if (!records || records.length === 0) {
    console.error(`  ✗ No records found in ${inputFile}`);
    return;
  }

  // Convert to ID-keyed format
  const output: OutputFormat = {};

  for (const record of records) {
    output[record.id] = {
      createdTime: record.createdTime,
      fields: record.fields,
    };
  }

  // Write to JSON file with pretty formatting
  writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`  ✓ Converted ${records.length} records to ${outputFile}`);
  console.log(`  ✓ IDs: ${Object.keys(output).slice(0, 3).join(', ')}...`);
}

function convertFile(inputFile: string, outputFile: string) {
  try {
    console.log(`\nProcessing: ${inputFile}`);

    // Read first few bytes to determine format
    const content = readFileSync(inputFile, 'utf-8');
    const firstChar = content.trim()[0];

    if (firstChar === '{') {
      // JSON format
      convertFromJSON(inputFile, outputFile);
    } else {
      // CSV format
      convertFromCSV(inputFile, outputFile);
    }

  } catch (error) {
    console.error(`  ✗ Error processing ${inputFile}:`, error instanceof Error ? error.message : String(error));
  }
}

function main() {
  // Get input filename from command line arguments
  const inputFileName = process.argv[2];
  
  if (!inputFileName) {
    console.error('Error: Please provide an input file name as an argument');
    console.error('Usage: ts-node convert-to-json-by-id.ts <input-file>');
    process.exit(1);
  }

  // Generate output filename (replace extension with .json)
  const outputFileName = inputFileName.replace(/\.(csv|json)$/, '.json');

  console.log('Converting Airtable file to JSON format (ID as key)...');

  convertFile(inputFileName, outputFileName);

  console.log('\n✓ Conversion complete!');
}

main();
