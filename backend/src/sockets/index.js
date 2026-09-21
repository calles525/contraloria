import { Server } from 'socket.io';
import { verificarToken } from '../utils/jwt.js';
import { opcionesCorsSocket } from '../config/cors.js';

let io = null;

/** Inicia el servidor de Socket.IO sobre el mismo servidor HTTP de la API. */
export function iniciarSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: opcionesCorsSocket(),
  });

  // Autentica cada conexión con el mismo JWT usado por la API REST.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('No autorizado. Token no proporcionado.'));
    }
    try {
      const payload = verificarToken(token);
      socket.data.userId = payload.id;
      next();
    } catch (error) {
      next(new Error('Token invalido o expirado.'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);
  });

  return io;
}

/**
 * Emite una notificación en tiempo real a los usuarios conectados.
 *
 * @param {Array<{ userId: number, notificacion: object }>} notificaciones
 */
export function emitirNotificaciones(notificaciones) {
  if (!io) return;
  for (const { userId, notificacion } of notificaciones) {
    io.to(`user:${userId}`).emit('notificacion:nueva', notificacion);
  }
}