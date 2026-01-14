/**
 * Query Sessions Tool - Turso Database
 *
 * Queries session/event data from the local Turso database instead of Airtable.
 * Much faster with no rate limits.
 *
 * Contains 100 session events with information about:
 * - Session names, dates, and types
 * - Speakers and participants
 * - Program weeks
 * - Notes and attachments
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  getAllSessions,
  searchSessionsByName,
  searchSessionsBySpeaker,
  getSessionsByType,
  getSessionsByWeek,
  getUpcomingSessions,
  getPastSessions,
  getNextSession,
  getTotalSessionsCount,
  searchSessionsGlobal,
} from '../../db/helpers/query-sessions.js';

/**
 * Query sessions and events from Turso database
 * Supports multiple search strategies for flexibility
 */
export const querySessionsTool = createTool({
  id: 'query-sessions-turso',
  description: `Query session and event data from the Pioneers accelerator program database.
  Contains a list of session events with dates, speakers, types, and details.

  Search types:
  - "all": Get all sessions
  - "by-name": Search by session name (partial match, case-insensitive)
  - "by-speaker": Search by speaker name (partial match)
  - "by-type": Filter by session type (e.g., "Workshop", "Office hours")
  - "by-week": Filter by program week (e.g., "Week 1", "Week 3")
  - "upcoming": Get sessions after today (ordered by date)
  - "past": Get sessions before today (ordered by most recent first)
  - "next": Get the next upcoming session
  - "count": Get total number of sessions (returns just the count)
  - "global-search": Search across name, speaker, type, and notes

  Use this tool for questions about sessions, events, schedules, speakers, or program timeline.`,

  inputSchema: z.object({
    searchType: z
      .union([
        z.literal('all'),
        z.literal('by-name'),
        z.literal('by-speaker'),
        z.literal('by-type'),
        z.literal('by-week'),
        z.literal('upcoming'),
        z.literal('past'),
        z.literal('next'),
        z.literal('count'),
        z.literal('global-search'),
      ])
      .describe('Type of search to perform'),
    searchTerm: z
      .string()
      .optional()
      .describe(
        'Search term (required for by-name, by-speaker, by-type, by-week, global-search)',
      ),
  }),

  outputSchema: z.object({
    sessions: z
      .array(
        z.object({
          id: z.string(),
          name: z.string().nullable(),
          date: z.date().nullable(),
          programWeek: z.string().nullable(),
          typeOfSession: z.string().nullable(),
          speaker: z.string().nullable(),
          participants: z.string().nullable(),
          notesFeedback: z.string().nullable(),
          attachments: z.string().nullable(),
        }),
      )
      .optional(),
    count: z.number(),
    message: z.string().optional(),
  }),

  execute: async (input) => {
    const { searchType, searchTerm } = input;

    try {
      // Handle count-only request
      if (searchType === 'count') {
        const count = await getTotalSessionsCount();
        return {
          count,
          message: `Total sessions in database: ${count}`,
        };
      }

      // Handle next session request
      if (searchType === 'next') {
        const nextSession = await getNextSession();
        if (!nextSession) {
          return {
            sessions: [],
            count: 0,
            message: 'No upcoming sessions found',
          };
        }
        return {
          sessions: [nextSession],
          count: 1,
          message: 'Next upcoming session',
        };
      }

      // Handle search requests
      let sessions;

      switch (searchType) {
        case 'all':
          sessions = await getAllSessions();
          break;

        case 'by-name':
          if (!searchTerm) {
            return {
              sessions: [],
              count: 0,
              message: 'Error: searchTerm is required for by-name search',
            };
          }
          sessions = await searchSessionsByName(searchTerm);
          break;

        case 'by-speaker':
          if (!searchTerm) {
            return {
              sessions: [],
              count: 0,
              message: 'Error: searchTerm is required for by-speaker search',
            };
          }
          sessions = await searchSessionsBySpeaker(searchTerm);
          break;

        case 'by-type':
          if (!searchTerm) {
            return {
              sessions: [],
              count: 0,
              message: 'Error: searchTerm is required for by-type search',
            };
          }
          sessions = await getSessionsByType(searchTerm);
          break;

        case 'by-week':
          if (!searchTerm) {
            return {
              sessions: [],
              count: 0,
              message: 'Error: searchTerm is required for by-week search',
            };
          }
          sessions = await getSessionsByWeek(searchTerm);
          break;

        case 'upcoming':
          sessions = await getUpcomingSessions();
          break;

        case 'past':
          sessions = await getPastSessions();
          break;

        case 'global-search':
          if (!searchTerm) {
            return {
              sessions: [],
              count: 0,
              message: 'Error: searchTerm is required for global-search',
            };
          }
          sessions = await searchSessionsGlobal(searchTerm);
          break;

        default:
          return {
            sessions: [],
            count: 0,
            message: `Error: Unknown search type "${searchType}"`,
          };
      }

      return {
        sessions,
        count: sessions.length,
        message:
          sessions.length === 0
            ? `No sessions found matching "${searchTerm}"`
            : `Found ${sessions.length} session(s)`,
      };
    } catch (error: any) {
      return {
        sessions: [],
        count: 0,
        message: `Database error: ${error.message}`,
      };
    }
  },
});
