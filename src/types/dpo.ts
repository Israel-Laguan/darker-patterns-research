import type { FieldValue, Timestamp } from 'firebase/firestore';

export interface DPOOption {
  key: 'A' | 'B';
  content: string;
  isDatasetAccepted: boolean;
}

export type RecentActivityItem = {
  type: 'evaluation' | 'flag' | 'new_participant';
  id: string;
  description: string;
  timestamp: Date;
  href?: string;
};

export type ChartableDemographics = {
  age: { name: string; value: number }[];
  technicalBackground: { name: string; value: number }[];
  aiFamiliarity: { name: string; value: number }[];
  education: { name: string; value: number }[];
};

export type ProjectProgressDataPoint = {
  date: string; // e.g., 'YYYY-MM-DD'
  count: number;
};

export interface DashboardData {
  totalEntries: number;
  entriesCompleted: number;
  avgTimePerEntry: string;
  activeParticipants: number;
  demographics: ChartableDemographics;
  recentActivity: RecentActivityItem[];
  projectProgress: ProjectProgressDataPoint[];
}

export interface DPOEntry {
  id: string;
  instruction: string;
  prompt?: string;
  acceptedResponse: string;
  rejectedResponse: string;
  categories: string[];
  researcherCategories?: string[];
  discussion?: string; // Optional explanation/discussion visible after evaluation
  reviewCount: number;
  targetReviewCount?: number;
  lastReviewedAt?: Timestamp | Date;
  createdAt?: Timestamp | Date;
  date: Timestamp | Date;
  isFlaggedCount?: number;
  lastFlaggedAt?: Timestamp | Date;

  // Fields for "Archive & Create New Version" strategy
  isArchived?: boolean; // True if this entry is an old version and superseded
  archivedAt?: Timestamp | Date; // The date when the entry was archived
  originalEntryId?: string; // If this entry is a new version, this links to the ID of the entry it corrects/revises
  supersededByEntryId?: string; // If this entry is archived, this links to the ID of the new entry that replaces it
  viewCount?: number;
}

export interface DemographicData {
  ageGroup?: string | null;
  gender?: string | null;
  genderOther?: string | null;
  educationLevel?: string | null;
  educationOther?: string | null;
  fieldOfExpertise?: string | null;
  expertiseOther?: string | null;
  aiFamiliarity?: string | null;
}

export interface EvaluationData {
  id?: string;
  participantSessionUid: string;
  dpoEntryId: string;
  chosenOptionKey: 'A' | 'B';
  wasChosenActuallyAccepted: boolean;
  agreementRating: number;
  categories: string[];
  comment?: string | null;
  timeSpentMs: number;
  submittedAt: Timestamp | Date;
}

// For EvaluationDraft used in SurveyProgressContext and EntryReviewStep
export type EvaluationDraft = Omit<EvaluationData, 'participantSessionUid' | 'submittedAt' | 'id'>;

export interface ParticipantSession {
  // id: string; // Document ID in Firestore is participantSessionUid
  participationType: 'email' | 'anonymous';
  email?: string | null;
  termsAgreed: boolean;
  demographics: DemographicData | null;
  assignedEntriesCount: number;
  completedEntriesCount: number;
  totalTimeSpentMsOnSurvey?: number;
  optedInForPaper?: boolean;
  createdAt?: Timestamp | Date; // Made optional, will be set on first write
  surveyCompletedAt?: Timestamp | Date | null;
}

export interface DPORevision {
  id: string;
  originalEntryId: string;
  submissionId?: string; // The ID of the submission that prompted this revision
  submittedBy: string; // UID of the user who submitted the revision
  submittedAt: Timestamp | Date | FieldValue;
  status: 'pending' | 'approved' | 'rejected';
  proposedChanges: Partial<DPOEntry>;
  reviewedBy?: string; // UID of the admin who reviewed it
  reviewedAt?: Timestamp | Date | FieldValue;
  reviewComments?: string;
}

export interface ParticipantFlag {
  id?: string; // Firestore document ID, auto-generated
  participantSessionUid: string;
  dpoEntryId: string;
  reason: string; // Could be one of predefined or "Other"
  comment?: string | null; // Detailed comment if reason is "Other" or additional notes
  flaggedAt: Timestamp | Date;
  categories?: string[];

  // For remediation workflow
  status: 'new' | 'under_review' | 'resolved' | 'rejected';
  remediatedBy?: string; // UID of the user who remediated it
  remediatedAt?: Timestamp | Date;
  remediationNotes?: string;
}
