import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { config } from './config/index.js';
import sitesRouter from './routes/sites.js';
import templatesRouter from './routes/templates.js';
import { initTemplatesTable } from './services/masterDb.js';
import { authMiddleware, AuthenticatedRequest } from './middleware/auth.js';

const app = express();

// Initialize templates table
initTemplatesTable().catch(console.error);

// Middleware
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get current user info (including role from Firestore)
app.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const uid = req.user!.uid;
    const userDoc = await admin.firestore().collection('users').doc(uid).get();

    const userData = userDoc.exists ? userDoc.data() : {};

    return res.json({
      uid,
      email: req.user!.email,
      role: userData?.role || null,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Routes
app.use('/sites', sitesRouter);
app.use('/templates', templatesRouter);

// Error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
);

// Start server
app.listen(config.port, () => {
  console.log(`LunaSites API running on port ${config.port}`);
  console.log(`CORS origins: ${config.corsOrigins.join(', ')}`);
});
