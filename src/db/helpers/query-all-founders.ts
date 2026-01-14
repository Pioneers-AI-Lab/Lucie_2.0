/**
 * Helper functions to query all founders across both tables
 *
 * Since founders and founders_grid_data represent DIFFERENT people
 * (no overlap), we need to query both tables to get complete results.
 */

import { db } from '../index.js';
import { founders, foundersGridData } from '../schemas/index.js';
import { like, or, and, eq, sql } from 'drizzle-orm';

/**
 * Unified founder interface combining both table structures
 */
export interface UnifiedFounder {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  nationality: string | null;
  age: string | null;
  batch: string | null;
  status: string | null;
  techSkills: string | null;
  roles: string | null;
  industries: string | null;
  introduction: string | null;
  source: 'profile_book' | 'grid_view';
}

/**
 * Get all founders from both tables as unified records
 */
export async function getAllFounders(): Promise<UnifiedFounder[]> {
  // Query Profile Book
  const profileFounders = await db.select().from(founders);

  // Query Grid View
  const gridFounders = await db.select().from(foundersGridData);

  // Normalize to unified format
  const unified: UnifiedFounder[] = [
    ...profileFounders.map(f => ({
      id: f.id,
      name: f.name,
      email: f.email,
      phone: f.whatsapp,
      linkedin: f.linkedin,
      nationality: f.nationality,
      age: null, // Not in profile book
      batch: f.batch,
      status: f.status,
      techSkills: f.techSkills,
      roles: f.rolesICouldTake,
      industries: f.industries,
      introduction: f.introduction,
      source: 'profile_book' as const,
    })),
    ...gridFounders.map(f => ({
      id: f.id,
      name: f.name,
      email: f.emailAddress,
      phone: f.mobileNumber,
      linkedin: f.linkedin,
      nationality: f.nationality,
      age: f.age,
      batch: f.batch,
      status: null, // Not in grid view
      techSkills: f.itExpertise,
      roles: null, // Not in grid view
      industries: null, // Not in grid view
      introduction: f.introMessage,
      source: 'grid_view' as const,
    })),
  ];

  return unified;
}

/**
 * Search founders by name across both tables
 */
export async function searchFoundersByName(searchTerm: string): Promise<UnifiedFounder[]> {
  const searchPattern = `%${searchTerm}%`;

  // Search Profile Book
  const profileMatches = await db.select()
    .from(founders)
    .where(like(founders.name, searchPattern));

  // Search Grid View
  const gridMatches = await db.select()
    .from(foundersGridData)
    .where(like(foundersGridData.name, searchPattern));

  // Normalize and combine
  return [
    ...profileMatches.map(f => ({
      id: f.id,
      name: f.name,
      email: f.email,
      phone: f.whatsapp,
      linkedin: f.linkedin,
      nationality: f.nationality,
      age: null,
      batch: f.batch,
      status: f.status,
      techSkills: f.techSkills,
      roles: f.rolesICouldTake,
      industries: f.industries,
      introduction: f.introduction,
      source: 'profile_book' as const,
    })),
    ...gridMatches.map(f => ({
      id: f.id,
      name: f.name,
      email: f.emailAddress,
      phone: f.mobileNumber,
      linkedin: f.linkedin,
      nationality: f.nationality,
      age: f.age,
      batch: f.batch,
      status: null,
      techSkills: f.itExpertise,
      roles: null,
      industries: null,
      introduction: f.introMessage,
      source: 'grid_view' as const,
    })),
  ];
}

/**
 * Search founders by skills/expertise across both tables
 */
export async function searchFoundersBySkills(skillTerm: string): Promise<UnifiedFounder[]> {
  const searchPattern = `%${skillTerm}%`;

  // Search Profile Book (techSkills field)
  const profileMatches = await db.select()
    .from(founders)
    .where(like(founders.techSkills, searchPattern));

  // Search Grid View (itExpertise field)
  const gridMatches = await db.select()
    .from(foundersGridData)
    .where(like(foundersGridData.itExpertise, searchPattern));

  // Normalize and combine
  return [
    ...profileMatches.map(f => ({
      id: f.id,
      name: f.name,
      email: f.email,
      phone: f.whatsapp,
      linkedin: f.linkedin,
      nationality: f.nationality,
      age: null,
      batch: f.batch,
      status: f.status,
      techSkills: f.techSkills,
      roles: f.rolesICouldTake,
      industries: f.industries,
      introduction: f.introduction,
      source: 'profile_book' as const,
    })),
    ...gridMatches.map(f => ({
      id: f.id,
      name: f.name,
      email: f.emailAddress,
      phone: f.mobileNumber,
      linkedin: f.linkedin,
      nationality: f.nationality,
      age: f.age,
      batch: f.batch,
      status: null,
      techSkills: f.itExpertise,
      roles: null,
      industries: null,
      introduction: f.introMessage,
      source: 'grid_view' as const,
    })),
  ];
}

/**
 * Get founders by batch
 */
export async function getFoundersByBatch(batch: string): Promise<UnifiedFounder[]> {
  // Search Profile Book
  const profileMatches = await db.select()
    .from(founders)
    .where(eq(founders.batch, batch));

  // Search Grid View
  const gridMatches = await db.select()
    .from(foundersGridData)
    .where(eq(foundersGridData.batch, batch));

  // Normalize and combine
  return [
    ...profileMatches.map(f => ({
      id: f.id,
      name: f.name,
      email: f.email,
      phone: f.whatsapp,
      linkedin: f.linkedin,
      nationality: f.nationality,
      age: null,
      batch: f.batch,
      status: f.status,
      techSkills: f.techSkills,
      roles: f.rolesICouldTake,
      industries: f.industries,
      introduction: f.introduction,
      source: 'profile_book' as const,
    })),
    ...gridMatches.map(f => ({
      id: f.id,
      name: f.name,
      email: f.emailAddress,
      phone: f.mobileNumber,
      linkedin: f.linkedin,
      nationality: f.nationality,
      age: f.age,
      batch: f.batch,
      status: null,
      techSkills: f.itExpertise,
      roles: null,
      industries: null,
      introduction: f.introMessage,
      source: 'grid_view' as const,
    })),
  ];
}

/**
 * Get total count of all founders
 */
export async function getTotalFoundersCount(): Promise<number> {
  const profileCount = await db.select().from(founders);
  const gridCount = await db.select().from(foundersGridData);
  return profileCount.length + gridCount.length;
}
