import {
  type Content,
  type FunctionDeclaration,
  GoogleGenAI,
  Type,
} from '@google/genai';
import type {
  AgentPendingAction,
  ExecutedToolTrace,
  FeedbackSummaryResult,
  LammahDatabase,
  UserRole,
} from '../src/types/domain';
import { executeLammahTool } from '../src/services/agentTools';

const MODEL_NAME = 'gemini-3.1-flash-lite';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'مفتاح Gemini API غير مضبوط في بيئة الخادم. يرجى التأكد من تفعيل GEMINI_API_KEY في إعدادات الأسرار.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'getMemberGoals',
    description:
      'يقرأ ملف العضو الحالي وأهدافه المسجلة واهتماماته ورصيد نقاطه وتسجيلاته الحالية من قاعدة البيانات التجريبية.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        memberId: {
          type: Type.STRING,
          description: 'معرّف العضو (اختياري، الافتراضي هو العضو النشط حاليًا).',
        },
      },
    },
  },
  {
    name: 'searchOpportunities',
    description:
      'يبحث في قاعدة الفرص والفعاليات والورش المنشورة المتاحة في النموذج الأولي باستخدام كلمة مفتاحية أو تصنيف أو طريقة حضور.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'الكلمة المفتاحية أو المجال المطلوب البحث عنه بالعربية (مثل الذكاء الاصطناعي أو رحلة العميل).',
        },
        category: {
          type: Type.STRING,
          description: 'تصنيف الفرصة مثل: ورشة عمل، لقاء حواري، تطوع مهني، تواصل مهني، إرشاد وتطوير، فرصة مهنية.',
        },
        attendanceMode: {
          type: Type.STRING,
          description: 'طريقة الحضور: حضوري أو عن بُعد أو هجين.',
        },
      },
    },
  },
  {
    name: 'recommendOpportunities',
    description:
      'يرشّح أنسب الفرص والفعاليات المنشورة للعضو بناءً على أهدافه واهتماماته مع توضيح أسباب كل ترشيح.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        memberId: {
          type: Type.STRING,
          description: 'معرّف العضو المطلوب ترشيح الفرص له.',
        },
        limit: {
          type: Type.NUMBER,
          description: 'عدد التوصيات المطلوب إرجاعها (من 1 إلى 6).',
        },
      },
    },
  },
  {
    name: 'requestEventRegistration',
    description:
      'يجهّز طلب تسجيل تجريبي في فعالية محددة ويعرض بطاقة موافقة للعضو قبل تنفيذ التسجيل فعليًا. لا ينفذ التسجيل دون موافقة العضو.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        memberId: {
          type: Type.STRING,
          description: 'معرّف العضو.',
        },
        opportunityId: {
          type: Type.STRING,
          description: 'معرّف الفعالية المنشورة المطلوب التسجيل فيها.',
        },
        reason: {
          type: Type.STRING,
          description: 'سبب ترشيح هذه الفعالية للعضو.',
        },
      },
      required: ['opportunityId'],
    },
  },
  {
    name: 'analyzeUnmetNeeds',
    description:
      'يحلل أهداف واهتمامات جميع الأعضاء التجريبيين ويكتشف الاحتياجات المشتركة التي لا تغطيها الفرص المنشورة حاليًا.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'createInitiativeProposal',
    description:
      'ينشئ مقترح ورشة أو مبادرة جديدة بناءً على احتياج غير ملبى تم اكتشافه فعليًا عبر analyzeUnmetNeeds، ويرفعه مباشرة للوحة إدارة الجمعية.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'عنوان الورشة أو المبادرة المقترحة.',
        },
        shortDescription: {
          type: Type.STRING,
          description: 'وصف مختصر وواضح للورشة المقترحة.',
        },
        rationale: {
          type: Type.STRING,
          description: 'سبب الاقتراح مستندًا إلى عدد الأعضاء المهتمين وعدم توفر فعالية حالية.',
        },
        suggestedTopicKey: {
          type: Type.STRING,
          description: 'الموضوع الأساسي للاحتياج غير الملبى كما ظهر في نتائج analyzeUnmetNeeds.',
        },
        targetAudience: {
          type: Type.STRING,
          description: 'الفئة المستهدفة من أعضاء الجمعية.',
        },
        objectives: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'قائمة من 3 إلى 4 أهداف عملية للورشة المقترحة.',
        },
      },
      required: ['title', 'shortDescription', 'suggestedTopicKey', 'targetAudience', 'objectives'],
    },
  },
  {
    name: 'summarizeMemberFeedback',
    description:
      'يجلب جميع ملاحظات Sticky Notes وتقييمات التجديد الخاصة بالأعضاء لتلخيص الأنماط المتكررة وجوانب التحسين للإدارة.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

const TOOL_LABELS_AR: Record<string, string> = {
  getMemberGoals: 'تحليل أهداف وملف العضو',
  searchOpportunities: 'البحث في الفرص المتاحة',
  recommendOpportunities: 'ترشيح فرص مخصصة',
  requestEventRegistration: 'تجهيز طلب تسجيل بموافقة العضو',
  analyzeUnmetNeeds: 'اكتشاف الاحتياجات غير الملباة',
  createInitiativeProposal: 'إنشاء مقترح مبادرة للإدارة',
  summarizeMemberFeedback: 'تحليل ملاحظات وتقييمات الأعضاء',
};

export interface ChatTurnInput {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentChatResponse {
  reply: string;
  updatedDb: LammahDatabase;
  executedTools: ExecutedToolTrace[];
  recommendedOpportunityIds?: string[];
  pendingAction?: AgentPendingAction;
}

export async function runLammahAgentChat(params: {
  db: LammahDatabase;
  activeMemberId: string;
  actorRole: UserRole;
  history: ChatTurnInput[];
  message: string;
}): Promise<AgentChatResponse> {
  const ai = getGeminiClient();
  let workingDb = params.db;
  const activeMember = workingDb.members.find((m) => m.id === params.activeMemberId);

  const systemInstruction = `أنت "لمّاح"، وكيل الذكاء الاصطناعي الذكي لمنصة إدارة رحلة أعضاء الجمعيات (نموذج أولي موجّه لجمعية تجربة العميل السعودية في هاكاثون تجربة العميل السعودي).

قواعد العمل الإلزامية:
1. تحدث بالعربية الواضحة والمهنية والودودة وبأسلوب مختصر ومفيد دون حشو.
2. لا تخترع أبدًا فعاليات أو بيانات أو روابط أو سياسات رسمية غير موجودة في نتائج الأدوات. اعتمد حصريًا على المعلومات التي ترجعها الأدوات، وصرح بوضوح عندما لا تتوفر معلومة موثوقة في البيانات المتاحة.
3. استخدم الأدوات الفعلية (Function Calling) قبل الإجابة كلما تعلق السؤال بأهداف العضو أو البحث عن الفرص أو الترشيح أو التسجيل أو اكتشاف الاحتياجات أو رفع مقترح للإدارة أو تلخيص الملاحظات:
   - عند سؤال العضو عن فرص تناسبه أو عن موضوع محدد (مثل الذكاء الاصطناعي في تجربة العميل)، استدعِ getMemberGoals و searchOpportunities (أو recommendOpportunities).
   - إذا لم تجد فعالية منشورة تغطي موضوعًا يهتم به العضو، استدعِ analyzeUnmetNeeds فورًا للتحقق مما إذا كان هناك اهتمام مشترك بين عدة أعضاء في البيانات التجريبية.
   - إذا وجدت احتياجًا غير ملبى مشتركًا (مثل الذكاء الاصطناعي في تجربة العميل) ولا يوجد له مقترح نشط بعد، استدعِ createInitiativeProposal لرفع مقترح ورشة حقيقي للوحة إدارة الجمعية، وأبلغ العضو بوضوح أنك رصدت اهتمامًا مشتركًا ورفعت المقترح للإدارة لمراجعته واعتماده!
   - إذا طلب العضو التسجيل في فعالية محددة، استدعِ requestEventRegistration فقط لتجهيز بطاقة الموافقة، ووضّح له أن التسجيل لم يُنفذ بعد وبانتظار ضغطه على زر "تأكيد التسجيل التجريبي". لا تدّعِ أبدًا أن التسجيل اكتمل قبل موافقة العضو.
   - وضّح دائمًا أن الفعاليات والنقاط الحالية هي ضمن نموذج عرض تجريبي (DEMO)، وأن نقاط الحضور لا تُحتسب إلا بعد اعتماد الحضور الفعلي من الإدارة.

السياق الحالي:
- الدور النشط: ${params.actorRole === 'admin' ? 'إدارة الجمعية (حساب تجريبي)' : 'عضو الجمعية (حساب تجريبي)'}
- العضو النشط: ${activeMember ? `${activeMember.fullName} (${activeMember.id}) — ${activeMember.jobTitle}، المدينة: ${activeMember.city}` : params.activeMemberId}`;

  const contents: Content[] = [
    ...params.history.slice(-10).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })),
    {
      role: 'user',
      parts: [{ text: params.message }],
    },
  ];

  const executedTools: ExecutedToolTrace[] = [];
  const recommendedOpportunityIds = new Set<string>();
  let pendingAction: AgentPendingAction | undefined;

  // Up to 5 tool-calling iterations so Gemini can chain:
  // getMemberGoals -> searchOpportunities -> analyzeUnmetNeeds -> createInitiativeProposal -> final answer
  let finalReply = '';
  for (let step = 0; step < 5; step++) {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      },
    });

    const candidateContent = response.candidates?.[0]?.content;
    const functionCalls = response.functionCalls;

    if (!functionCalls || functionCalls.length === 0) {
      finalReply = (response.text ?? '').trim();
      break;
    }

    if (candidateContent) {
      contents.push(candidateContent);
    }

    const functionResponseParts = [];
    for (const call of functionCalls) {
      const toolName = call.name ?? 'unknown';
      const toolArgs = (call.args ?? {}) as Record<string, unknown>;
      const outcome = executeLammahTool(toolName, toolArgs, {
        db: workingDb,
        activeMemberId: params.activeMemberId,
        actorRole: params.actorRole,
        pendingAction,
      });

      workingDb = outcome.updatedDb;
      if (outcome.pendingAction) {
        pendingAction = outcome.pendingAction;
      }

      if (toolName === 'recommendOpportunities' && Array.isArray(outcome.result.recommendations)) {
        for (const item of outcome.result.recommendations as { id?: string }[]) {
          if (item?.id) recommendedOpportunityIds.add(item.id);
        }
      }
      if (toolName === 'searchOpportunities' && Array.isArray(outcome.result.opportunities)) {
        for (const item of (outcome.result.opportunities as { id?: string }[]).slice(0, 3)) {
          if (item?.id) recommendedOpportunityIds.add(item.id);
        }
      }

      executedTools.push({
        name: toolName,
        labelAr: outcome.labelAr || TOOL_LABELS_AR[toolName] || toolName,
        summary: outcome.summary,
      });

      functionResponseParts.push({
        functionResponse: {
          id: call.id,
          name: toolName,
          response: outcome.result,
        },
      });
    }

    contents.push({
      role: 'user',
      parts: functionResponseParts,
    });
  }

  if (!finalReply) {
    finalReply =
      'أتممت تنفيذ الفحص المطلوب على بيانات النموذج. يمكنك مراجعة نتائج الأدوات المنفذة أعلاه أو طرح سؤال إضافي.';
  }

  return {
    reply: finalReply,
    updatedDb: workingDb,
    executedTools,
    recommendedOpportunityIds: Array.from(recommendedOpportunityIds).slice(0, 3),
    pendingAction,
  };
}

export async function runAdminFeedbackSummary(
  db: LammahDatabase
): Promise<{ summary: FeedbackSummaryResult; updatedDb: LammahDatabase }> {
  const ai = getGeminiClient();

  const feedbackPayload = {
    stickyNotes: db.stickyNotes.map((n) => ({
      type: n.type,
      topic: n.topic,
      content: n.content,
    })),
    renewalFeedbacks: db.renewalFeedbacks.map((r) => ({
      satisfactionRating: r.satisfactionRating,
      valuePerceived: r.valuePerceived,
      goalProgressRating: r.goalProgressRating,
      desiredServices: r.desiredServices,
      renewalIntent: r.renewalIntent,
      openComment: r.openComment,
    })),
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `حلل ملاحظات أعضاء الجمعية وتقييمات التجديد التالية، وقدّم ملخصًا تنفيذيًا دقيقًا لإدارة الجمعية بالعربية اعتمادًا فقط على البيانات المرفقة دون اختراع أي أرقام أو ملاحظات غير موجودة:\n\n${JSON.stringify(feedbackPayload, null, 2)}`,
    config: {
      systemInstruction:
        'أنت محلل تجربة عضو لجمعية تجربة العميل السعودية. التزم حرفيًا بالبيانات المرفقة فقط وقدّم مخرجات JSON منظمة باللغة العربية الواضحة.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          executiveSummary: {
            type: Type.STRING,
            description: 'ملخص تنفيذي من جملتين إلى 3 جمل يصف أبرز ما ورد في الملاحظات والتقييمات.',
          },
          topThemes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'أبرز 3 إلى 4 محاور متكررة في الملاحظات.',
          },
          likedHighlights: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'أبرز نقاط القوة التي أعجبت الأعضاء.',
          },
          improvementSuggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'أبرز المقترحات التطويرية القابلة للتنفيذ.',
          },
          issuesToAddress: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'المشكلات أو نقاط الاحتكاك التي تحتاج معالجة سريعة.',
          },
        },
        required: [
          'executiveSummary',
          'topThemes',
          'likedHighlights',
          'improvementSuggestions',
          'issuesToAddress',
        ],
      },
    },
  });

  const parsed = JSON.parse((response.text ?? '{}').trim()) as Omit<
    FeedbackSummaryResult,
    'generatedAt' | 'totalNotesAnalyzed'
  >;

  const summary: FeedbackSummaryResult = {
    generatedAt: new Date().toISOString(),
    totalNotesAnalyzed: db.stickyNotes.length,
    executiveSummary: parsed.executiveSummary || 'تم تحليل ملاحظات الأعضاء المتاحة.',
    topThemes: Array.isArray(parsed.topThemes) ? parsed.topThemes : [],
    likedHighlights: Array.isArray(parsed.likedHighlights) ? parsed.likedHighlights : [],
    improvementSuggestions: Array.isArray(parsed.improvementSuggestions)
      ? parsed.improvementSuggestions
      : [],
    issuesToAddress: Array.isArray(parsed.issuesToAddress) ? parsed.issuesToAddress : [],
  };

  const updatedDb: LammahDatabase = {
    ...db,
    lastFeedbackSummary: summary,
    agentActionLogs: [
      {
        id: `log-${Date.now()}`,
        actorMemberId: db.activeMemberId,
        actorRole: 'admin' as const,
        toolName: 'summarizeMemberFeedback',
        summary: `ولّد لمّاح ملخصًا ذكيًا لـ ${db.stickyNotes.length} ملاحظات و${db.renewalFeedbacks.length} تقييمات تجديد.`,
        outcome: 'executed' as const,
        timestamp: summary.generatedAt,
      },
      ...db.agentActionLogs,
    ].slice(0, 60),
  };

  return { summary, updatedDb };
}

export async function runAdminUnmetNeedsDiscovery(db: LammahDatabase): Promise<AgentChatResponse> {
  return runLammahAgentChat({
    db,
    activeMemberId: db.activeMemberId,
    actorRole: 'admin',
    history: [],
    message:
      'افحص جميع أهداف واهتمامات الأعضاء الآن باستخدام analyzeUnmetNeeds، وإذا وجدت احتياجًا غير ملبى مشتركًا لا يوجد له مقترح نشط حتى الآن فأنشئ له مقترح ورشة عملي باستخدام createInitiativeProposal وقدّم ملخصًا واضحًا للإدارة.',
  });
}
