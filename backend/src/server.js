import './config/env.js';
import http from 'node:http';
import app from './app.js';
import { pool } from './config/db.js';
import { iniciarSocketServer } from './sockets/index.js';

const PORT = process.env.PORT || 9999;

async function iniciar() {
  try {
    await pool.query('SELECT 1');
    console.log('Conexión a MySQL establecida.');

    const HOST = process.env.HOST || '0.0.0.0';
    const servidorHttp = http.createServer(app);
    iniciarSocketServer(servidorHttp);

    servidorHttp.listen(PORT, HOST, () => {
      console.log(`API de Contraloría escuchando en http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error.message);
    process.exit(1);
  }
}

iniciar();
