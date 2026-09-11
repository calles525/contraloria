import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import maestrosRoutes from './routes/maestros.routes.js';
import solicitudesRoutes from './routes/solicitudes.routes.js';
import bitacoraRoutes from './routes/bitacora.routes.js';
import notificacionesRoutes from './routes/notificaciones.routes.js';
import { notFound, manejarErrores } from './middlewares/error.middleware.js';

const app = express();

app.use(helmet());

const origenesPermitidos = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Si la lista contiene "*", se acepta cualquier origen.
const permitirTodosLosOrigenes = origenesPermitidos.includes('*');

app.use(
  cors({
    origin(origin, callback) {
      // Sin excepciones por entorno: solo se aceptan los orígenes listados,
      // salvo que CORS_ORIGIN contenga "*" (acepta cualquier origen).
      // Las peticiones sin origen (curl, Postman, misma app) se permiten.
      if (!origin || permitirTodosLosOrigenes || origenesPermitidos.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    // Expone los encabezados que el frontend necesita leer (nombre del archivo descargado).
    exposedHeaders: ['Content-Disposition', 'Content-Length'],
  })
);

app.use(express.json({ limit: '10kb' }));

const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos de inicio de sesión. Intente más tarde.' },
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', limitadorLogin, authRoutes);

app.use('/api', maestrosRoutes);
app.use('/api', solicitudesRoutes);
app.use('/api', bitacoraRoutes);
app.use('/api', notificacionesRoutes);

app.use(notFound);
app.use(manejarErrores);

export default app;
