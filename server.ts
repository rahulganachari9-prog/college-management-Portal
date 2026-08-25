import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/api.ts';
import { seedDatabase } from './src/db/seed.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser with size limits
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Basic Security & CORS Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Automatically ensure seed data exists
  seedDatabase().catch((err) => {
    console.error('Initial DB seed warning:', err);
  });

  // Mount API router FIRST before Vite
  app.use('/api/v1', apiRouter);
  app.use('/api', apiRouter);

  // Fallback endpoint for root /api/health
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: 'v1.0.0', service: 'College Management System API' });
  });

  // Vite middleware for development
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
    console.log(`CMS Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
