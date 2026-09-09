import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function ejecutar() {
  const conexion = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'contraloria',
    charset: 'utf8mb4',
  });

  const usuario = process.argv[2] || 'jesus.mejias';
  const contrasena = process.argv[3] || 'Contraloria2026!';

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  const hash = await bcrypt.hash(contrasena, saltRounds);

  const [resultado] = await conexion.execute(
    'UPDATE users SET password_hash = ? WHERE username = ?',
    [hash, usuario]
  );

  if (resultado.affectedRows === 0) {
    console.log(`No se encontró el usuario "${usuario}" para actualizar el hash.`);
  } else {
    console.log(`Hash de contraseña actualizado para el usuario "${usuario}".`);
  }

  await conexion.end();
}

ejecutar().catch((error) => {
  console.error(error);
  process.exit(1);
});
