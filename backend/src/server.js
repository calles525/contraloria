import dotenv from 'dotenv';
import app from './app.js';
import { pool } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 3030;

async function iniciar() {
  try {
    await pool.query('SELECT 1');
    console.log('Conexión a MySQL establecida.');

    app.listen(PORT, () => {
      console.log(`API de Contraloría escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error.message);
    process.exit(1);
  }
}

iniciar();
