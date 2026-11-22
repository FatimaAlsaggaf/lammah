export type UserRole = 'member' | 'admin';

export type GoalCategory =
  | 'professional_skills'
  | 'events_workshops'
  | 'networking'
  | 'volunteering'
  | 'career_opportunities'
  | 'knowledge_sharing'
  | 'custom';

export interface MemberGoal {
  id: string;
  memberId: string;
  category: GoalCategory;
  title: string;
  customDescription?: string;
  topics: string[];
  status: 'active' | 'in_progress' | 'achieved';
  progressPercent: number;
  createdAt: string;
}

export interface Member {
  id: string;
  fullName: string;
  jobTitle: string;
  organization: string;
  city: string;
  email: string;
  membershipTier: 'عضوية احترافية (تجريبي)' | 'عضوية منتسب (تجريبي)' | 'عضوية طالب (تجريبي)';
  joinedAt: string;
  renewalDate: string;
  onboardingCompleted: boolean;
  interests: string[];
  isNewThisMonth: boolean;
}

export type OpportunityCategory =
  | 'ورشة عمل'
  | 'لقاء حواري'
  | 'تطوع مهني'
  | 'تواصل مهني'
  | 'إرشاد وتطوير'
  | 'فرصة مهنية';

export type AttendanceMode = 'حضوري' | 'عن بُعد' | 'هجين';

export interface Opportunity {
  id: string;
  title: string;
  shortDescription: string;
  fullDetails: string;
  category: OpportunityCategory;
  tags: string[];
  date: string;
  time: string;
  location: string;
  attendanceMode: AttendanceMode;
  requirements?: string;
  capacity: number;
  status: 'published' | 'draft' | 'archived';
  isDemoData: true;
  imageVariant: 'workshop' | 'networking' | 'volunteering';
  sourceProposalId?: string;
  pointsRewardType: 'event_attendance' | 'volunteer_activity';
}

export type RegistrationStatus = 'registered' | 'cancelled';

export interface Registration {
  id: string;
  memberId: string;
  opportunityId: string;
  status: RegistrationStatus;
  registeredAt: string;
  source: 'portal' | 'agent_confirmed';
}

export interface AttendanceRecord {
  id: string;
  registrationId: string;
  memberId: string;
  opportunityId: string;
  verified: boolean;
  verifiedAt: string;
  verifiedBy: string;
  notes?: string;
}

export type PointsRuleKey =
  | 'event_attendance'
  | 'volunteer_activity'
  | 'post_event_feedback'
  | 'renewal_feedback';

export interface PointsRule {
  key: PointsRuleKey;
  label: string;
  description: string;
  points: number;
  enabled: boolean;
}

export interface PointsTransaction {
  id: string;
  memberId: string;
  ruleKey: PointsRuleKey;
  activityRefId: string;
  points: number;
  reason: string;
  createdAt: string;
}

export type StickyNoteType = 'liked' | 'suggest' | 'issue';

export interface StickyNote {
  id: string;
  memberId: string;
  memberName: string;
  type: StickyNoteType;
  content: string;
  topic: string;
  isPrivateToAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RenewalIntent = 'definitely_renew' | 'likely_renew' | 'unsure' | 'not_renewing';

export interface RenewalFeedback {
  id: string;
  memberId: string;
  memberName: string;
  satisfactionRating: number; // 1..5
  valuePerceived: 'مرتفعة جدًا' | 'جيدة' | 'متوسطة' | 'محدودة';
  goalProgressRating: 'حققت معظم أهدافي' | 'تقدمت جزئيًا' | 'لا زلت في البداية' | 'لم أجد ما يناسبني';
  desiredServices: string[];
  renewalIntent: RenewalIntent;
  openComment?: string;
  submittedAt: string;
  isActualRenewalCompleted: false; // Explicit distinction between intent and actual payment/renewal
}

export type ProposalStatus = 'new' | 'under_review' | 'approved' | 'rejected';

export interface InitiativeProposal {
  id: string;
  title: string;
  shortDescription: string;
  rationale: string;
  interestedMemberCount: number;
  interestedMemberIds: string[];
  targetAudience: string;
  objectives: string[];
  suggestedTopicKey: string;
  status: ProposalStatus;
  createdBy: 'lammah_agent' | 'admin';
  createdAt: string;
  publishedOpportunityId?: string;
  adminNotes?: string;
}

export interface AgentActionLog {
  id: string;
  actorMemberId: string;
  actorRole: UserRole;
  toolName: string;
  summary: string;
  outcome: 'executed' | 'awaiting_confirmation' | 'declined' | 'info';
  timestamp: string;
}

export interface AppSettings {
  renewalPromptDaysBefore: number;
  associationDisplayName: string;
  demoModeNotice: string;
}

export interface FeedbackSummaryResult {
  generatedAt: string;
  totalNotesAnalyzed: number;
  topThemes: string[];
  likedHighlights: string[];
  improvementSuggestions: string[];
  issuesToAddress: string[];
  executiveSummary: string;
}

export interface LammahDatabase {
  version: number;
  activeMemberId: string;
  members: Member[];
  memberGoals: MemberGoal[];
  opportunities: Opportunity[];
  registrations: Registration[];
  attendanceRecords: AttendanceRecord[];
  pointsRules: PointsRule[];
  pointsTransactions: PointsTransaction[];
  stickyNotes: StickyNote[];
  renewalFeedbacks: RenewalFeedback[];
  initiativeProposals: InitiativeProposal[];
  agentActionLogs: AgentActionLog[];
  settings: AppSettings;
  lastFeedbackSummary?: FeedbackSummaryResult;
}

export interface AgentPendingAction {
  type: 'EVENT_REGISTRATION';
  memberId: string;
  opportunityId: string;
  opportunityTitle: string;
  opportunityDate: string;
  opportunityLocation: string;
  attendanceMode: AttendanceMode;
  reason: string;
}

export interface ExecutedToolTrace {
  name: string;
  labelAr: string;
  summary: string;
}

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  executedTools?: ExecutedToolTrace[];
  recommendedOpportunityIds?: string[];
  pendingAction?: AgentPendingAction;
  pendingActionStatus?: 'pending' | 'confirmed' | 'cancelled';
}
