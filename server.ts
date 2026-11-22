import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  runAdminFeedbackSummary,
  runAdminUnmetNeedsDiscovery,
  runLammahAgentChat,
} from './server/agent';
import type { LammahDatabase, UserRole } from './src/types/domain';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isValidDatabasePayload(value: unknown): value is LammahDatabase {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.members) &&
    Array.isArray(candidate.opportunities) &&
    Array.isArray(candidate.memberGoals) &&
    Array.isArray(candidate.registrations)
  );
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'lammah-cx-platform',
      geminiConfigured: Boolean(
        process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
      ),
    });
  });

  app.post('/api/agent/chat', async (req, res) => {
    try {
      const { db, activeMemberId, actorRole, history, message } = req.body ?? {};

      if (!isValidDatabasePayload(db)) {
        res.status(400).json({ error: 'بيانات النموذج المرسلة غير مكتملة أو غير صالحة.' });
        return;
      }
      if (typeof message !== 'string' || !message.trim() || message.length > 2000) {
        res.status(400).json({ error: 'يرجى كتابة رسالة صالحة لا تتجاوز 2000 حرف.' });
        return;
      }

      const safeRole: UserRole = actorRole === 'admin' ? 'admin' : 'member';
      const safeMemberId =
        typeof activeMemberId === 'string' && activeMemberId.trim()
          ? activeMemberId.trim()
          : db.activeMemberId;

      const safeHistory = Array.isArray(history)
        ? history
            .filter(
              (item): item is { role: 'user' | 'assistant'; content: string } =>
                Boolean(item) &&
                (item.role === 'user' || item.role === 'assistant') &&
                typeof item.content === 'string'
            )
            .slice(-10)
        : [];

      const result = await runLammahAgentChat({
        db,
        activeMemberId: safeMemberId,
        actorRole: safeRole,
        history: safeHistory,
        message: message.trim(),
      });

      res.json(result);
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : 'تعذر الاتصال بوكيل لمّاح الذكي حاليًا.';
      console.error('[Lammah Agent Chat Error]', error);
      res.status(500).json({
        error: errMsg,
      });
    }
  });

  app.post('/api/agent/summarize-feedback', async (req, res) => {
    try {
      const { db } = req.body ?? {};
      if (!isValidDatabasePayload(db)) {
        res.status(400).json({ error: 'بيانات النموذج غير صالحة.' });
        return;
      }
      if (db.stickyNotes.length === 0 && db.renewalFeedbacks.length === 0) {
        res.status(400).json({ error: 'لا توجد ملاحظات أو تقييمات كافية للتلخيص بعد.' });
        return;
      }

      const result = await runAdminFeedbackSummary(db);
      res.json(result);
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : 'تعذر توليد ملخص الملاحظات عبر Gemini حاليًا.';
      console.error('[Lammah Feedback Summary Error]', error);
      res.status(500).json({ error: errMsg });
    }
  });

  app.post('/api/agent/discover-needs', async (req, res) => {
    try {
      const { db } = req.body ?? {};
      if (!isValidDatabasePayload(db)) {
        res.status(400).json({ error: 'بيانات النموذج غير صالحة.' });
        return;
      }

      const result = await runAdminUnmetNeedsDiscovery(db);
      res.json(result);
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : 'تعذر تحليل الاحتياجات غير الملباة عبر Gemini.';
      console.error('[Lammah Discover Needs Error]', error);
      res.status(500).json({ error: errMsg });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lammah server running on http://localhost:${PORT}`);
  });
}

startServer();
