/**
 * Helper functions to query founders
 */

import { db } from '../index.js';
import { founders } from '../schemas/index.js';
import { like, or, and, eq, sql } from 'drizzle-orm';

/**
 * Founder interface (Profile Book only)
 * Matches pioneers-profile-book-table-ref.json structure
 */
export interface Founder {
  id: string;
  // Basic Information
  name: string | null;
  status: string | null;
  whatsapp: string | null;
  email: string | null;
  yourPhoto: string | null;
  // Project Information
  existingProjectIdea: string | null;
  projectExplanation: string | null;
  existingCofounderName: string | null;
  openToJoinAnotherProject: string | null;
  joiningWithCofounder: string | null;
  // Professional Profile
  linkedin: string | null;
  techSkills: string | null;
  industries: string | null;
  rolesICouldTake: string | null;
  trackRecordProud: string | null;
  interestedInWorkingOn: string | null;
  introduction: string | null;
  // Professional Background
  companiesWorked: string | null;
  // Education
  education: string | null;
  nationality: string | null;
  gender: string | null;
  yearsOfXp: number | null;
  degree: string | null;
  academicField: string | null;
  // Relationships
  founder: string | null;
  // Status
  leftProgram: string | null;
  // Metadata
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
    status: f.status,
    whatsapp: f.whatsapp,
    email: f.email,
    yourPhoto: f.yourPhoto,
    existingProjectIdea: f.existingProjectIdea,
    projectExplanation: f.projectExplanation,
    existingCofounderName: f.existingCofounderName,
    openToJoinAnotherProject: f.openToJoinAnotherProject,
    joiningWithCofounder: f.joiningWithCofounder,
    linkedin: f.linkedin,
    techSkills: f.techSkills,
    industries: f.industries,
    rolesICouldTake: f.rolesICouldTake,
    trackRecordProud: f.trackRecordProud,
    interestedInWorkingOn: f.interestedInWorkingOn,
    introduction: f.introduction,
    companiesWorked: f.companiesWorked,
    education: f.education,
    nationality: f.nationality,
    gender: f.gender,
    yearsOfXp: f.yearsOfXp,
    degree: f.degree,
    academicField: f.academicField,
    founder: f.founder,
    leftProgram: f.leftProgram,
    source: 'profile_book' as const,
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
    status: f.status,
    whatsapp: f.whatsapp,
    email: f.email,
    yourPhoto: f.yourPhoto,
    existingProjectIdea: f.existingProjectIdea,
    projectExplanation: f.projectExplanation,
    existingCofounderName: f.existingCofounderName,
    openToJoinAnotherProject: f.openToJoinAnotherProject,
    joiningWithCofounder: f.joiningWithCofounder,
    linkedin: f.linkedin,
    techSkills: f.techSkills,
    industries: f.industries,
    rolesICouldTake: f.rolesICouldTake,
    trackRecordProud: f.trackRecordProud,
    interestedInWorkingOn: f.interestedInWorkingOn,
    introduction: f.introduction,
    companiesWorked: f.companiesWorked,
    education: f.education,
    nationality: f.nationality,
    gender: f.gender,
    yearsOfXp: f.yearsOfXp,
    degree: f.degree,
    academicField: f.academicField,
    founder: f.founder,
    leftProgram: f.leftProgram,
    source: 'profile_book' as const,
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
    status: f.status,
    whatsapp: f.whatsapp,
    email: f.email,
    yourPhoto: f.yourPhoto,
    existingProjectIdea: f.existingProjectIdea,
    projectExplanation: f.projectExplanation,
    existingCofounderName: f.existingCofounderName,
    openToJoinAnotherProject: f.openToJoinAnotherProject,
    joiningWithCofounder: f.joiningWithCofounder,
    linkedin: f.linkedin,
    techSkills: f.techSkills,
    industries: f.industries,
    rolesICouldTake: f.rolesICouldTake,
    trackRecordProud: f.trackRecordProud,
    interestedInWorkingOn: f.interestedInWorkingOn,
    introduction: f.introduction,
    companiesWorked: f.companiesWorked,
    education: f.education,
    nationality: f.nationality,
    gender: f.gender,
    yearsOfXp: f.yearsOfXp,
    degree: f.degree,
    academicField: f.academicField,
    founder: f.founder,
    leftProgram: f.leftProgram,
    source: 'profile_book' as const,
  }));
}

/**
 * Get founders by batch (Profile Book only)
 * NOTE: Batch field is not in Profile Book table-ref, so this function returns all founders
 * TODO: uncomment when batch field is added to schema or when new table id is retrieved
 */
// export async function getFoundersByBatch(batch: string): Promise<Founder[]> {
//   // Batch field not available in Profile Book schema - return all founders
//   // This maintains API compatibility but doesn't filter by batch
//   const foundersData = await db
//     .select()
//     .from(founders)
//     .where(sql`${founders.introduction} IS NOT NULL`);

//   return foundersData.map((f) => ({
//     id: f.id,
//     name: f.name,
//     email: f.email,
//     phone: f.whatsapp,
//     linkedin: f.linkedin,
//     nationality: f.nationality,
//     status: f.status,
//     techSkills: f.techSkills,
//     roles: f.rolesICouldTake,
//     industries: f.industries,
//     introduction: f.introduction,
//     source: 'profile_book' as const,
//   }));
// }

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
