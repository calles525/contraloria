import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';

export interface NotificacionSocket {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
}

let socket: Socket | null = null;

// El WebSocket se sirve en el mismo servidor que la API REST.
const origenServidor = new URL(API_URL).origin;

/**
 * Conecta (o reutiliza) el socket de notificaciones autenticado con el token
 * del usuario y registra el manejador del evento "notificacion:nueva".
 */
export function conectarSocket(token: string, alRecibir: (notificacion: NotificacionSocket) => void) {
  if (!socket) {
    socket = io(origenServidor, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
  }

  socket.off('notificacion:nueva');
  socket.on('notificacion:nueva', alRecibir);
  return socket;
}

/** Desconecta el socket y libera la referencia. */
export function desconectarSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}