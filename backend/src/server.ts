import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth.routes';
import reportRoutes from './routes/reports.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// ===== ROUTE DEBUG - à retirer en production stable =====
app.get('/api/debug', async (req, res) => {
  const info: any = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV || 'non définie',
      PORT: process.env.PORT || 'non définie',
      DATABASE_URL: process.env.DATABASE_URL ? '✅ Définie (' + process.env.DATABASE_URL.split('@')[1]?.split('/')[0] + ')' : '❌ MANQUANTE',
      JWT_SECRET: process.env.JWT_SECRET ? '✅ Définie' : '❌ MANQUANTE',
      FRONTEND_URL: process.env.FRONTEND_URL || 'non définie (autorisera toutes origines)',
    },
    database: 'Test en cours...'
  };

  try {
    const { PrismaClient } = require('@prisma/client');
    const testPrisma = new PrismaClient();
    await testPrisma.$queryRaw`SELECT 1`;
    await testPrisma.$disconnect();
    info.database = '✅ Connexion DB réussie';
  } catch (err: any) {
    info.database = '❌ Erreur DB: ' + err?.message;
    info.dbErrorCode = err?.code;
  }

  res.json(info);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
