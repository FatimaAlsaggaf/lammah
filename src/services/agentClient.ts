import type {
  AgentPendingAction,
  ExecutedToolTrace,
  FeedbackSummaryResult,
  LammahDatabase,
  UserRole,
} from '../types/domain';

export interface AgentChatApiResponse {
  reply: string;
  updatedDb: LammahDatabase;
  executedTools: ExecutedToolTrace[];
  recommendedOpportunityIds?: string[];
  pendingAction?: AgentPendingAction;
}

export async function sendAgentChatMessage(payload: {
  db: LammahDatabase;
  activeMemberId: string;
  actorRole: UserRole;
  history: { role: 'user' | 'assistant'; content: string }[];
  message: string;
}): Promise<AgentChatApiResponse> {
  const response = await fetch('/api/agent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.error === 'string'
        ? data.error
        : 'تعذر التواصل مع وكيل لمّاح الذكي. يرجى المحاولة مرة أخرى.'
    );
  }
  return data as AgentChatApiResponse;
}

export async function requestFeedbackSummary(
  db: LammahDatabase
): Promise<{ summary: FeedbackSummaryResult; updatedDb: LammahDatabase }> {
  const response = await fetch('/api/agent/summarize-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ db }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.error === 'string'
        ? data.error
        : 'تعذر تلخيص الملاحظات عبر Gemini حاليًا.'
    );
  }
  return data as { summary: FeedbackSummaryResult; updatedDb: LammahDatabase };
}

export async function requestAdminUnmetNeedsDiscovery(
  db: LammahDatabase
): Promise<AgentChatApiResponse> {
  const response = await fetch('/api/agent/discover-needs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ db }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.error === 'string'
        ? data.error
        : 'تعذر تحليل الاحتياجات غير الملباة حاليًا.'
    );
  }
  return data as AgentChatApiResponse;
}
