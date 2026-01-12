/**
 * Airtable field ID mapping for founders table
 * Maps schema field names to their corresponding Airtable field IDs
 * Source: data/2025-Cohort_Data/JSON/founders/pioneers-profile-book-table-ref.json
 */
export const founderAirtableFieldIds = {
  name: 'fldXCZWHOholJbcR2',
  status: 'fldIUIWQideaWfdiT',
  whatsapp: 'fldbtz03NepUnVH27',
  email: 'fldW6J9Dlp9vFvOKR',
  yourPhoto: 'flduygNAZDw15dcyK',
  existingProjectIdea: 'fldT1xLAq6sWDdYru',
  projectExplanation: 'fldSUjWFCUVNTVKBf',
  existingCofounderName: 'fldnlonPuFyv5EaLP',
  openToJoinAnotherProject: 'fldG8Dw7iV7RSWu56',
  joiningWithCofounder: 'fldqRh6cufYTp0FTF',
  linkedin: 'fldmOlACIX4XSmGfv',
  techSkills: 'fldJ9yZg6O6kMxJwQ',
  industries: 'fld0w3PxAafyQtwDx',
  rolesICouldTake: 'fldcASpXNUhURfM3e',
  trackRecordProud: 'fldxhTo33WQdcwN7W',
  interestedInWorkingOn: 'fld80oQIizX3pqKn8',
  introduction: 'fld3GPP09YrmwMgSU',
  companiesWorked: 'fldcuBy6DezL26rbs',
  education: 'fldwh9kSEbgWYvZwx',
  nationality: 'fldb2ZgofUqLgYr9D',
  gender: 'fld6sYQmTJAvxxh5Y',
  yearsOfXp: 'fldNlvxotHY13xj13',
  degree: 'fldadoQzo3ag7t8ng',
  academicField: 'fldzTd96TnSJ90VUm',
  founder: 'fldPCcEhQefOf94Vz',
  leftProgram: 'fldBepgICe1g9FANb',
} as const;


/**
 * Airtable field ID mapping for session events table
 * Maps schema field names to their corresponding Airtable field IDs
 * Source: data/2025-Cohort_Data/JSON/founders/session-event-table-ref.json
 */
export const sessionEventAirtableFieldIds = {
  name: 'fldCtRMft8LUuxeKo',
  date: 'fldBNgudcVrZQSrOc',
  programWeek: 'fldbYxhIxaeGW4Ssz',
  typeOfSession: 'fld4AgK4v55Yfv1Ow',
  speaker: 'fld4nkOUEspvZQ16w',
  emails: 'fldMrKHue2nm5HHyP',
  slackInstructionEmailCommu: 'flddmEbyJanfhr4Z3',
  notesFeedback: 'fldHBorqhtBKMncTH',
  attachments: 'fld9RFu4D1tSd5faT',
  participants: 'fld4crP1Y4ZefqIfn',
  nameFromLinked: 'fldOy6fvKgU7Lqln9',
  notes2: 'fld0KtDf2uaPgzmLZ',
} as const;

/**
 * Airtable field ID mapping for startups table
 * Maps schema field names to their corresponding Airtable field IDs
 * Source: data/2025-Cohort_Data/JSON/founders/startups-table-ref.json
 */
export const startupAirtableFieldIds = {
  startup: 'fldA82NTk7duTwdVO',
  pitchSequence: 'fld6Yx9hCxozMgknD',
  industry: 'flduc7bH38SHYwrSG',
  startupInAWord: 'fld6BW7qxBJ3YE2Wc',
  activeInactive: 'fldYpMoV3drUxnfZ8',
  weeklyForms: 'fldzdaRoe75HUWYmh',
  mainSu2025: 'fldSbVdRtv6an2dvj',
  mainSu20252: 'fldWgXcKYEkhjaKXf',
  teamMembers: 'fldyCgeN9ePx0chyW',
  notes: 'fldhGDTxgl3th6DkL',
  tractionSummary: 'fldLoDkUtrEVC8VLO',
  tractionSummaryOld: 'fldgcuEeyIKLRg6aT',
  maximeComment: 'fld01lYeq1NrVdCPA',
  detailedProgress: 'fld2Arvu7GVTN0phX',
  detailedProgressOld: 'fldlhhx2Gk9yHadsF', // ! NOTE: Do I need this?
  fullNotes: 'fldgokIMd3VxtBqvm',
  previousDecks: 'fldKmiI0gYosRaeh8',
  committee: 'fldUCeQYvsu5kiJil',
  fundingApplications: 'fldTu3HV4il5iwLxT',
  startupEvaluation: 'fld6a9TUTUeaNySzd',
  startupEvaluationCopy: 'fldv7klSlCJTIp4ZH',
} as const;
