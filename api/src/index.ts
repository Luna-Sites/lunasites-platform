import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import sitesRouter from './routes/sites.js';
import templatesRouter from './routes/templates.js';
import { initTemplatesTable } from './services/masterDb.js';

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
