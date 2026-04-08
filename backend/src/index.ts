import 'dotenv/config';
import express, {
  Express,
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';

// Importer les routes
import authRoutes from './routes/auth.routes';
import employeesRoutes from './routes/employees.routes';
import rolesRoutes from './routes/roles.routes';
import permissionsRoutes from './routes/permissions.routes';
import attendanceRoutes from './routes/attendance.routes';
import commandesRoutes from './routes/commandes.routes';
import menusRoutes from './routes/menus.routes';
import clientsRoutes from './routes/clients.routes';
import financesRoutes from './routes/finances.routes';
import messagesRoutes from './routes/messages.routes';
import statsRoutes from './routes/stats.routes';
import notificationsRoutes from './routes/notifications.routes';
import cronRoutes from './routes/cron.routes';
import settingsRoutes from './routes/settings.routes';

// Importer les middlewares
import { securityLogger } from './middlewares/securityLogger';
import { rateLimiter } from './middlewares/rateLimiter';

// Initialiser Express
const app: Express = express();
const PORT = process.env.PORT || 4000;

// ===== SÉCURITÉ =====
app.use(helmet());
app.use(securityLogger);

// ===== COMPRESSION ET PARSING =====
app.use(compression());
app.use(
  express.json({
    limit: '10mb',
  })
);
app.use(
  express.urlencoded({
    limit: '10mb',
    extended: true,
  })
);

// ===== CORS =====
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.BACKOFFICE_URL || 'http://localhost:3001',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
};
app.use(cors(corsOptions));

// ===== RATE LIMITING =====
app.use('/api/', rateLimiter);

// ===== ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/commandes', commandesRoutes);
app.use('/api/menus', menusRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/finances', financesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/settings', settingsRoutes);

// ===== ROUTE SANTÉ =====
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== ROUTE 404 =====
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée',
    path: req.path,
  });
});

// ===== GESTIONNAIRE D'ERREURS GLOBAL =====
const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Erreur serveur:', err);

  // Erreur de validation Zod
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'Erreur de validation',
      details: (err as any).errors,
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token invalide',
    });
  }

  // Erreur TokenExpiredError
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expiré',
    });
  }

  // Erreur par défaut
  return res.status(500).json({
    success: false,
    error: 'Erreur serveur interne',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

app.use(errorHandler);

// ===== DÉMARRAGE DU SERVEUR =====
app.listen(PORT, () => {
  console.log(`🚀 Serveur Express démarré sur le port ${PORT}`);
  console.log(`Environnement: ${process.env.NODE_ENV}`);
  console.log(`📡 http://localhost:${PORT}`);
  console.log(`🏥 http://localhost:${PORT}/health`);
});

export default app;
