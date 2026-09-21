import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raizBackend = path.resolve(__dirname, '../..');

// Determina el entorno antes de cargar dotenv (las variables reales del
// proceso siempre ganan porque dotenv no sobreescribe).
const entorno = process.env.NODE_ENV || 'development';

if (entorno === 'production') {
  dotenv.config({ path: path.resolve(raizBackend, '.env.production') });
}

// Carga las variables del archivo .env desde la raíz del backend
// sin depender del directorio de trabajo desde donde se inicie el proceso.
// En producción se carga primero .env.production y luego .env (respaldo);
// dotenv no sobreescribe, por lo que .env.production mantiene prioridad.
dotenv.config({ path: path.resolve(raizBackend, '.env') });