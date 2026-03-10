import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler } from './middlewares/error.middleware';

// Route imports
import authRoutes from './routes/auth.routes';
import candidateRoutes from './routes/candidate.routes';
import interviewRoutes from './routes/interview.routes';
import requirementRoutes from './routes/requirement.routes';
import uploadRoutes from './routes/upload.routes';
import notificationRoutes from './routes/notification.routes';
import applicationRoutes from './routes/application.routes';

const app = express();

// ─── GLOBAL MIDDLEWARE ──────────────────────────
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── HEALTH CHECK ───────────────────────────────
app.get('/api/health', (_, res) => {
    res.json({
        status: 'ok',
        service: 'HireOn Backend',
        timestamp: new Date().toISOString(),
    });
});

// ─── API ROUTES ─────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/requirements', requirementRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/applications', applicationRoutes);

// ─── ERROR HANDLER ──────────────────────────────
app.use(errorHandler as any);

// ─── START SERVER ───────────────────────────────
app.listen(config.port, () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║     🌟 HireOn Backend Server Running    ║
  ║     Port: ${String(config.port).padEnd(28)}  ║
  ║     Env:  ${config.nodeEnv.padEnd(28)}  ║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
