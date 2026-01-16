/**
 * Helper functions to query founders
 */

import { db } from '../index.js';
import { founders } from '../schemas/index.js';
import { like, or, and, eq, sql } from 'drizzle-orm';

/**
 * Founder interface (Profile Book only)
 * Matches founders.ts schema structure
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
  yearsOfXp: string | null;
  degree: string | null;
  academicField: string | null;
  // Relationships
  founder: string | null;
  // Status
  leftProgram: string | null;
  // Batch/Cohort
  batch: string | null;
  // Convenience fields (aliases for compatibility)
  phone: string | null; // Maps to whatsapp
  roles: string | null; // Maps to rolesICouldTake
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
    // Basic Information
    name: f.name,
    status: f.status,
    whatsapp: f.whatsapp,
    email: f.email,
    yourPhoto: f.yourPhoto,
    // Project Information
    existingProjectIdea: f.existingProjectIdea,
    projectExplanation: f.projectExplanation,
    existingCofounderName: f.existingCofounderName,
    openToJoinAnotherProject: f.openToJoinAnotherProject,
    joiningWithCofounder: f.joiningWithCofounder,
    // Professional Profile
    linkedin: f.linkedin,
    techSkills: f.techSkills,
    industries: f.industries,
    rolesICouldTake: f.rolesICouldTake,
    trackRecordProud: f.trackRecordProud,
    interestedInWorkingOn: f.interestedInWorkingOn,
    introduction: f.introduction,
    // Professional Background
    companiesWorked: f.companiesWorked,
    // Education
    education: f.education,
    nationality: f.nationality,
    gender: f.gender,
    yearsOfXp: f.yearsOfXp,
    degree: f.degree,
    academicField: f.academicField,
    // Relationships
    founder: f.founder,
    // Status
    leftProgram: f.leftProgram,
    // Batch/Cohort
    batch: f.batch,
    // Convenience fields
    phone: f.whatsapp,
    roles: f.rolesICouldTake,
    // Metadata
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
    // Basic Information
    name: f.name,
    status: f.status,
    whatsapp: f.whatsapp,
    email: f.email,
    yourPhoto: f.yourPhoto,
    // Project Information
    existingProjectIdea: f.existingProjectIdea,
    projectExplanation: f.projectExplanation,
    existingCofounderName: f.existingCofounderName,
    openToJoinAnotherProject: f.openToJoinAnotherProject,
    joiningWithCofounder: f.joiningWithCofounder,
    // Professional Profile
    linkedin: f.linkedin,
    techSkills: f.techSkills,
    industries: f.industries,
    rolesICouldTake: f.rolesICouldTake,
    trackRecordProud: f.trackRecordProud,
    interestedInWorkingOn: f.interestedInWorkingOn,
    introduction: f.introduction,
    // Professional Background
    companiesWorked: f.companiesWorked,
    // Education
    education: f.education,
    nationality: f.nationality,
    gender: f.gender,
    yearsOfXp: f.yearsOfXp,
    degree: f.degree,
    academicField: f.academicField,
    // Relationships
    founder: f.founder,
    // Status
    leftProgram: f.leftProgram,
    // Batch/Cohort
    batch: f.batch,
    // Convenience fields
    phone: f.whatsapp,
    roles: f.rolesICouldTake,
    // Metadata
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
    // Basic Information
    name: f.name,
    status: f.status,
    whatsapp: f.whatsapp,
    email: f.email,
    yourPhoto: f.yourPhoto,
    // Project Information
    existingProjectIdea: f.existingProjectIdea,
    projectExplanation: f.projectExplanation,
    existingCofounderName: f.existingCofounderName,
    openToJoinAnotherProject: f.openToJoinAnotherProject,
    joiningWithCofounder: f.joiningWithCofounder,
    // Professional Profile
    linkedin: f.linkedin,
    techSkills: f.techSkills,
    industries: f.industries,
    rolesICouldTake: f.rolesICouldTake,
    trackRecordProud: f.trackRecordProud,
    interestedInWorkingOn: f.interestedInWorkingOn,
    introduction: f.introduction,
    // Professional Background
    companiesWorked: f.companiesWorked,
    // Education
    education: f.education,
    nationality: f.nationality,
    gender: f.gender,
    yearsOfXp: f.yearsOfXp,
    degree: f.degree,
    academicField: f.academicField,
    // Relationships
    founder: f.founder,
    // Status
    leftProgram: f.leftProgram,
    // Batch/Cohort
    batch: f.batch,
    // Convenience fields
    phone: f.whatsapp,
    roles: f.rolesICouldTake,
    // Metadata
    source: 'profile_book' as const,
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
    // Basic Information
    name: f.name,
    status: f.status,
    whatsapp: f.whatsapp,
    email: f.email,
    yourPhoto: f.yourPhoto,
    // Project Information
    existingProjectIdea: f.existingProjectIdea,
    projectExplanation: f.projectExplanation,
    existingCofounderName: f.existingCofounderName,
    openToJoinAnotherProject: f.openToJoinAnotherProject,
    joiningWithCofounder: f.joiningWithCofounder,
    // Professional Profile
    linkedin: f.linkedin,
    techSkills: f.techSkills,
    industries: f.industries,
    rolesICouldTake: f.rolesICouldTake,
    trackRecordProud: f.trackRecordProud,
    interestedInWorkingOn: f.interestedInWorkingOn,
    introduction: f.introduction,
    // Professional Background
    companiesWorked: f.companiesWorked,
    // Education
    education: f.education,
    nationality: f.nationality,
    gender: f.gender,
    yearsOfXp: f.yearsOfXp,
    degree: f.degree,
    academicField: f.academicField,
    // Relationships
    founder: f.founder,
    // Status
    leftProgram: f.leftProgram,
    // Batch/Cohort
    batch: f.batch,
    // Convenience fields
    phone: f.whatsapp,
    roles: f.rolesICouldTake,
    // Metadata
    source: 'profile_book' as const,
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
    batch: f.batch,
    phone: f.whatsapp,
    roles: f.rolesICouldTake,
    source: 'profile_book' as const,
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
    batch: f.batch,
    phone: f.whatsapp,
    roles: f.rolesICouldTake,
    source: 'profile_book' as const,
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
    batch: f.batch,
    phone: f.whatsapp,
    roles: f.rolesICouldTake,
    source: 'profile_book' as const,
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
        or(
          like(founders.education, pattern),
          like(founders.academicField, pattern),
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
    batch: f.batch,
    phone: f.whatsapp,
    roles: f.rolesICouldTake,
    source: 'profile_book' as const,
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
        or(
          like(founders.existingProjectIdea, pattern),
          like(founders.projectExplanation, pattern),
          like(founders.interestedInWorkingOn, pattern),
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
    batch: f.batch,
    phone: f.whatsapp,
    roles: f.rolesICouldTake,
    source: 'profile_book' as const,
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
        or(
          like(founders.name, pattern),
          like(founders.techSkills, pattern),
          like(founders.rolesICouldTake, pattern),
          like(founders.industries, pattern),
          like(founders.companiesWorked, pattern),
          like(founders.introduction, pattern),
          like(founders.trackRecordProud, pattern),
          like(founders.interestedInWorkingOn, pattern),
          like(founders.existingProjectIdea, pattern),
          like(founders.projectExplanation, pattern),
          like(founders.education, pattern),
          like(founders.academicField, pattern),
          like(founders.nationality, pattern),
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
    batch: f.batch,
    phone: f.whatsapp,
    roles: f.rolesICouldTake,
    source: 'profile_book' as const,
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
        or(
          sql`${founders.leftProgram} IS NULL`,
          sql`${founders.leftProgram} = ''`,
        ),
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
    batch: f.batch,
    phone: f.whatsapp,
    roles: f.rolesICouldTake,
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
