/**
 * Helper functions to query founders
 */

import { db } from '../index.js';
import { founders } from '../schemas/index.js';
import { like, and, sql } from 'drizzle-orm';

/**
 * Founder interface (Profile Book only)
 * Matches founders.ts schema structure
 */
export interface Founder {
  id: string;
  founder: string | null;
  name: string | null;
  whatsapp: string | null;
  email: string | null;
  yourPhoto: string | null;
  education: string | null;
  nationality: string | null;
  gender: string | null;
  yearsOfXp: string | null;
  degree: string | null;
  academicField: string | null;
  linkedin: string | null;
  introduction: string | null;
  techSkills: string | null;
  industries: string | null;
  companiesWorked: string | null;
  batch: string | null;
}

/**
 * Get all founders (Profile Book only)
 * Returns founders sorted by years_of_xp descending (most experienced first)
 * This makes it easier for LLM to pick top N experienced founders
 */
export async function getAllFounders(): Promise<Founder[]> {
  const foundersData = await db
    .select()
    .from(founders)
    .where(sql`${founders.introduction} IS NOT NULL`)
    .orderBy(sql`CAST(${founders.yearsOfXp} AS INTEGER) DESC`);

  return foundersData.map((f) => ({
    id: f.id,
    founder: f.founder,
    name: f.name,
    whatsapp: f.whatsapp,
    email: f.email,
    yourPhoto: f.yourPhoto,
    education: f.education,
    nationality: f.nationality,
    gender: f.gender,
    yearsOfXp: f.yearsOfXp,
    degree: f.degree,
    academicField: f.academicField,
    linkedin: f.linkedin,
    introduction: f.introduction,
    techSkills: f.techSkills,
    industries: f.industries,
    companiesWorked: f.companiesWorked,
    batch: f.batch,
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
    founder: f.founder,
    name: f.name,
    whatsapp: f.whatsapp,
    email: f.email,
    yourPhoto: f.yourPhoto,
    education: f.education,
    nationality: f.nationality,
    gender: f.gender,
    yearsOfXp: f.yearsOfXp,
    degree: f.degree,
    academicField: f.academicField,
    linkedin: f.linkedin,
    introduction: f.introduction,
    techSkills: f.techSkills,
    industries: f.industries,
    companiesWorked: f.companiesWorked,
    batch: f.batch,
  }));
}

/**
 * Get founders by skills (searches in techSkills, rolesICouldTake, industries, AND interestedInWorkingOn fields, Profile Book only)
 * This broad search helps find founders whether they list their expertise in tech skills, roles, industries, or interests
 * Example: "FinTech" might be in industries, "CTO" in roles, "Python" in tech skills, "AI applications" in interests
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
        like(founders.techSkills, pattern),
        like(founders.industries, pattern),
        sql`${founders.introduction} IS NOT NULL`,
      ),
    );

  return foundersData.map((f) => ({
    id: f.id,
    founder: f.founder,
    name: f.name,
    whatsapp: f.whatsapp,
    email: f.email,
    yourPhoto: f.yourPhoto,
    education: f.education,
    nationality: f.nationality,
    gender: f.gender,
    yearsOfXp: f.yearsOfXp,
    degree: f.degree,
    academicField: f.academicField,
    linkedin: f.linkedin,
    introduction: f.introduction,
    techSkills: f.techSkills,
    industries: f.industries,
    companiesWorked: f.companiesWorked,
    batch: f.batch,
  }));
}

/**
 * Get founders by batch (Profile Book only)
 * Filters by batch field (e.g., "S25", "F24", "Summer 2025")
 * Case-insensitive partial match to handle different batch formats
 */
export async function getFoundersByBatch(batch: string): Promise<Founder[]> {
  const pattern = `%${batch}%`;

  const foundersData = await db
    .select()
    .from(founders)
    .where(
      and(
        like(founders.batch, pattern),
        sql`${founders.introduction} IS NOT NULL`,
      ),
    );

  return foundersData.map((f) => ({
    id: f.id,
    founder: f.founder,
    name: f.name,
    whatsapp: f.whatsapp,
    email: f.email,
    yourPhoto: f.yourPhoto,
    education: f.education,
    nationality: f.nationality,
    gender: f.gender,
    yearsOfXp: f.yearsOfXp,
    degree: f.degree,
    academicField: f.academicField,
    linkedin: f.linkedin,
    introduction: f.introduction,
    techSkills: f.techSkills,
    industries: f.industries,
    companiesWorked: f.companiesWorked,
    batch: f.batch,
  }));
}

/**
 * Get founders by industry (searches in industries field, Profile Book only)
 */
export async function getFoundersByIndustry(
  industryTerm: string,
): Promise<Founder[]> {
  const pattern = `%${industryTerm}%`;

  const foundersData = await db
    .select()
    .from(founders)
    .where(
      and(
        like(founders.industries, pattern),
        sql`${founders.introduction} IS NOT NULL`,
      ),
    );

  return foundersData.map((f) => ({
    id: f.id,
    founder: f.founder,
    name: f.name,
    whatsapp: f.whatsapp,
    email: f.email,
    yourPhoto: f.yourPhoto,
    education: f.education,
    nationality: f.nationality,
    gender: f.gender,
    yearsOfXp: f.yearsOfXp,
    degree: f.degree,
    academicField: f.academicField,
    linkedin: f.linkedin,
    introduction: f.introduction,
    techSkills: f.techSkills,
    industries: f.industries,
    companiesWorked: f.companiesWorked,
    batch: f.batch,
  }));
}

/**
 * Get founders by company (searches in companiesWorked field, Profile Book only)
 */
export async function getFoundersByCompany(
  companyTerm: string,
): Promise<Founder[]> {
  const pattern = `%${companyTerm}%`;

  const foundersData = await db
    .select()
    .from(founders)
    .where(
      and(
        like(founders.companiesWorked, pattern),
        sql`${founders.introduction} IS NOT NULL`,
      ),
    );

  return foundersData.map((f) => ({
    id: f.id,
    founder: f.founder,
    name: f.name,
    whatsapp: f.whatsapp,
    email: f.email,
    yourPhoto: f.yourPhoto,
    education: f.education,
    nationality: f.nationality,
    gender: f.gender,
    yearsOfXp: f.yearsOfXp,
    degree: f.degree,
    academicField: f.academicField,
    linkedin: f.linkedin,
    introduction: f.introduction,
    techSkills: f.techSkills,
    industries: f.industries,
    companiesWorked: f.companiesWorked,
    batch: f.batch,
  }));
}

/**
 * Get founders by nationality (Profile Book only)
 */
export async function getFoundersByNationality(
  nationalityTerm: string,
): Promise<Founder[]> {
  const pattern = `%${nationalityTerm}%`;

  const foundersData = await db
    .select()
    .from(founders)
    .where(
      and(
        like(founders.nationality, pattern),
        sql`${founders.introduction} IS NOT NULL`,
      ),
    );

  return foundersData.map((f) => ({
    id: f.id,
    founder: f.founder,
    name: f.name,
    whatsapp: f.whatsapp,
    email: f.email,
    yourPhoto: f.yourPhoto,
    education: f.education,
    nationality: f.nationality,
    gender: f.gender,
    yearsOfXp: f.yearsOfXp,
    degree: f.degree,
    academicField: f.academicField,
    linkedin: f.linkedin,
    introduction: f.introduction,
    techSkills: f.techSkills,
    industries: f.industries,
    companiesWorked: f.companiesWorked,
    batch: f.batch,
  }));
}

/**
 * Get founders by education (searches in education and academicField fields, Profile Book only)
 */
export async function getFoundersByEducation(
  educationTerm: string,
): Promise<Founder[]> {
  const pattern = `%${educationTerm}%`;

  const foundersData = await db
    .select()
    .from(founders)
    .where(
      and(
        like(founders.education, pattern),
        like(founders.academicField, pattern),
        sql`${founders.introduction} IS NOT NULL`,
      ),
    );

  return foundersData.map((f) => ({
    id: f.id,
    founder: f.founder,
    name: f.name,
    whatsapp: f.whatsapp,
    email: f.email,
    yourPhoto: f.yourPhoto,
    education: f.education,
    nationality: f.nationality,
    gender: f.gender,
    yearsOfXp: f.yearsOfXp,
    degree: f.degree,
    academicField: f.academicField,
    linkedin: f.linkedin,
    introduction: f.introduction,
    techSkills: f.techSkills,
    industries: f.industries,
    companiesWorked: f.companiesWorked,
    batch: f.batch,
  }));
}

/**
 * Get founders by project (searches in project-related fields, Profile Book only)
 */
export async function getFoundersByProject(
  projectTerm: string,
): Promise<Founder[]> {
  const pattern = `%${projectTerm}%`;

  const foundersData = await db
    .select()
    .from(founders)
    .where(
      and(
        sql`${founders.introduction} IS NOT NULL`,
      ),
    );

  return foundersData.map((f) => ({
    id: f.id,
    founder: f.founder,
    name: f.name,
    whatsapp: f.whatsapp,
    email: f.email,
    yourPhoto: f.yourPhoto,
    education: f.education,
    nationality: f.nationality,
    gender: f.gender,
    yearsOfXp: f.yearsOfXp,
    degree: f.degree,
    academicField: f.academicField,
    linkedin: f.linkedin,
    introduction: f.introduction,
    techSkills: f.techSkills,
    industries: f.industries,
    companiesWorked: f.companiesWorked,
    batch: f.batch,
  }));
}

/**
 * Global search across all text fields (Profile Book only)
 */
export async function searchFoundersGlobal(
  searchTerm: string,
): Promise<Founder[]> {
  const pattern = `%${searchTerm}%`;

  const foundersData = await db
    .select()
    .from(founders)
    .where(
      and(
        like(founders.name, pattern),
        like(founders.techSkills, pattern),
        like(founders.industries, pattern),
        like(founders.companiesWorked, pattern),
        like(founders.introduction, pattern),
        like(founders.education, pattern),
        like(founders.academicField, pattern),
        like(founders.nationality, pattern),
        sql`${founders.introduction} IS NOT NULL`,
      ),
    );

  return foundersData.map((f) => ({
    id: f.id,
    founder: f.founder,
    name: f.name,
    whatsapp: f.whatsapp,
    email: f.email,
    yourPhoto: f.yourPhoto,
    education: f.education,
    nationality: f.nationality,
    gender: f.gender,
    yearsOfXp: f.yearsOfXp,
    degree: f.degree,
    academicField: f.academicField,
    linkedin: f.linkedin,
    introduction: f.introduction,
    techSkills: f.techSkills,
    industries: f.industries,
    companiesWorked: f.companiesWorked,
    batch: f.batch,
  }));
}

/**
 * Get active founders only (excluding those who left the program, Profile Book only)
 */
export async function getActiveFounders(): Promise<Founder[]> {
  const foundersData = await db
    .select()
    .from(founders)
    .where(
      and(
        sql`${founders.introduction} IS NOT NULL`,
      ),
    );

  return foundersData.map((f) => ({
    id: f.id,
    founder: f.founder,
    name: f.name,
    whatsapp: f.whatsapp,
    email: f.email,
    yourPhoto: f.yourPhoto,
    education: f.education,
    nationality: f.nationality,
    gender: f.gender,
    yearsOfXp: f.yearsOfXp,
    degree: f.degree,
    academicField: f.academicField,
    linkedin: f.linkedin,
    introduction: f.introduction,
    techSkills: f.techSkills,
    industries: f.industries,
    companiesWorked: f.companiesWorked,
    batch: f.batch,
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
