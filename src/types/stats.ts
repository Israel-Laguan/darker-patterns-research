import type { Timestamp } from 'firebase/firestore';

export interface OverviewStats {
  totalEntriesInDataset?: number;
  totalEvaluationsSubmitted?: number;
  fullyReviewedEntriesCount?: number;
  usersWithEmailAddressCount?: number; // Participants who opted in with email
  averageTimePerEvaluationMs?: number;
  evaluationsCountForAvgTime?: number; // For rolling average of time
  participantFlagCount?: number; // Total flags across all entries
  totalAgreementCount?: number; // Sum of evaluations where user choice matched DPO accepted
  agreementRate?: number; // Percentage, e.g., 75 for 75%
  totalAnnotatedEntries?: number;
  totalEntriesWithUnresolvedFlags?: number;
  lastEvaluationAt?: Timestamp;
  lastUpdatedAt?: Timestamp;
}

export interface DemographicsDistribution {
  [key: string]: number; // e.g., {"18–24": 150, "25–34": 300}
}

export interface DemographicsSummary {
  ageGroupDistribution?: DemographicsDistribution;
  genderDistribution?: DemographicsDistribution;
  educationDistribution?: DemographicsDistribution;
  expertiseDistribution?: DemographicsDistribution;
  aiFamiliarityDistribution?: DemographicsDistribution;
  totalParticipantsWithDemographics?: number;
  lastUpdatedAt?: Timestamp;
}

export interface ResponseAggregates {
  ratingDistribution?: {
    // e.g., {"1_star": 50, "2_star": 100, ...}
    '1_star'?: number;
    '2_star'?: number;
    '3_star'?: number;
    '4_star'?: number;
    '5_star'?: number;
  };
  commentSubmissions?: number; // Total count of evaluations with comments
  commentSubmissionRatePercent?: number; // Percentage
  overallAnnotationPercent?: number;
  min10ReviewsPercent?: number;
  unresolvedFlagsPercent?: number;
  lastUpdatedAt?: Timestamp;
}

export interface ProjectProgressTimeseries {
  // For overview page chart (future use)
  dailySubmissions?: { [date_YYYY_MM_DD: string]: number }; // e.g., {"2023-10-26": 150}
  weeklySubmissions?: { [week_YYYY_WW: string]: number }; // e.g., {"2023-43": 800}
  lastUpdatedAt?: Timestamp;
}

// For `details` in ActivityLogItem (mirrors src/types/stats.ts suggestion):
// Discriminated union for better type safety of details based on eventType
type EvaluationSubmittedDetails = { rating: number; chosenOptionKey: 'A' | 'B'; wasResearcherAgreement: boolean };
type ParticipantSessionStartedDetails = { participationType: 'email' | 'anonymous'; emailProvided: boolean };
type ParticipantFlagSubmittedDetails = { reason: string; commentProvided: boolean };
export type ActivityLogDetails =
  | EvaluationSubmittedDetails
  | ParticipantSessionStartedDetails
  | ParticipantFlagSubmittedDetails;

export interface ActivityLogItem {
  id: string;
  timestamp: Timestamp;
  eventType: string;
  participantSessionUid?: string;
  dpoEntryId?: string;
  details?: unknown;
  displayText: string;
  iconName?: string;
  actionLink?: string;
  actionText?: string;
}

export interface LandingStats {
  agreementRate?: number;
  averageTimePerEvaluationMs?: number;
  evaluationsCountForAvg?: number;
  fullyReviewedEntriesCount?: number;
  lastEvaluationAt?: Timestamp | { seconds: number; nanoseconds: number };
  lastUpdatedAt?: Timestamp | { seconds: number; nanoseconds: number };
  totalAgreementCount?: number;
  totalEvaluationsSubmitted?: number;
  usersWithEmailAddressCount?: number;
}
