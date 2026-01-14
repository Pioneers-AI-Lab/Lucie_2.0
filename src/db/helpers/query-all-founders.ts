/**
 * Helper functions to query founders
 */

import { db } from '../index.js';
import { founders } from '../schemas/index.js';
import { like, or, and, eq, sql } from 'drizzle-orm';

/**
 * Founder interface
 */
export interface Founder {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  nationality: string | null;
  batch: string | null;
  status: string | null;
  techSkills: string | null;
  roles: string | null;
  industries: string | null;
  introduction: string | null;
}

/**
 * Get all founders
 */
export async function getAllFounders(): Promise<Founder[]> {
  const foundersData = await db.select().from(founders);

  return foundersData.map(f => ({
    id: f.id,
    name: f.name,
    email: f.email,
    phone: f.whatsapp,
    linkedin: f.linkedin,
    nationality: f.nationality,
    batch: f.batch,
    status: f.status,
    techSkills: f.techSkills,
    roles: f.rolesICouldTake,
    industries: f.industries,
    introduction: f.introduction,
  }));
}

/**
 * Get founder by name (case-insensitive partial match)
 */
export async function getFoundersByName(searchTerm: string): Promise<Founder[]> {
  const pattern = `%${searchTerm}%`;

  const foundersData = await db
    .select()
    .from(founders)
    .where(like(founders.name, pattern));

  return foundersData.map(f => ({
    id: f.id,
    name: f.name,
    email: f.email,
    phone: f.whatsapp,
    linkedin: f.linkedin,
    nationality: f.nationality,
    batch: f.batch,
    status: f.status,
    techSkills: f.techSkills,
    roles: f.rolesICouldTake,
    industries: f.industries,
    introduction: f.introduction,
  }));
}

/**
 * Get founders by skills (searches in techSkills field)
 */
export async function getFoundersBySkills(skillTerm: string): Promise<Founder[]> {
  const pattern = `%${skillTerm}%`;

  const foundersData = await db
    .select()
    .from(founders)
    .where(
      or(
        like(founders.techSkills, pattern),
        like(founders.rolesICouldTake, pattern)
      )
    );

  return foundersData.map(f => ({
    id: f.id,
    name: f.name,
    email: f.email,
    phone: f.whatsapp,
    linkedin: f.linkedin,
    nationality: f.nationality,
    batch: f.batch,
    status: f.status,
    techSkills: f.techSkills,
    roles: f.rolesICouldTake,
    industries: f.industries,
    introduction: f.introduction,
  }));
}

/**
 * Get founders by batch
 */
export async function getFoundersByBatch(batch: string): Promise<Founder[]> {
  const foundersData = await db
    .select()
    .from(founders)
    .where(eq(founders.batch, batch));

  return foundersData.map(f => ({
    id: f.id,
    name: f.name,
    email: f.email,
    phone: f.whatsapp,
    linkedin: f.linkedin,
    nationality: f.nationality,
    batch: f.batch,
    status: f.status,
    techSkills: f.techSkills,
    roles: f.rolesICouldTake,
    industries: f.industries,
    introduction: f.introduction,
  }));
}

/**
 * Get count of all founders
 */
export async function getFoundersCount(): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(founders);

  return result?.count || 0;
}
