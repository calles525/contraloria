import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carga las variables del archivo .env desde la raíz del backend
// sin depender del directorio de trabajo desde donde se inicie el proceso.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });