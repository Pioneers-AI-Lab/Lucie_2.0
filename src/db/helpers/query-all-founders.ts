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
    status: string | null;
    leftProgram: string | null;
    trackRecord: string | null;
    rolesICouldTake: string | null;
    interestedInWorkingOn: string | null;
    confirmEnrolment: string | null;
    existingProjectIdea: string | null;
    projectExplanation: string | null;
    existingCofounderName: string | null;
    joiningWithCofounder: string | null;
    openToJoinAnotherProject: string | null;
    anythingToLetUsKnow: string | null;
}

/**
 * Helper function to deduplicate founders by ID
 * Prevents duplicate records from appearing in results
 */
function deduplicateFounders(foundersData: any[]): any[] {
    const seen = new Set<string>();
    return foundersData.filter(f => {
        if (seen.has(f.id)) return false;
        seen.add(f.id);
        return true;
    });
}

/**
 * Helper function to map database results to Founder interface
 */
function mapToFounder(f: any): Founder {
    return {
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
        status: f.status,
        leftProgram: f.leftProgram,
        trackRecord: f.trackRecord,
        rolesICouldTake: f.rolesICouldTake,
        interestedInWorkingOn: f.interestedInWorkingOn,
        confirmEnrolment: f.confirmEnrolment,
        existingProjectIdea: f.existingProjectIdea,
        projectExplanation: f.projectExplanation,
        existingCofounderName: f.existingCofounderName,
        joiningWithCofounder: f.joiningWithCofounder,
        openToJoinAnotherProject: f.openToJoinAnotherProject,
        anythingToLetUsKnow: f.anythingToLetUsKnow,
    };
}

/**
 * Get all founders (Profile Book only)
 * Returns founders sorted by years_of_xp descending (most experienced first)
 * This makes it easier for LLM to pick top N experienced founders
 * Fixed: De-duplicates by ID to prevent duplicate names in results
 */
export async function getAllFounders(): Promise<Founder[]> {
    const foundersData = await db
        .select()
        .from(founders)
        .where(sql`${founders.introduction} IS NOT NULL`)
        .orderBy(
            sql`CAST(${founders.yearsOfXp} AS INTEGER) DESC NULLS LAST`,
            founders.name,
        );

    return deduplicateFounders(foundersData).map(mapToFounder);
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

    return deduplicateFounders(foundersData).map(mapToFounder);
}

/**
 * Get founders by skills (searches in techSkills, industries, introduction, AND academicField fields, Profile Book only)
 * This broad search helps find founders whether they list their expertise in tech skills, industries, introductions, or academic background
 * Example: "FinTech" might be in industries, "Python" in tech skills, "AI applications" in introduction, "Computer Science" in academic field
 * Fixed: Uses OR logic so founders match if ANY field contains the search term
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
                sql`(
          ${founders.techSkills} LIKE ${pattern} OR
          ${founders.industries} LIKE ${pattern} OR
          ${founders.introduction} LIKE ${pattern} OR
          ${founders.academicField} LIKE ${pattern} OR
          ${founders.rolesICouldTake} LIKE ${pattern} OR
          ${founders.interestedInWorkingOn} LIKE ${pattern}
        )`,
                sql`${founders.introduction} IS NOT NULL`
            )
        );

    return deduplicateFounders(foundersData).map(mapToFounder);
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

    return deduplicateFounders(foundersData).map(mapToFounder);
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

    return deduplicateFounders(foundersData).map(mapToFounder);
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

    return deduplicateFounders(foundersData).map(mapToFounder);
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

    return deduplicateFounders(foundersData).map(mapToFounder);
}

/**
 * Get founders by education (searches in education and academicField fields, Profile Book only)
 * Fixed: Uses OR logic so founders match if EITHER field contains the search term
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
                sql`(
          ${founders.education} LIKE ${pattern} OR
          ${founders.academicField} LIKE ${pattern}
        )`,
                sql`${founders.introduction} IS NOT NULL`
            )
        );

    return deduplicateFounders(foundersData).map(mapToFounder);
}

/**
 * Get founders by project (searches in introduction field for project mentions, Profile Book only)
 * Fixed: Actually searches introduction field for project-related keywords
 * Note: No dedicated project fields in schema, so we search introductions where founders describe their projects
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
                like(founders.introduction, pattern),
                sql`${founders.introduction} IS NOT NULL`
            )
        );

    return deduplicateFounders(foundersData).map(mapToFounder);
}

/**
 * Global search across all text fields (Profile Book only)
 * Fixed: Uses OR logic so founders match if ANY field contains the search term
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
                sql`(
          ${founders.name} LIKE ${pattern} OR
          ${founders.techSkills} LIKE ${pattern} OR
          ${founders.industries} LIKE ${pattern} OR
          ${founders.companiesWorked} LIKE ${pattern} OR
          ${founders.introduction} LIKE ${pattern} OR
          ${founders.education} LIKE ${pattern} OR
          ${founders.academicField} LIKE ${pattern} OR
          ${founders.nationality} LIKE ${pattern} OR
          ${founders.status} LIKE ${pattern} OR
          ${founders.trackRecord} LIKE ${pattern} OR
          ${founders.rolesICouldTake} LIKE ${pattern} OR
          ${founders.interestedInWorkingOn} LIKE ${pattern}
        )`,
                sql`${founders.introduction} IS NOT NULL`
            )
        );

    return deduplicateFounders(foundersData).map(mapToFounder);
}

/**
 * Get active founders only (excluding those who left the program, Profile Book only)
 * Excludes when leftProgram contains "left" (e.g. "left after Selection Day", "left early")
 */
export async function getActiveFounders(): Promise<Founder[]> {
    const foundersData = await db
        .select()
        .from(founders)
        .where(
            and(
                sql`${founders.introduction} IS NOT NULL`,
                sql`(${founders.leftProgram} IS NULL OR ${founders.leftProgram} NOT LIKE '%left%')`,
            ),
        );

    return deduplicateFounders(foundersData).map(mapToFounder);
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
