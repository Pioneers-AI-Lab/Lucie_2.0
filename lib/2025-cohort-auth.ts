import Airtable from 'airtable';
import { log } from './print-helpers.js';
import 'dotenv/config';

if (!process.env.AIRTABLE_API_KEY || !process.env.SU_2025_BASE_ID) {
    throw new Error('Missing Airtable environment variables');
}

const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY });
const base = airtable.base(process.env.SU_2025_BASE_ID);

log('base', base);
