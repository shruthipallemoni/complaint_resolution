import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { init_db, get_connection, init_reviews_table } from './server/persistance/db';
import { load_pending_review } from './server/persistance/review_repo';
import { ComplaintFlow } from './server/flow';
import { resume_review, send_review_email } from './server/services/review_resolution';
import { send_email } from './server/services/email';
import type { ComplaintRequest, ReviewDecisionRequest } from './src/types';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing middleware
  app.use(express.json());

  // Startup hooks matching FastAPI @app.on_event("startup")
  init_db();
  init_reviews_table();

  // CORS middleware matching FastAPI CORSMiddleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Methods', '*');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // -------------------------------------------------------------
  // API Routes matching FastAPI endpoints exactly (both / and /api/)
  // -------------------------------------------------------------

  // POST /complaints
  const handleComplaint = async (req: express.Request, res: express.Response) => {
    try {
      const { customer_id, customer_email, complaint_text } = req.body as ComplaintRequest;
      if (!customer_id || !customer_email || !complaint_text) {
        return res.status(422).json({ detail: 'customer_id, customer_email and complaint_text are required' });
      }

      const flow = new ComplaintFlow({ interactive: false });
      const result = await flow.kickoff({ customer_id, customer_email, complaint_text });

      if (result.status === 'pending_review') {
        return res.json({ status: 'pending_review', review_id: result.review_id });
      }
      return res.json({ status: 'resolved', result: result.result });
    } catch (err: any) {
      console.error('Error submitting complaint:', err);
      return res.status(500).json({ detail: err.message || 'Internal Server Error' });
    }
  };

  app.post('/complaints', handleComplaint);
  app.post('/api/complaints', handleComplaint);

  // NOTE: static-path route MUST be defined before GET /reviews/{review_id}
  // GET /reviews/pending
  const handleListPending = (req: express.Request, res: express.Response) => {
    try {
      const conn = get_connection();
      const rows = conn
        .execute("SELECT review_id, state_json, created_at FROM pending_reviews WHERE status = 'pending'")
        .fetchall();
      conn.close();

      const response = rows.map((r: any) => ({
        review_id: r.review_id,
        state: typeof r.state_json === 'string' ? JSON.parse(r.state_json) : r.state_json,
        created_at: r.created_at,
      }));

      return res.json(response);
    } catch (err: any) {
      console.error('Error listing pending reviews:', err);
      return res.status(500).json({ detail: err.message || 'Internal Server Error' });
    }
  };

  app.get('/reviews/pending', handleListPending);
  app.get('/api/reviews/pending', handleListPending);

  // GET /reviews/:review_id
  const handleGetReview = (req: express.Request, res: express.Response) => {
    try {
      const { review_id } = req.params;
      const record = load_pending_review(review_id);

      if (!record) {
        return res.status(404).json({ detail: 'Review not found' });
      }
      if (record.status !== 'pending') {
        return res.status(409).json({ detail: `Review already ${record.status}` });
      }

      const state = record.state;
      return res.json({
        review_id,
        complaint_text: state.complaint_text,
        classification: state.classification,
        risk_assessment: state.risk_assessment,
        guardrail_exhausted: state.guardrail_exhausted ?? false,
        current_draft: state.current_draft,
      });
    } catch (err: any) {
      console.error('Error fetching review:', err);
      return res.status(500).json({ detail: err.message || 'Internal Server Error' });
    }
  };

  app.get('/reviews/:review_id', handleGetReview);
  app.get('/api/reviews/:review_id', handleGetReview);

  // POST /reviews/:review_id/decision
  const handleDecision = async (req: express.Request, res: express.Response) => {
    try {
      const { review_id } = req.params;
      const { decision, edited_reply } = req.body as ReviewDecisionRequest;

      // Pydantic validator emulation:
      // check_edited_reply_required
      if (decision === 'edit' && (!edited_reply || !edited_reply.trim())) {
        return res.status(422).json({ detail: "edited_reply is required when decision is 'edit'" });
      }
      if (decision !== 'edit' && edited_reply !== null && edited_reply !== undefined && edited_reply !== '') {
        return res.status(422).json({ detail: "edited_reply must be null when decision is 'approve' or 'reject'" });
      }

      const result = await resume_review(review_id, decision, edited_reply);
      return res.json({ status: 'resolved', result });
    } catch (err: any) {
      console.error('Error in review decision:', err);
      const statusCode = err.message === 'Review not found' ? 404 : err.message.includes('already') ? 409 : 400;
      return res.status(statusCode).json({ detail: err.message || 'Decision failed' });
    }
  };

  app.post('/reviews/:review_id/decision', handleDecision);
  app.post('/api/reviews/:review_id/decision', handleDecision);

  const handleSendEmail = async (req: express.Request, res: express.Response) => {
    try {
      const message = await send_review_email(req.params.review_id, send_email);
      return res.json({ status: 'sent', message, recipient: load_pending_review(req.params.review_id)?.customer_id });
    } catch (err: any) {
      const statusCode = err.message === 'Review not found' ? 404 : err.message.includes('Approve') ? 409 : 502;
      return res.status(statusCode).json({ detail: err.message || 'Email delivery failed' });
    }
  };

  app.post('/reviews/:review_id/send-email', handleSendEmail);
  app.post('/api/reviews/:review_id/send-email', handleSendEmail);

  // Helper endpoint to clear database reviews
  app.post('/api/reset-demo', (req, res) => {
    init_reviews_table();
    return res.json({ status: 'ok', message: 'Reviews table cleared' });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // -------------------------------------------------------------
  // Vite Integration & Static Frontend Serving
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Resolver AI API running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
