import { verificarToken } from '../utils/jwt.js';

export function protegerRuta(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado. Token no proporcionado.' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = verificarToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalido o expirado.' });
  }
}
