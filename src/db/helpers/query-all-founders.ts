/**
 * Helper functions to query founders
 */

import { db } from '../index.js';
import { founders } from '../schemas/index.js';
import { like, or, and, eq, sql } from 'drizzle-orm';

/**
 * Founder interface (Profile Book only)
 */
export interface Founder {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  nationality: string | null;
  status: string | null;
  yearsOfXp: number | null;
  degree: string | null;
  academicField: string | null;
  leftProgram: string | null;
  yourPhoto: string | null;
  techSkills: string | null;
  roles: string | null;
  industries: string | null;
  introduction: string | null;
  rolesICouldTake: string | null;
  trackRecordProud: string | null;
  source: 'profile_book';
}

/**
 * Get all founders (Profile Book only)
 */
export async function getAllFounders(): Promise<Founder[]> {
  const foundersData = await db
    .select()
    .from(founders)
    .where(sql`${founders.introduction} IS NOT NULL`);

  return foundersData.map((f) => ({
    id: f.id,
    name: f.name,
    email: f.email,
    phone: f.whatsapp,
    linkedin: f.linkedin,
    nationality: f.nationality,
    status: f.status,
    techSkills: f.techSkills,
    roles: f.rolesICouldTake,
    industries: f.industries,
    introduction: f.introduction,
    source: 'profile_book' as const,
    yearsOfXp: f.yearsOfXp,
    degree: f.degree,
    academicField: f.academicField,
    leftProgram: f.leftProgram,
    yourPhoto: f.yourPhoto,
    rolesICouldTake: f.rolesICouldTake,
    trackRecordProud: f.trackRecordProud,
  }));
}

/**
 * Get founder by name (case-insensitive partial match, Profile Book only)
 */
export async function getFoundersByName(
  searchTerm: string,
): Promise<Founder[]> {
  const pattern = `%${searchTerm}%`;

  const foundersData = await db
    .select()
    .from(founders)
    .where(
      and(
        like(founders.name, pattern),
        sql`${founders.introduction} IS NOT NULL`,
      ),
    );

  return foundersData.map((f) => ({
    id: f.id,
    name: f.name,
    email: f.email,
    phone: f.whatsapp,
    linkedin: f.linkedin,
    nationality: f.nationality,
    status: f.status,
    techSkills: f.techSkills,
    roles: f.rolesICouldTake,
    industries: f.industries,
    introduction: f.introduction,
    source: 'profile_book' as const,
    yearsOfXp: f.yearsOfXp,
    degree: f.degree,
    academicField: f.academicField,
    leftProgram: f.leftProgram,
    yourPhoto: f.yourPhoto,
    rolesICouldTake: f.rolesICouldTake,
    trackRecordProud: f.trackRecordProud,
  }));
}

/**
 * Get founders by skills (searches in techSkills field, Profile Book only)
 */
export async function getFoundersBySkills(
  skillTerm: string,
): Promise<Founder[]> {
  const pattern = `%${skillTerm}%`;

  const foundersData = await db
    .select()
    .from(founders)
    .where(
      and(
        or(
          like(founders.techSkills, pattern),
          like(founders.rolesICouldTake, pattern),
        ),
        sql`${founders.introduction} IS NOT NULL`,
      ),
    );

  return foundersData.map((f) => ({
    id: f.id,
    name: f.name,
    email: f.email,
    phone: f.whatsapp,
    linkedin: f.linkedin,
    nationality: f.nationality,
    status: f.status,
    techSkills: f.techSkills,
    roles: f.rolesICouldTake,
    industries: f.industries,
    introduction: f.introduction,
    yearsOfXp: f.yearsOfXp,
    degree: f.degree,
    academicField: f.academicField,
    leftProgram: f.leftProgram,
    yourPhoto: f.yourPhoto,
    rolesICouldTake: f.rolesICouldTake,
    trackRecordProud: f.trackRecordProud,
    source: 'profile_book' as const,
  }));
}

/**
 * Get founders by batch (Profile Book only)
 * NOTE: Batch field is not in Profile Book table-ref, so this function returns all founders
 * TODO: Add batch field to schema if batch filtering is needed
 */
export async function getFoundersByBatch(batch: string): Promise<Founder[]> {
  // Batch field not available in Profile Book schema - return all founders
  // This maintains API compatibility but doesn't filter by batch
  const foundersData = await db
    .select()
    .from(founders)
    .where(sql`${founders.introduction} IS NOT NULL`);

  return foundersData.map((f) => ({
    id: f.id,
    name: f.name,
    email: f.email,
    phone: f.whatsapp,
    linkedin: f.linkedin,
    nationality: f.nationality,
    status: f.status,
    techSkills: f.techSkills,
    roles: f.rolesICouldTake,
    industries: f.industries,
    introduction: f.introduction,
    yearsOfXp: f.yearsOfXp,
    degree: f.degree,
    academicField: f.academicField,
    leftProgram: f.leftProgram,
    yourPhoto: f.yourPhoto,
    rolesICouldTake: f.rolesICouldTake,
    trackRecordProud: f.trackRecordProud,
    source: 'profile_book' as const,
  }));
}

/**
 * Get count of all founders (Profile Book only)
 */
export async function getFoundersCount(): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(founders)
    .where(sql`${founders.introduction} IS NOT NULL`);

  return result?.count || 0;
}
