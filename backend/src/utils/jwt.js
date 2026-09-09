import jwt from 'jsonwebtoken';

export function firmarToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

export function verificarToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
