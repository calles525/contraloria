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

// Página de presentación cuando se visita la API directamente en el navegador.
app.get('/', (req, res) => {
  res.type('html').send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sistema de Contraloria - API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #1e3a5f 0%, #12304f 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
    }
    .tarjeta {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      padding: 48px 56px;
      text-align: center;
      max-width: 520px;
    }
    h1 { font-size: 28px; margin-bottom: 12px; letter-spacing: 1px; }
    p { font-size: 15px; color: rgba(255, 255, 255, 0.75); line-height: 1.6; }
    code {
      display: inline-block;
      background: rgba(255, 255, 255, 0.12);
      border-radius: 6px;
      padding: 2px 8px;
      font-size: 13px;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="tarjeta">
    <h1>API del Sistema de Contraloria</h1>
    <p>El servicio esta en linea y funcionando correctamente.</p>
    <p>Estado: <code>/api/health</code></p>
  </div>
</body>
</html>`);
});

app.use('/api/auth', limitadorLogin, authRoutes);

app.use('/api', maestrosRoutes);
app.use('/api', solicitudesRoutes);
app.use('/api', bitacoraRoutes);
app.use('/api', notificacionesRoutes);

app.use(notFound);
app.use(manejarErrores);

export default app;
